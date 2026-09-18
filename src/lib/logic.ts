/**
 * Pure state transitions. No React, no DOM — every rule of the product lives here
 * so the UI only has to render the result and the data layer can be swapped for an API.
 */
import type { AppState, Attachment, Feedback, Notification, Project, ProjectStatus, StudentProfile, TextVars, User, XPTransaction } from './types'
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

export function awardXp(s: AppState, userId: string, amount: number, reason: string, kind: XPTransaction['kind'], refId?: string, vars?: TextVars): AppState {
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
      unlockedAchievementIds: [],
      goal: 'goal_complete_first_lesson',
    }
    next = { ...next, profiles: [...next.profiles, profile] }
    next = notify(next, { userId: user.id, title: 'notif_welcome', body: 'notif_welcome_body', kind: 'system', href: '/courses/arduino' })
  } else {
    next = { ...next, groups: next.groups.map((g) => g) }
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

export function markCodeCheckPassed(s: AppState, userId: string): AppState {
  const profile = s.profiles.find((p) => p.userId === userId)
  if (!profile || profile.unlockedAchievementIds.includes('code-explorer')) return s
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

export function setTaskStatus(s: AppState, taskId: string, status: AppState['competitionTasks'][number]['status'], teamId?: string): AppState {
  return { ...s, competitionTasks: s.competitionTasks.map((t) => (t.id === taskId ? { ...t, status, teamId: teamId ?? t.teamId } : t)) }
}

export function readNotifications(s: AppState, userId: string, id?: string): AppState {
  return { ...s, notifications: s.notifications.map((n) => (n.userId === userId && (!id || n.id === id) ? { ...n, read: true } : n)) }
}
