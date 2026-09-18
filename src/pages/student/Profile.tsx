import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Flame, MapPin, Pencil, Target, Users, Zap } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { courseProgress, profileOf, projectsOf } from '../../lib/selectors'
import { levelFor } from '../../lib/gamification'
import { Avatar, Badge, Button, Card, Field, Modal, ProgressBar, Ring, SectionHeading, inputClass, STATUS_LABEL, STATUS_TONE } from '../../components/ui'
import { AchievementBadge } from './Achievements'
import { formatDate, relativeTime } from '../../lib/hooks'
import { t, formatNumber } from '../../i18n'
import { localizeLevelName } from '../../i18n/content'

export default function Profile() {
  const { state, user, updateProfile } = useApp()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  if (!user) return null

  const profile = profileOf(state, user.id)!
  const lv = levelFor(profile.xp)
  const group = state.groups.find((g) => g.studentIds.includes(user.id))
  const mentor = group ? state.users.find((u) => u.id === group.mentorId) : undefined
  const projects = projectsOf(state, user.id)
  const unlocked = state.achievements.filter((a) => profile.unlockedAchievementIds.includes(a.id))

  return (
    <div className="animate-rise space-y-6">
      <Card className="overflow-hidden">
        <div className="surface-grid h-28 bg-gradient-to-br from-brand-600 to-accent-600" aria-hidden="true" />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="rounded-full ring-4 ring-white">
                <Avatar name={user.name} initials={user.avatar} size={76} />
              </span>
              <div className="pb-1">
                <h1 className="text-[22px] font-bold tracking-[-0.025em] text-ink-900 sm:text-2xl">{user.name}</h1>
                <p className="text-sm text-ink-500">{user.email}</p>
              </div>
            </div>
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
              {t('edit_profile')}
            </Button>
          </div>

          {user.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-700">{user.bio}</p>}

          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
            {user.city && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" />
                <dt className="sr-only">{t('city')}</dt>
                <dd>{user.city}</dd>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} aria-hidden="true" />
              <dt className="sr-only">{t('joined')}</dt>
              <dd>{t('joined_date', { date: formatDate(user.joinedAt) })}</dd>
            </div>
            {group && (
              <div className="flex items-center gap-1.5">
                <Users size={14} aria-hidden="true" />
                <dt className="sr-only">{t('group')}</dt>
                <dd>
                  {group.name}
                  {mentor && ` · ${mentor.name}`}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex items-center gap-5 p-5 lg:col-span-1">
          <Ring value={lv.percent} size={88}>
            <span className="text-center">
              <span className="block text-lg leading-none font-bold text-ink-900">{lv.level.index}</span>
              <span className="block text-[10px] font-semibold text-ink-500">{t('level')}</span>
            </span>
          </Ring>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink-900">{localizeLevelName(lv.level.name)}</p>
            <p className="mt-0.5 text-sm text-ink-500 tabular-nums">{formatNumber(profile.xp)} XP</p>
            <div className="mt-2 w-32">
              <ProgressBar value={lv.percent} size="sm" tone="amber" label={t('level_progress')} />
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 ring-inset">
            <Flame size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold text-ink-500">{t('current_streak')}</p>
            <p className="text-2xl font-bold text-ink-900 tabular-nums">{t('n_days', { n: profile.streak })}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 ring-inset">
            <CheckCircle2 size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold text-ink-500">{t('projects_approved')}</p>
            <p className="text-2xl font-bold text-ink-900 tabular-nums">{projects.filter((p) => p.status === 'approved').length}</p>
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('current_goal')} icon={Target} />
        <p className="rounded-xl border border-brand-200/70 bg-brand-100/50 px-4 py-3 text-sm font-medium text-brand-800">{t(profile.goal)}</p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionHeading title={t('track_progress')} icon={Zap} />
          <ul className="space-y-4">
            {profile.enrolledCourseIds.map((id) => {
              const course = state.courses.find((c) => c.id === id)
              if (!course) return null
              const p = courseProgress(state, user.id, id)
              return (
                <li key={id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <Link to={`/courses/${id}`} className="font-semibold text-ink-800 hover:text-brand-700">
                      {course.title}
                    </Link>
                    <span className="text-xs font-semibold text-ink-500 tabular-nums">
                      {p.done}/{p.total}
                    </span>
                  </div>
                  <ProgressBar value={p.percent} size="sm" label={t('progress_of', { name: course.title })} />
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading title={t('badges')} subtitle={t('n_of_total', { n: unlocked.length, total: state.achievements.length })} />
          <div className="grid grid-cols-4 gap-2.5">
            {state.achievements.slice(0, 8).map((a) => (
              <AchievementBadge key={a.id} achievement={a} unlocked={profile.unlockedAchievementIds.includes(a.id)} compact />
            ))}
          </div>
          <Link to="/achievements" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
            {t('see_all_achievements')}
          </Link>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('portfolio')} subtitle={t('projects_submitted_to_mentors')} />
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('nothing_submitted_yet')}</p>
        ) : (
          <ul className="divide-y divider">
            {projects.map((p) => (
              <li key={p.id}>
                <Link to={`/projects/${p.id}`} className="flex items-center gap-3 py-3 transition hover:fill">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{p.title}</span>
                    <span className="block text-xs text-ink-500">{relativeTime(p.submittedAt ?? p.createdAt)}</span>
                  </span>
                  <Badge tone={STATUS_TONE[p.status]}>{t(STATUS_LABEL[p.status])}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EditProfileModal open={editing} onClose={() => setEditing(false)} onSave={(patch) => {
        updateProfile(patch)
        toast({ title: t('profile_updated'), tone: 'success' })
      }} initial={{ name: user.name, city: user.city ?? '', bio: user.bio ?? '', goal: profile.goal }} />
    </div>
  )
}

function EditProfileModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (patch: { name: string; city: string; bio: string; goal: string }) => void
  initial: { name: string; city: string; bio: string; goal: string }
}) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('edit_profile')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              if (form.name.trim().length < 2) return setError('Name is required.')
              onSave({ ...form, name: form.name.trim() })
              onClose()
            }}
          >
            {t('save_changes')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('full_name')} required error={error}>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label={t('city')}>
          <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder={t('almaty')} />
        </Field>
        <Field label={t('about_you')} hint={t('one_or_two_lines_it_shows_on_your_profile_and_in')}>
          <textarea className={`${inputClass} min-h-24 resize-y`} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>
        <Field label={t('current_goal')} hint={t('shown_on_your_dashboard_as_the_thing_you_are_wor')}>
          <input className={inputClass} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
