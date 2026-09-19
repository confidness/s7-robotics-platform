import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Award, BarChart3, Bell, BookOpen, Bot, CalendarClock, ChevronRight, ClipboardCheck, ClipboardList, FilePlus2, FolderKanban, GraduationCap, Images, LayoutDashboard, LogOut, Menu,
  Settings, Sparkles, Trophy, User as UserIcon, Users, X, Zap,
} from 'lucide-react'
import { useApp } from '../lib/store'
import { notificationsFor, profileOf, resolveVars } from '../lib/selectors'
import { levelFor } from '../lib/gamification'
import { Avatar, Badge, ProgressBar } from './ui'
import ThemeToggle from './ThemeToggle'
import LocaleToggle from './LocaleToggle'
import type { LucideIcon } from 'lucide-react'
import { t, formatNumber, formatDate } from '../i18n'
import { Mark } from './Mark'
import { localizeLevelName } from '../i18n/content'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  primary?: boolean
  /** Label for the mobile bottom bar, where there is room for one short word. */
  short?: string
}

const STUDENT_NAV: NavItem[] = [
  { to: '/', label: 'dashboard', icon: LayoutDashboard, end: true, primary: true },
  { to: '/courses', label: 'courses', icon: BookOpen, primary: true },
  { to: '/learning', label: 'my_learning', icon: GraduationCap, primary: true, short: 'learning_short' },
  { to: '/assigned', label: 'mentor_assignments', icon: ClipboardList },
  { to: '/projects', label: 'projects', icon: FolderKanban, primary: true },
  { to: '/achievements', label: 'achievements', icon: Award },
  { to: '/gallery', label: 'gallery', icon: Images },
  { to: '/competition', label: 'competition', icon: Trophy },
  { to: '/ai', label: 'ai_mentor', icon: Bot, primary: true },
  { to: '/profile', label: 'profile', icon: UserIcon },
  { to: '/settings', label: 'settings', icon: Settings },
]

