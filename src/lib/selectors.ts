import type { AppState, Lesson, Project, ProjectStatus, TextVars, User } from './types'
import { t } from '../i18n'
import { courseLessonOrder, lessonsForCourse } from './curriculum'
import { levelFor } from './gamification'

export const userById = (s: AppState, id?: string) => s.users.find((u) => u.id === id)
export const profileOf = (s: AppState, userId: string) => s.profiles.find((p) => p.userId === userId)
export const courseById = (s: AppState, id?: string) => s.courses.find((c) => c.id === id)
export const lessonById = (s: AppState, id?: string) => s.lessons.find((l) => l.id === id)
export const projectById = (s: AppState, id?: string) => s.projects.find((p) => p.id === id)

export const students = (s: AppState) => s.users.filter((u) => u.role === 'student')

export function courseProgress(s: AppState, userId: string, courseId: string) {
  const profile = profileOf(s, userId)
  const total = lessonsForCourse(courseId).length
  const done = profile ? lessonsForCourse(courseId).filter((l) => profile.completedLessonIds.includes(l.id)).length : 0
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

/** A lesson is unlocked when every lesson before it in the course order is complete. */
export function isLessonUnlocked(s: AppState, userId: string, lessonId: string) {
  const lesson = lessonById(s, lessonId)
  if (!lesson) return false
  const order = courseLessonOrder(lesson.courseId)
  const index = order.indexOf(lessonId)
  if (index <= 0) return true
  const profile = profileOf(s, userId)
  if (!profile) return false
  return order.slice(0, index).every((id) => profile.completedLessonIds.includes(id))
}

/** The first lesson in the course the student has not finished yet. */
export function currentLesson(s: AppState, userId: string, courseId: string): Lesson | undefined {
  const profile = profileOf(s, userId)
  const order = courseLessonOrder(courseId)
  const nextId = order.find((id) => !profile?.completedLessonIds.includes(id))
  return lessonById(s, nextId ?? order[order.length - 1])
}

export function nextLessonAfter(s: AppState, lessonId: string): Lesson | undefined {
  const lesson = lessonById(s, lessonId)
  if (!lesson) return undefined
  const order = courseLessonOrder(lesson.courseId)
  return lessonById(s, order[order.indexOf(lessonId) + 1])
}

export const projectsOf = (s: AppState, userId: string) => s.projects.filter((p) => p.authorId === userId).sort(byNewest)
export const byNewest = (a: Project, b: Project) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt)

export const REVIEW_QUEUE: ProjectStatus[] = ['submitted', 'under_review']
export const reviewQueue = (s: AppState) => s.projects.filter((p) => REVIEW_QUEUE.includes(p.status)).sort(byNewest)

export const notificationsFor = (s: AppState, userId: string) => s.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const groupsOf = (s: AppState, mentorId: string) => s.groups.filter((g) => g.mentorId === mentorId)

/** Everything the mentor dashboard needs about one student, in one pass. */
export function studentSummary(s: AppState, user: User) {
  const profile = profileOf(s, user.id)
  const courseId = profile?.currentCourseId ?? 'arduino'
  const progress = courseProgress(s, user.id, courseId)
  const projects = projectsOf(s, user.id)
  return {
    user,
    profile,
    course: courseById(s, courseId),
    progress,
    level: levelFor(profile?.xp ?? 0),
    lesson: currentLesson(s, user.id, courseId),
    projects,
    awaiting: projects.filter((p) => REVIEW_QUEUE.includes(p.status)).length,
    group: s.groups.find((g) => g.studentIds.includes(user.id)),
  }
}

/**
 * One academy, one roster: a mentor is responsible for every student unless groups say
 * otherwise. Groups are an optional way to organise sessions, not a permission boundary.
 */
export function mentorStats(s: AppState, mentorId: string) {
  const groups = groupsOf(s, mentorId)
  const roster = students(s)
  const ids = roster.map((u) => u.id)
  const active = roster.filter((u) => {
    const p = profileOf(s, u.id)
    return p ? Date.now() - new Date(p.lastActiveDate).getTime() < 7 * 86_400_000 : false
  })
  const progresses = roster.map((u) => {
    const p = profileOf(s, u.id)
    return p ? courseProgress(s, u.id, p.currentCourseId).percent : 0
  })
  const pending = s.projects.filter((p) => REVIEW_QUEUE.includes(p.status) && ids.includes(p.authorId))
  return {
    groups,
    roster,
    total: roster.length,
    active: active.length,
    pending: pending.length,
    avgProgress: progresses.length ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0,
    attendance: roster.length ? Math.round((active.length / roster.length) * 100) : 0,
  }
}

/** XP earned per day for the last `days` days — used by the small activity chart. */
export function xpSeries(s: AppState, userId: string, days = 14) {
  const buckets: { date: string; label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    buckets.push({ date: d.toISOString().slice(0, 10), label: String(d.getDate()), value: 0 })
  }
  for (const tx of s.xp) {
    if (tx.userId !== userId) continue
    const key = tx.createdAt.slice(0, 10)
    const bucket = buckets.find((b) => b.date === key)
    if (bucket) bucket.value += tx.amount
  }
  return buckets
}

export const leaderboard = (s: AppState) =>
  students(s)
    .map((u) => ({ user: u, profile: profileOf(s, u.id), level: levelFor(profileOf(s, u.id)?.xp ?? 0) }))
    .sort((a, b) => (b.profile?.xp ?? 0) - (a.profile?.xp ?? 0))

/**
 * Notifications and XP entries store entity ids rather than finished titles, so they re-read in
 * whatever language is active now instead of the one they were written in. This turns those ids
 * into the display values the dictionary strings interpolate.
 */
export function resolveVars(s: AppState, vars?: TextVars): TextVars | undefined {
  if (!vars) return vars
  const out: TextVars = { ...vars }
  if (vars.lessonId) out.lesson = s.lessons.find((l) => l.id === vars.lessonId)?.title ?? t('a_lesson')
  if (vars.challengeLessonId) out.challenge = s.lessons.find((l) => l.id === vars.challengeLessonId)?.challenge.title ?? ''
  if (vars.courseId) out.course = s.courses.find((c) => c.id === vars.courseId)?.title ?? ''
  if (vars.achievementId) {
    const a = s.achievements.find((x) => x.id === vars.achievementId)
    out.name = a?.name ?? ''
    out.description = a?.description ?? ''
  }
  if (!out.student) out.student = t('a_student')
  return out
}

/* ---------------------------------------------------------------- mentor-authored lessons */

/** What a student is allowed to see: published only, newest first. */
export const assignedLessons = (s: AppState) =>
  s.customLessons.filter((l) => l.published).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const customLessonById = (s: AppState, id?: string) => s.customLessons.find((l) => l.id === id)

export const lessonsByAuthor = (s: AppState, authorId: string) =>
  s.customLessons.filter((l) => l.authorId === authorId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

export const submissionsForLesson = (s: AppState, lessonId: string) =>
  s.lessonSubmissions.filter((sub) => sub.lessonId === lessonId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

export const submissionFor = (s: AppState, lessonId: string, studentId: string) =>
  s.lessonSubmissions.find((sub) => sub.lessonId === lessonId && sub.studentId === studentId)

/** Written answers a mentor still has to read, across every lesson they wrote. */
export const pendingLessonReviews = (s: AppState, mentorId: string) =>
  s.lessonSubmissions.filter(
    (sub) => sub.status === 'submitted' && s.customLessons.some((l) => l.id === sub.lessonId && l.authorId === mentorId),
  )
