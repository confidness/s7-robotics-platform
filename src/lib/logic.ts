/**
 * Pure state transitions. No React, no DOM — every rule of the product lives here
 * so the UI only has to render the result and the data layer can be swapped for an API.
 */
import type { AppState, Attachment, Competition, CompetitionTask, CustomLesson, Feedback, Group, LessonSubmission, Notification, Project, ProjectStatus, StudentProfile, TaskAnswer, Team, TextVars, User, XPTransaction } from './types'
import { MAX_TASKS_PER_LESSON } from './types'
import { evaluateAchievements } from './gamification'
import { courseLessonOrder } from './curriculum'
import { lessonById } from './selectors'

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`
const now = () => new Date().toISOString()

const patchProfile = (s: AppState, userId: string, patch: (p: StudentProfile) => StudentProfile): AppState => ({
  ...s,
  profiles: s.profiles.map((p) => (p.userId === userId ? patch(p) : p)),
})

export function notify(s: AppState, n: Omit<Notification, 'id' | 'createdAt' | 'read'>): AppState {
  return { ...s, notifications: [{ ...n, id: uid('n'), createdAt: now(), read: false }, ...s.notifications] }
}

/**
 * XP is paid once per thing, and this is where that is guaranteed.
 *
 * `refId` names the thing — a lesson, a challenge, a project, an achievement — so a second award
 * for the same one is refused no matter which path asked. Guarding each caller separately is how
 * a resubmitted project came to pay twice; one choke point cannot drift like that.
 */
export function awardXp(s: AppState, userId: string, amount: number, reason: string, kind: XPTransaction['kind'], refId?: string, vars?: TextVars): AppState {
  if (refId && s.xp.some((t) => t.userId === userId && t.kind === kind && t.refId === refId)) return s
  const tx: XPTransaction = { id: uid('xp'), userId, amount, reason, vars, kind, createdAt: now(), refId }
  return patchProfile({ ...s, xp: [tx, ...s.xp] }, userId, (p) => ({ ...p, xp: p.xp + amount }))
}

/** Grants any achievements the user now qualifies for, with XP and a notification each. */
export function syncAchievements(s: AppState, userId: string): AppState {
  let next = s
  for (const id of evaluateAchievements(next, userId)) {
    const achievement = next.achievements.find((a) => a.id === id)
    if (!achievement) continue
    next = patchProfile(next, userId, (p) => ({ ...p, unlockedAchievementIds: [...p.unlockedAchievementIds, id] }))
    next = awardXp(next, userId, achievement.xp, 'xp_achievement_unlocked', 'achievement', id, { achievementId: id })
    next = notify(next, { userId, title: 'notif_achievement_unlocked', body: 'notif_achievement_unlocked_body', vars: { achievementId: achievement.id, xp: achievement.xp }, kind: 'achievement', href: '/achievements' })
  }
  return next
}

/** Local calendar day. UTC keys would shift the streak by a day for anyone east of Greenwich. */
const dayKey = (value: Date | string) => {
  const d = new Date(value)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** Keeps the streak honest: same day is a no-op, yesterday extends, a gap resets to 1. */
export function touchStreak(s: AppState, userId: string): AppState {
  const profile = s.profiles.find((p) => p.userId === userId)
  if (!profile) return s
  const today = dayKey(new Date())
  const last = dayKey(profile.lastActiveDate)
  if (last === today) return s
  const streak = last === dayKey(new Date(Date.now() - 86_400_000)) ? profile.streak + 1 : 1
  return patchProfile(s, userId, (p) => ({ ...p, streak, lastActiveDate: now() }))
}

export function completeLesson(s: AppState, userId: string, lessonId: string): AppState {
  const lesson = lessonById(s, lessonId)
  const profile = s.profiles.find((p) => p.userId === userId)
  if (!lesson || !profile || profile.completedLessonIds.includes(lessonId)) return s

  let next = patchProfile(s, userId, (p) => ({ ...p, completedLessonIds: [...p.completedLessonIds, lessonId] }))
  next = awardXp(next, userId, lesson.xp, 'xp_lesson_completed', 'lesson', lessonId, { lessonId })

  const order = courseLessonOrder(lesson.courseId)
  const unlocked = lessonById(next, order[order.indexOf(lessonId) + 1])
  if (unlocked) {
    next = notify(next, {
      userId,
      title: 'notif_lesson_unlocked',
      body: 'notif_lesson_unlocked_body',
      vars: { lessonId: unlocked.id, courseId: lesson.courseId },
      kind: 'unlock',
      href: `/learn/${lesson.courseId}/${unlocked.id}`,
    })
  }
  next = touchStreak(next, userId)
  return syncAchievements(next, userId)
}

export function completeChallenge(s: AppState, userId: string, lessonId: string): AppState {
  const lesson = lessonById(s, lessonId)
  const profile = s.profiles.find((p) => p.userId === userId)
  if (!lesson || !profile || profile.completedChallengeIds.includes(lesson.challenge.id)) return s

  let next = patchProfile(s, userId, (p) => ({ ...p, completedChallengeIds: [...p.completedChallengeIds, lesson.challenge.id] }))
  next = awardXp(next, userId, lesson.challenge.xp, 'xp_challenge_completed', 'challenge', lesson.challenge.id, { challengeLessonId: lesson.id })
  next = touchStreak(next, userId)
  return syncAchievements(next, userId)
}

export interface ProjectDraft {
  id?: string
  title: string
  description: string
  code: string
  notes: string
  attachments: Attachment[]
  courseId: string
  lessonId: string
}

export const SUBMIT_XP = 25

export function upsertProject(s: AppState, userId: string, draft: ProjectDraft, status: Extract<ProjectStatus, 'draft' | 'submitted'>): { state: AppState; project: Project } {
  const existing = draft.id ? s.projects.find((p) => p.id === draft.id) : undefined
  const project: Project = {
    ...(existing ?? {
      id: uid('p'),
      authorId: userId,
      createdAt: now(),
      feedback: [],
      likes: 0,
      views: 0,
      tags: [],
      status: 'draft' as ProjectStatus,
    }),
    title: draft.title,
    description: draft.description,
    code: draft.code,
    notes: draft.notes,
    attachments: draft.attachments,
    courseId: draft.courseId,
    lessonId: draft.lessonId,
    status,
    submittedAt: status === 'submitted' ? now() : existing?.submittedAt,
    tags: existing?.tags?.length ? existing.tags : [s.courses.find((c) => c.id === draft.courseId)?.platform ?? 'arduino'],
  }

  let next: AppState = { ...s, projects: existing ? s.projects.map((p) => (p.id === project.id ? project : p)) : [project, ...s.projects] }

  if (status === 'submitted') {
    const author = next.users.find((u) => u.id === userId)
    next = awardXp(next, userId, SUBMIT_XP, 'xp_project_submitted', 'submission', project.id, { title: project.title })
    next = notify(next, { userId, title: 'notif_project_submitted', body: 'notif_project_submitted_body', vars: { title: project.title }, kind: 'system', href: `/projects/${project.id}` })
    for (const mentor of next.users.filter((u) => u.role === 'mentor')) {
      next = notify(next, {
        userId: mentor.id,
        title: 'notif_project_awaiting_review',
        body: 'notif_project_awaiting_review_body',
        vars: { student: author?.name ?? '', title: project.title, lessonId: draft.lessonId },
        kind: 'review',
        href: `/m/reviews/${project.id}`,
      })
    }
    next = touchStreak(next, userId)
    next = syncAchievements(next, userId)
  }

  return { state: next, project }
}

export function startReview(s: AppState, mentorId: string, projectId: string): AppState {
  return {
    ...s,
    projects: s.projects.map((p) => (p.id === projectId && p.status === 'submitted' ? { ...p, status: 'under_review', reviewerId: mentorId, views: p.views + 1 } : p)),
  }
}

export const APPROVAL_BONUS = 150

/** The centre of the product loop: a mentor decision moves XP, progress and unlocks. */
export function reviewProject(
  s: AppState,
  mentor: User,
  projectId: string,
  decision: 'approved' | 'needs_changes',
  message: string,
  rubric?: Feedback['rubric'],
): AppState {
  const project = s.projects.find((p) => p.id === projectId)
  if (!project) return s

  const feedback: Feedback = { id: uid('f'), projectId, mentorId: mentor.id, createdAt: now(), decision, message, rubric }
  const status: ProjectStatus = decision === 'approved' ? 'approved' : 'needs_changes'

  let next: AppState = {
    ...s,
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, status, reviewedAt: now(), reviewerId: mentor.id, feedback: [...p.feedback, feedback] } : p)),
  }

  const lesson = lessonById(next, project.lessonId)
  const author = project.authorId

  if (decision === 'approved') {
    const reward = (lesson?.task.xp ?? 0) + APPROVAL_BONUS
    next = awardXp(next, author, reward, 'xp_project_approved', 'approval', projectId, { title: project.title })
    next = notify(next, {
      userId: author,
      title: 'notif_project_approved',
      body: 'notif_project_approved_body',
      vars: { mentor: mentor.name, title: project.title, xp: reward },
      kind: 'approval',
      href: `/projects/${projectId}`,
    })
    if (lesson) next = completeLesson(next, author, lesson.id)
  } else {
    next = notify(next, {
      userId: author,
      title: 'notif_changes_requested',
      body: 'notif_changes_requested_body',
      vars: { mentor: mentor.name, title: project.title },
      kind: 'review',
      href: `/projects/${projectId}`,
    })
  }

  return syncAchievements(next, author)
}

export function toggleLike(s: AppState, projectId: string): AppState {
  return {
    ...s,
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p)),
  }
}

export function registerUser(s: AppState, input: { name: string; email: string; password: string; role: User['role'] }): { state: AppState; user?: User; error?: string } {
  if (s.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    return { state: s, error: 'An account with that email already exists.' }
  }
  const user: User = {
    id: uid('u'),
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    role: input.role,
    avatar: input.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join(''),
    joinedAt: now(),
    // A dictionary key, not a finished word — see TextVars.
    title: input.role === 'mentor' ? 'mentor' : undefined,
  }

  let next: AppState = { ...s, users: [...s.users, user] }

  if (input.role === 'student') {
    const profile: StudentProfile = {
      userId: user.id,
      xp: 0,
      streak: 1,
      lastActiveDate: now(),
      enrolledCourseIds: ['arduino'],
      currentCourseId: 'arduino',
      completedLessonIds: [],
      completedChallengeIds: [],
      passedCheckLessonIds: [],
      unlockedAchievementIds: [],
      goal: 'goal_complete_first_lesson',
    }
    next = { ...next, profiles: [...next.profiles, profile] }
    next = notify(next, { userId: user.id, title: 'notif_welcome', body: 'notif_welcome_body', kind: 'system', href: '/courses/arduino' })
  }

  return { state: next, user }
}

export function updateUser(s: AppState, userId: string, patch: Partial<Pick<User, 'name' | 'bio' | 'city'>> & { goal?: string }): AppState {
  const next: AppState = { ...s, users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) }
  return patch.goal === undefined ? next : patchProfile(next, userId, (p) => ({ ...p, goal: patch.goal! }))
}

export function enroll(s: AppState, userId: string, courseId: string): AppState {
  const profile = s.profiles.find((p) => p.userId === userId)
  if (!profile || profile.enrolledCourseIds.includes(courseId)) return s
  let next = patchProfile(s, userId, (p) => ({ ...p, enrolledCourseIds: [...p.enrolledCourseIds, courseId] }))
  next = notify(next, { userId, title: 'notif_enrolled', body: 'notif_enrolled_body', vars: { courseId }, kind: 'system', href: `/courses/${courseId}` })
  return next
}

export function setCurrentCourse(s: AppState, userId: string, courseId: string): AppState {
  return patchProfile(s, userId, (p) => ({ ...p, currentCourseId: courseId }))
}

export function markCodeCheckPassed(s: AppState, userId: string, lessonId?: string): AppState {
  const profile = s.profiles.find((p) => p.userId === userId)
  if (!profile) return s

  // Recorded per lesson so the challenge stays gated after the student navigates away.
  let base = s
  if (lessonId && !profile.passedCheckLessonIds.includes(lessonId)) {
    base = patchProfile(s, userId, (p) => ({ ...p, passedCheckLessonIds: [...p.passedCheckLessonIds, lessonId] }))
  }
  if (profile.unlockedAchievementIds.includes('code-explorer')) return base
  s = base
  const achievement = s.achievements.find((a) => a.id === 'code-explorer')!
  let next = patchProfile(s, userId, (p) => ({ ...p, unlockedAchievementIds: [...p.unlockedAchievementIds, 'code-explorer'] }))
  next = awardXp(next, userId, achievement.xp, 'xp_achievement_unlocked', 'achievement', achievement.id, { achievementId: achievement.id })
  return notify(next, { userId, title: 'notif_achievement_unlocked', body: 'notif_achievement_unlocked_body', vars: { achievementId: achievement.id, xp: achievement.xp }, kind: 'achievement', href: '/achievements' })
}

export function joinTeam(s: AppState, userId: string, teamId: string): AppState {
  let next: AppState = {
    ...s,
    teams: s.teams.map((t) => (t.id === teamId ? { ...t, memberIds: [...new Set([...t.memberIds, userId])] } : { ...t, memberIds: t.memberIds.filter((id) => id !== userId) })),
  }
  next = notify(next, { userId, title: 'notif_team_joined', body: 'notif_team_joined_body', vars: { team: s.teams.find((t) => t.id === teamId)?.name ?? '' }, kind: 'system', href: '/competition' })
  return syncAchievements(next, userId)
}

/**
 * Scoring is the only thing that moves a team up the board — points are earned, never typed in.
 * Un-scoring hands them back, so a mistake can be undone.
 */
export function setTaskStatus(s: AppState, taskId: string, status: CompetitionTask['status'], teamId?: string): AppState {
  const task = s.competitionTasks.find((t) => t.id === taskId)
  if (!task) return s
  const owner = teamId ?? task.teamId
  const delta = (status === 'scored' ? 1 : 0) - (task.status === 'scored' ? 1 : 0)

  return {
    ...s,
    competitionTasks: s.competitionTasks.map((t) => (t.id === taskId ? { ...t, status, teamId: owner } : t)),
    teams: delta && owner ? s.teams.map((team) => (team.id === owner ? { ...team, points: Math.max(0, team.points + delta * task.points) } : team)) : s.teams,
  }
}

export function readNotifications(s: AppState, userId: string, id?: string): AppState {
  return { ...s, notifications: s.notifications.map((n) => (n.userId === userId && (!id || n.id === id) ? { ...n, read: true } : n)) }
}

/* ---------------------------------------------------------------- mentor-authored lessons */

/**
 * Lessons a mentor writes live beside the curriculum rather than inside it: the shipped courses
 * keep their fixed order and unlock chain, and these are assigned separately. That keeps one
 * mentor's material from renumbering everyone else's course.
 */
export function saveCustomLesson(s: AppState, lesson: CustomLesson): AppState {
  const exists = s.customLessons.some((l) => l.id === lesson.id)
  const next = { ...lesson, tasks: lesson.tasks.slice(0, MAX_TASKS_PER_LESSON), updatedAt: now() }
  return {
    ...s,
    customLessons: exists ? s.customLessons.map((l) => (l.id === lesson.id ? next : l)) : [next, ...s.customLessons],
  }
}

export function deleteCustomLesson(s: AppState, lessonId: string): AppState {
  return {
    ...s,
    customLessons: s.customLessons.filter((l) => l.id !== lessonId),
    lessonSubmissions: s.lessonSubmissions.filter((sub) => sub.lessonId !== lessonId),
  }
}

/** Publishing is what makes a lesson visible to students; unpublishing hides it again. */
export function setLessonPublished(s: AppState, lessonId: string, published: boolean): AppState {
  const lesson = s.customLessons.find((l) => l.id === lessonId)
  if (!lesson) return s
  let next: AppState = {
    ...s,
    customLessons: s.customLessons.map((l) => (l.id === lessonId ? { ...l, published, updatedAt: now() } : l)),
  }
  if (published) {
    for (const student of next.users.filter((u) => u.role === 'student')) {
      next = notify(next, {
        userId: student.id,
        title: 'notif_new_assignment',
        body: 'notif_new_assignment_body',
        vars: { title: lesson.title },
        kind: 'unlock',
        href: `/assigned/${lessonId}`,
      })
    }
  }
  return next
}

/** Quiz questions mark themselves. Anything written by hand needs a person to read it. */
export function gradeQuiz(lesson: CustomLesson, answers: TaskAnswer[]): { score: number; total: number } {
  const quizzes = lesson.tasks.filter((t) => t.kind === 'quiz')
  const score = quizzes.reduce((n, task) => {
    const given = answers.find((a) => a.taskId === task.id)?.value
    return given !== undefined && Number(given) === task.answerIndex ? n + 1 : n
  }, 0)
  return { score, total: quizzes.length }
}

/**
 * A lesson made only of quizzes can settle itself the moment it is handed in. One with code or
 * written answers cannot, so it waits for the mentor — the same review loop projects use.
 */
export function submitLessonAnswers(s: AppState, studentId: string, lessonId: string, answers: TaskAnswer[]): AppState {
  const lesson = s.customLessons.find((l) => l.id === lessonId)
  if (!lesson || s.lessonSubmissions.some((sub) => sub.lessonId === lessonId && sub.studentId === studentId)) return s

  const { score, total } = gradeQuiz(lesson, answers)
  const selfMarking = lesson.tasks.length > 0 && lesson.tasks.every((t) => t.kind === 'quiz')
  const points = lesson.tasks.reduce((n, t) => n + t.points, 0)

  const submission: LessonSubmission = {
    id: uid('ls'),
    lessonId,
    studentId,
    answers,
    quizScore: score,
    quizTotal: total,
    status: selfMarking ? 'reviewed' : 'submitted',
    submittedAt: now(),
    ...(selfMarking
      ? { reviewedAt: now(), awardedXp: total ? Math.round((score / total) * points) : 0 }
      : {}),
  }

  let next: AppState = { ...s, lessonSubmissions: [submission, ...s.lessonSubmissions] }

  if (selfMarking) {
    const earned = submission.awardedXp ?? 0
    if (earned > 0) next = awardXp(next, studentId, earned, 'xp_assignment_completed', 'lesson', lessonId, { title: lesson.title })
    next = notify(next, {
      userId: studentId,
      title: 'notif_assignment_marked',
      body: 'notif_assignment_marked_body',
      vars: { title: lesson.title, score, total, xp: earned },
      kind: 'achievement',
      href: `/assigned/${lessonId}`,
    })
  } else {
    next = notify(next, {
      userId: lesson.authorId,
      title: 'notif_assignment_submitted',
      body: 'notif_assignment_submitted_body',
      vars: { student: next.users.find((u) => u.id === studentId)?.name ?? '', title: lesson.title },
      kind: 'review',
      href: `/m/lessons/${lessonId}`,
    })
  }

  next = touchStreak(next, studentId)
  return syncAchievements(next, studentId)
}

/** The mentor reads the written answers, sets the XP and closes the submission. */
export function reviewLessonSubmission(s: AppState, submissionId: string, mentorId: string, feedback: string, awardedXp: number): AppState {
  const submission = s.lessonSubmissions.find((sub) => sub.id === submissionId)
  if (!submission || submission.status === 'reviewed') return s
  const lesson = s.customLessons.find((l) => l.id === submission.lessonId)
  const cap = lesson ? lesson.tasks.reduce((n, t) => n + t.points, 0) : awardedXp
  const xp = Math.max(0, Math.min(Math.round(awardedXp), cap))

  let next: AppState = {
    ...s,
    lessonSubmissions: s.lessonSubmissions.map((sub) =>
      sub.id === submissionId ? { ...sub, status: 'reviewed', reviewedAt: now(), reviewerId: mentorId, feedback, awardedXp: xp } : sub,
    ),
  }
  if (xp > 0) next = awardXp(next, submission.studentId, xp, 'xp_assignment_completed', 'lesson', submission.lessonId, { title: lesson?.title ?? '' })
  next = notify(next, {
    userId: submission.studentId,
    title: 'notif_assignment_reviewed',
    body: 'notif_assignment_reviewed_body',
    vars: { title: lesson?.title ?? '', xp },
    kind: 'approval',
    href: `/assigned/${submission.lessonId}`,
  })
  return syncAchievements(next, submission.studentId)
}

/* ---------------------------------------------------------------- mentor-announced events */

/**
 * Competitions, their running order and their teams are all written by a mentor inside the app.
 * Nothing about an event is seeded, so an academy that has announced nothing shows an empty hall.
 */
export function saveCompetition(s: AppState, competition: Competition): AppState {
  const exists = s.competitions.some((c) => c.id === competition.id)
  return {
    ...s,
    competitions: exists ? s.competitions.map((c) => (c.id === competition.id ? competition : c)) : [competition, ...s.competitions],
  }
}

/** Deleting an event takes its running order, its tasks and its teams with it. */
export function deleteCompetition(s: AppState, competitionId: string): AppState {
  return {
    ...s,
    competitions: s.competitions.filter((c) => c.id !== competitionId),
    competitionTasks: s.competitionTasks.filter((t) => t.competitionId !== competitionId),
    teams: s.teams.filter((t) => t.competitionId !== competitionId),
  }
}

/** Announcing tells every student once; editing afterwards does not nag them again. */
export function announceCompetition(s: AppState, competitionId: string): AppState {
  const competition = s.competitions.find((c) => c.id === competitionId)
  if (!competition) return s
  let next = s
  for (const student of s.users.filter((u) => u.role === 'student')) {
    next = notify(next, {
      userId: student.id,
      title: 'notif_event_announced',
      body: 'notif_event_announced_body',
      vars: { name: competition.name, date: competition.startsAt },
      kind: 'system',
      href: '/competition',
    })
  }
  return next
}

export function saveCompetitionTask(s: AppState, task: CompetitionTask): AppState {
  const exists = s.competitionTasks.some((t) => t.id === task.id)
  return { ...s, competitionTasks: exists ? s.competitionTasks.map((t) => (t.id === task.id ? task : t)) : [...s.competitionTasks, task] }
}

export function deleteCompetitionTask(s: AppState, taskId: string): AppState {
  const task = s.competitionTasks.find((t) => t.id === taskId)
  // A scored task has already paid out; removing it takes those points back.
  const teams =
    task?.status === 'scored' && task.teamId
      ? s.teams.map((team) => (team.id === task.teamId ? { ...team, points: Math.max(0, team.points - task.points) } : team))
      : s.teams
  return { ...s, competitionTasks: s.competitionTasks.filter((t) => t.id !== taskId), teams }
}

export function saveTeam(s: AppState, team: Team): AppState {
  const exists = s.teams.some((x) => x.id === team.id)
  // A student belongs to one team per event, so joining here removes them from any other.
  const cleaned = s.teams.map((x) =>
    x.id === team.id || x.competitionId !== team.competitionId ? x : { ...x, memberIds: x.memberIds.filter((id) => !team.memberIds.includes(id)) },
  )
  return { ...s, teams: exists ? cleaned.map((x) => (x.id === team.id ? team : x)) : [...cleaned, team] }
}

export function deleteTeam(s: AppState, teamId: string): AppState {
  return {
    ...s,
    teams: s.teams.filter((t) => t.id !== teamId),
    // Tasks the team had claimed go back on the board rather than vanishing with it.
    competitionTasks: s.competitionTasks.map((t) => (t.teamId === teamId ? { ...t, teamId: undefined, status: 'open' } : t)),
  }
}

/* ---------------------------------------------------------------- groups */

/**
 * Groups are the mentor's timetable: a named class with a room, a slot and a roster.
 * A student sits in one group at a time, so adding them here removes them from any other.
 */
export function saveGroup(s: AppState, group: Group): AppState {
  const exists = s.groups.some((g) => g.id === group.id)
  const cleaned = s.groups.map((g) => (g.id === group.id ? g : { ...g, studentIds: g.studentIds.filter((id) => !group.studentIds.includes(id)) }))
  return { ...s, groups: exists ? cleaned.map((g) => (g.id === group.id ? group : g)) : [...cleaned, group] }
}

/** Removing a group never removes its students — they stay in the academy, just ungrouped. */
export function deleteGroup(s: AppState, groupId: string): AppState {
  return { ...s, groups: s.groups.filter((g) => g.id !== groupId) }
}