const MENTOR_NAV: NavItem[] = [
  { to: '/m', label: 'dashboard', icon: LayoutDashboard, end: true, primary: true },
  { to: '/m/groups', label: 'groups', icon: Users, primary: true },
  { to: '/m/students', label: 'students', icon: GraduationCap, primary: true, short: 'students' },
  { to: '/m/reviews', label: 'reviews', icon: ClipboardCheck, primary: true },
  { to: '/m/lessons', label: 'my_lessons', icon: FilePlus2 },
  { to: '/m/projects', label: 'projects', icon: FolderKanban },
  { to: '/m/courses', label: 'courses', icon: BookOpen },
  { to: '/m/competition', label: 'competition', icon: Trophy },
  { to: '/m/analytics', label: 'analytics', icon: BarChart3 },
  { to: '/m/settings', label: 'settings', icon: Settings },
]

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark size={40} className="shrink-0 rounded-full shadow-[0_8px_18px_-8px_rgb(21_96_236/0.7)]" />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-[-0.02em] text-ink-900">{t('s7_robotics')}</span>
          <span className="block text-xs text-ink-500">{t('learning_platform')}</span>
        </span>
      )}
    </span>
  )
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label={t('main')}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-semibold transition ${
              isActive ? 'fill-strong text-ink-900 shadow-[0_1px_2px_rgb(11_18_32/0.1),0_8px_18px_-10px_rgb(11_18_32/0.4)]' : 'text-ink-600 hover:fill-soft hover:text-ink-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={18} className={isActive ? 'text-brand-500' : 'text-ink-400 group-hover:text-ink-600'} aria-hidden="true" />
              {t(item.label)}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function NotificationBell() {
  const { state, user, readNotifications } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const items = useMemo(() => (user ? notificationsFor(state, user.id) : []), [state, user])
  const unread = items.filter((n) => !n.read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-full fill text-ink-600 ring-1 rim transition hover:fill-raised hover:text-ink-900"
        aria-label={unread ? t('notifications_n_unread', { n: unread }) : t('notifications')}
        aria-expanded={open}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread}</span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label={t('close_notifications')} onClick={() => setOpen(false)} />
          <div className="animate-rise chrome specular absolute right-0 z-50 mt-2.5 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[24px]">
            <div className="relative flex items-center justify-between border-b edge px-4 py-3">
              <p className="text-sm font-bold text-ink-900">{t('notifications')}</p>
              {unread > 0 && (
                <button className="text-xs font-semibold text-brand-600 hover:text-brand-700" onClick={() => readNotifications()}>
                  {t('mark_all_read')}
                </button>
              )}
            </div>
            <ul className="relative max-h-[22rem] divide-y divider overflow-y-auto">
              {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink-500">{t('nothing_yet_actions_you_take_will_show_up_here')}</li>}
              {items.slice(0, 12).map((n) => (
                <li key={n.id}>
                  <button
                    className={`flex w-full gap-3 px-4 py-3 text-left transition hover:fill ${n.read ? '' : 'bg-brand-100/45'}`}
                    onClick={() => {
                      readNotifications(n.id)
                      setOpen(false)
                      if (n.href) navigate(n.href)
                    }}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-ink-300' : 'bg-brand-600'}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-900">{t(n.title)}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">{t(n.body, resolveVars(state, n.vars))}</span>
                      <span className="mt-1 block text-[11px] text-ink-500">{formatDate(n.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!user) return null

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full fill py-1.5 pr-3 pl-1.5 ring-1 rim transition hover:fill-raised" aria-expanded={open} aria-label={t('account_menu')}>
        <Avatar name={user.name} initials={user.avatar} size={30} />
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-bold text-ink-900">{user.name.split(' ')[0]}</span>
          <span className="block text-[11px] text-ink-500">{t(user.role)}</span>
        </span>
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label={t('close_menu')} onClick={() => setOpen(false)} />
          <div className="animate-rise chrome specular absolute right-0 z-50 mt-2.5 w-64 overflow-hidden rounded-[24px]">
            <div className="relative border-b edge px-4 py-3">
              <p className="text-sm font-bold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
            <div className="relative p-2">
              <Link to={user.role === 'mentor' ? '/m/settings' : '/profile'} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:fill-strong">
                <UserIcon size={16} aria-hidden="true" />{t('profile')}</Link>
              <div className="flex items-center justify-between gap-2 rounded-[12px] px-3 py-2 md:hidden">
                <span className="text-sm font-medium text-ink-700">{t('language')}</span>
                <LocaleToggle compact />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-[12px] px-3 py-2 sm:hidden">
                <span className="text-sm font-medium text-ink-700">{t('theme')}</span>
                <ThemeToggle compact />
              </div>
              <button
                className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50/80"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                <LogOut size={16} aria-hidden="true" />{t('sign_out')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function XpPill() {
  const { state, user } = useApp()
  const profile = user ? profileOf(state, user.id) : undefined
  if (!profile) return null
  const lv = levelFor(profile.xp)
  return (
    <Link to="/achievements" className="hidden items-center gap-3 rounded-full fill px-3 py-1.5 ring-1 rim transition hover:fill-raised md:flex" aria-label={t('level_and_xp', { n: lv.level.index, xp: profile.xp })}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-[0_6px_14px_-6px_rgb(249_115_22/0.9)]">
        <Zap size={15} aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-xs font-bold text-ink-900 tabular-nums">{formatNumber(profile.xp)} XP</span>
        <span className="block text-[11px] text-ink-500">{localizeLevelName(lv.level.name)}</span>
      </span>
      <span className="w-16">
        <ProgressBar value={lv.percent} size="sm" tone="amber" label={t('level_progress')} />
      </span>
    </Link>
  )
}

function SidebarFooter() {
  const { state, user } = useApp()
  const profile = user ? profileOf(state, user.id) : undefined
  if (user?.role === 'mentor') {
    // Only a real group produces a real next session; otherwise the rail stays quiet.
    const group = state.groups.find((g) => g.mentorId === user.id)
    if (!group) return null
    return (
      <div className="rounded-[18px] fill p-4 ring-1 rim">
        <p className="flex items-center gap-2 text-xs font-bold text-ink-900">
          <CalendarClock size={14} className="text-brand-500" aria-hidden="true" />{t('next_session')}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
          {group.name} · {group.schedule} · {group.room}
        </p>
      </div>
    )
  }
  if (!profile) return null
  const lv = levelFor(profile.xp)
  return (
    <div className="rounded-[18px] fill p-4 ring-1 rim">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink-900">{localizeLevelName(lv.level.name)}</p>
        <p className="text-xs font-semibold text-brand-600 tabular-nums">{formatNumber(profile.xp)} XP</p>
      </div>
      <div className="mt-2.5">
        <ProgressBar value={lv.percent} size="sm" tone="amber" label={t('level_progress')} />
      </div>
      <p className="mt-2 text-[11px] text-ink-500">{lv.next ? t('xp_to_level', { n: lv.xpToNext, level: localizeLevelName(lv.next.name) }) : t('highest_level_reached')}</p>
    </div>
  )
}

export default function Layout() {
  const { user } = useApp()
  const location = useLocation()
  const [drawer, setDrawer] = useState(false)
  const nav = user?.role === 'mentor' ? MENTOR_NAV : STUDENT_NAV
  const mobilePrimary = nav.filter((n) => n.primary).slice(0, 4)

  useEffect(() => {
    setDrawer(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-screen">
      {/* floating rail */}
      <aside className="chrome specular fixed top-4 bottom-4 left-4 z-40 hidden w-60 flex-col justify-between rounded-[26px] px-3.5 py-5 lg:flex">
        <div className="relative">
          <Link to={user?.role === 'mentor' ? '/m' : '/'} className="mb-7 block px-1">
            <Logo />
          </Link>
          <NavList items={nav} />
        </div>
        <div className="relative">
          <SidebarFooter />
        </div>
      </aside>

      <div className="lg:pl-[17.5rem]">
        <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
          <div className="chrome specular mx-auto flex h-16 max-w-7xl items-center gap-2.5 rounded-full px-3 sm:px-4">
            <button className="grid h-10 w-10 place-items-center rounded-full fill text-ink-700 ring-1 rim lg:hidden" onClick={() => setDrawer(true)} aria-label={t('open_navigation')}>
              <Menu size={18} aria-hidden="true" />
            </button>
            <Link to={user?.role === 'mentor' ? '/m' : '/'} className="lg:hidden">
              <Mark size={36} className="rounded-full" />
            </Link>
            <span className="relative hidden pl-2 lg:block">
              <Badge tone="brand" icon={Sparkles}>
                {user?.role === 'mentor' ? t('mentor_workspace') : t('student_workspace')}
              </Badge>
            </span>
            <div className="flex-1" />
            {user?.role === 'student' && <XpPill />}
            <span className="hidden md:inline-flex">
              <LocaleToggle compact />
            </span>
            <span className="hidden sm:inline-flex">
              <ThemeToggle compact />
            </span>
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pt-6 pb-32 sm:px-6 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink-950/25 backdrop-blur-md" onClick={() => setDrawer(false)} aria-label={t('close_navigation')} />
          <div className="animate-rise chrome specular absolute top-3 bottom-3 left-3 flex w-[16.5rem] flex-col justify-between rounded-[26px] px-3.5 py-5">
            <div className="relative">
              <div className="mb-7 flex items-center justify-between px-1">
                <Logo />
                <button onClick={() => setDrawer(false)} className="grid h-8 w-8 place-items-center rounded-full fill text-ink-500 hover:fill-raised hover:text-ink-900" aria-label={t('close_navigation')}>
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
              <NavList items={nav} onNavigate={() => setDrawer(false)} />
            </div>
            <div className="relative">
              <SidebarFooter />
            </div>
          </div>
        </div>
      )}

      {/* mobile bottom bar */}
      <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 lg:hidden" aria-label={t('primary')}>
        <div className="chrome specular grid grid-cols-5 rounded-[24px] px-1 py-1">
          {mobilePrimary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 rounded-[18px] py-2 text-[11px] font-semibold transition ${
                  isActive ? 'fill-strong text-brand-600 shadow-[0_1px_2px_rgb(11_18_32/0.1)]' : 'text-ink-500'
                }`
              }
            >
              <item.icon size={19} aria-hidden="true" />
              {t(item.short ?? item.label)}
            </NavLink>
          ))}
          <button className="relative flex flex-col items-center gap-1 rounded-[18px] py-2 text-[11px] font-semibold text-ink-500" onClick={() => setDrawer(true)}>
            <ChevronRight size={19} aria-hidden="true" />
            {t('more')}
          </button>
        </div>
      </nav>
    </div>
  )
}
