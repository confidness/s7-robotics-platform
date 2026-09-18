import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState, Feedback, Project, User } from './types'
import { COMPETITIONS, COMPETITION_TASKS, createInitialState } from './seed'
import { COURSES, LESSONS, MODULES } from './curriculum'
import { ACHIEVEMENTS } from './gamification'
import * as logic from './logic'
import type { ProjectDraft } from './logic'
import { profileOf } from './selectors'
import { t as translate, useLocale } from '../i18n'
import { localizeAchievement, localizeCompetition, localizeCompetitionTask, localizeCourse, localizeLesson, localizeModule } from '../i18n/content'

const STORAGE_KEY = 's7-robotics-platform.v1'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const saved = JSON.parse(raw) as Partial<AppState>
    // Content (courses/lessons/achievements) always comes from code, never from storage,
    // so editing the curriculum never strands a returning user on stale data.
    const fresh = createInitialState()
    return {
      ...fresh,
      users: saved.users ?? fresh.users,
      profiles: saved.profiles ?? fresh.profiles,
      projects: saved.projects ?? fresh.projects,
      xp: saved.xp ?? fresh.xp,
      teams: saved.teams ?? fresh.teams,
      competitionTasks: saved.competitionTasks ?? fresh.competitionTasks,
      notifications: saved.notifications ?? fresh.notifications,
      sessionUserId: saved.sessionUserId ?? null,
    }
  } catch {
    return createInitialState()
  }
}

export interface Toast {
  id: string
  title: string
  body?: string
  tone: 'success' | 'info' | 'error'
}

interface Ctx {
  state: AppState
  user: User | null
  profile: ReturnType<typeof profileOf>
  login: (email: string, password: string) => { ok: boolean; error?: string; user?: User }
  register: (input: { name: string; email: string; password: string; role: User['role'] }) => { ok: boolean; error?: string; user?: User }
  logout: () => void
  completeLesson: (lessonId: string) => void
  completeChallenge: (lessonId: string) => void
  saveProject: (draft: ProjectDraft, status: 'draft' | 'submitted') => Project
  startReview: (projectId: string) => void
  reviewProject: (projectId: string, decision: 'approved' | 'needs_changes', message: string, rubric?: Feedback['rubric']) => void
  toggleLike: (projectId: string) => void
  enroll: (courseId: string) => void
  updateProfile: (patch: { name?: string; bio?: string; city?: string; goal?: string }) => void
  setCurrentCourse: (courseId: string) => void
  codeCheckPassed: () => void
  joinTeam: (teamId: string) => void
  setTaskStatus: (taskId: string, status: AppState['competitionTasks'][number]['status'], teamId?: string) => void
  readNotifications: (id?: string) => void
  resetDemo: () => void
}

const AppCtx = createContext<Ctx | null>(null)
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
export const useToast = () => useContext(ToastCtx)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const [toasts, setToasts] = useState<Toast[]>([])
  const { locale } = useLocale()

  // Курс мазмұны кодтан оқылады, сондықтан тіл ауысқанда оны қайта аудару жеткілікті.
  // Content is never persisted, so switching language simply re-derives it. Each pass starts
  // from the English canonical rather than from the current state — English has no pack, so
  // re-translating an already-translated copy would leave the previous language in place.
  useEffect(() => {
    setState((s) => ({
      ...s,
      courses: COURSES.map(localizeCourse),
      modules: MODULES.map(localizeModule),
      lessons: LESSONS.map(localizeLesson),
      achievements: ACHIEVEMENTS.map(localizeAchievement),
      competitions: COMPETITIONS.map(localizeCompetition),
      // Tasks carry live status and team, so only their words are re-derived.
      competitionTasks: s.competitionTasks.map((task) => {
        const canonical = COMPETITION_TASKS.find((c) => c.id === task.id)
        return localizeCompetitionTask(canonical ? { ...task, title: canonical.title, description: canonical.description } : task)
      }),
    }))
  }, [locale])

  useEffect(() => {
    try {
      const { users, profiles, projects, xp, teams, competitionTasks, notifications, sessionUserId } = state
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ users, profiles, projects, xp, teams, competitionTasks, notifications, sessionUserId }))
    } catch {
      /* storage full or blocked — the app keeps working in memory */
    }
  }, [state])

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const toast = { ...t, id: logic.uid('t') }
    setToasts((all) => [...all, toast])
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== toast.id)), 4200)
  }, [])

  const user = useMemo(() => state.users.find((u) => u.id === state.sessionUserId) ?? null, [state.users, state.sessionUserId])
  const profile = useMemo(() => (user ? profileOf(state, user.id) : undefined), [state, user])

  const value = useMemo<Ctx>(() => {
    return {
      state,
      user,
      profile,
      login(email, password) {
        const found = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (!found) return { ok: false, error: translate('no_account_found_with_that_email') }
        if (found.password !== password) return { ok: false, error: translate('incorrect_password_try_again') }
        setState((s) => logic.touchStreak({ ...s, sessionUserId: found.id }, found.id))
        return { ok: true, user: found }
      },
      register(input) {
        const result = logic.registerUser(state, input)
        if (result.error || !result.user) return { ok: false, error: result.error }
        setState({ ...result.state, sessionUserId: result.user.id })
        return { ok: true, user: result.user }
      },
      logout: () => setState((s) => ({ ...s, sessionUserId: null })),
      completeLesson: (lessonId) => user && setState((s) => logic.completeLesson(s, user.id, lessonId)),
      completeChallenge: (lessonId) => user && setState((s) => logic.completeChallenge(s, user.id, lessonId)),
      saveProject(draft, status) {
        if (!user) throw new Error('not signed in')
        const result = logic.upsertProject(state, user.id, draft, status)
        setState(result.state)
        return result.project
      },
      startReview: (projectId) => user && setState((s) => logic.startReview(s, user.id, projectId)),
      reviewProject: (projectId, decision, message, rubric) => user && setState((s) => logic.reviewProject(s, user, projectId, decision, message, rubric)),
      toggleLike: (projectId) => setState((s) => logic.toggleLike(s, projectId)),
      enroll: (courseId) => user && setState((s) => logic.enroll(s, user.id, courseId)),
      updateProfile: (patch) => user && setState((s) => logic.updateUser(s, user.id, patch)),
      setCurrentCourse: (courseId) => user && setState((s) => logic.setCurrentCourse(s, user.id, courseId)),
      codeCheckPassed: () => user && setState((s) => logic.markCodeCheckPassed(s, user.id)),
      joinTeam: (teamId) => user && setState((s) => logic.joinTeam(s, user.id, teamId)),
      setTaskStatus: (taskId, status, teamId) => setState((s) => logic.setTaskStatus(s, taskId, status, teamId)),
      readNotifications: (id) => user && setState((s) => logic.readNotifications(s, user.id, id)),
      resetDemo() {
        localStorage.removeItem(STORAGE_KEY)
        setState(createInitialState())
      },
    }
  }, [state, user, profile])

  return (
    <AppCtx.Provider value={value}>
      <ToastCtx.Provider value={pushToast}>
        {children}
        <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((all) => all.filter((t) => t.id !== id))} />
      </ToastCtx.Provider>
    </AppCtx.Provider>
  )
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const tone = {
    success: 'ring-emerald-200/70',
    info: 'ring-brand-200/70',
    error: 'ring-rose-200/70',
  }
  const dot = { success: 'bg-emerald-500', info: 'bg-brand-600', error: 'bg-rose-500' }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:top-24 sm:right-6 sm:items-end" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`animate-toast chrome specular pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[20px] p-4 ring-1 ${tone[t.tone]}`}>
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[t.tone]}`} />
          <div className="relative min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900">{t.title}</p>
            {t.body && <p className="mt-0.5 text-sm text-ink-600">{t.body}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-white/80 hover:text-ink-700" aria-label={translate('dismiss_notification')}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
