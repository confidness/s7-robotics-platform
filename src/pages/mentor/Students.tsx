import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Flame, GraduationCap, Search, Trophy, Users, Zap } from 'lucide-react'
import { useApp } from '../../lib/store'
import { courseProgress, profileOf, projectsOf, studentSummary, students, xpSeries } from '../../lib/selectors'
import { Avatar, Badge, Card, EmptyState, ProgressBar, SectionHeading, controlClass, inputClass, STATUS_LABEL, STATUS_TONE, btn } from '../../components/ui'
import { ActivityChart } from '../../components/cards'
import { AchievementBadge } from '../student/Achievements'
import { plural, relativeTime } from '../../lib/hooks'
import { t, formatNumber } from '../../i18n'

export default function MentorStudents() {
  const { studentId } = useParams()
  return studentId ? <StudentDetail id={studentId} /> : <StudentList />
}

function StudentList() {
  const { state } = useApp()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')

  const rows = students(state)
    .map((u) => studentSummary(state, u))
    .filter((r) => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q)
      const matchesGroup = group === 'all' || r.group?.id === group
      return matchesQuery && matchesGroup
    })

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('students')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('progress_experience_and_submissions_for_everyone')}</p>
        </div>
        <Badge tone="brand">{plural(rows.length, 'student')}</Badge>
      </header>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input className={`${inputClass} pl-10`} type="search" placeholder={t('search_by_name_or_email')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('search_students')} />
          </div>
          <select className={`${controlClass} w-full sm:w-56`} value={group} onChange={(e) => setGroup(e.target.value)} aria-label={t('filter_by_group')}>
            <option value="all">{t('all_groups')}</option>
            {state.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title={t('no_students_match')} body={t('try_a_different_name_or_set_the_group_filter_bac')} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.user.id} className="card-hover p-5">
              <Link to={`/m/students/${r.user.id}`} className="block">
                <div className="flex items-start gap-3">
                  <Avatar name={r.user.name} initials={r.user.avatar} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{r.user.name}</p>
                    <p className="truncate text-xs text-ink-500">{r.group?.name ?? t('no_group')}</p>
                  </div>
                  {r.awaiting > 0 && <Badge tone="warning">{t('n_to_review', { n: r.awaiting })}</Badge>}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'XP', value: formatNumber(r.profile?.xp ?? 0) },
                    { label: t('streak'), value: r.profile?.streak ?? 0 },
                    { label: t('projects'), value: r.projects.length },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl fill py-2">
                      <dt className="text-[11px] text-ink-500">{s.label}</dt>
                      <dd className="text-sm font-bold text-ink-900 tabular-nums">{s.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-ink-600">{r.course?.title}</span>
                    <span className="font-semibold text-ink-700 tabular-nums">{r.progress.percent}%</span>
                  </div>
                  <ProgressBar value={r.progress.percent} size="sm" label={t('progress_of', { name: r.user.name })} />
                  <p className="mt-2 truncate text-xs text-ink-500">{t('current_lesson_name', { title: r.lesson?.title ?? '—' })}</p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentDetail({ id }: { id: string }) {
  const { state } = useApp()
  const user = state.users.find((u) => u.id === id)
  if (!user) {
    return <EmptyState icon={Users} title={t('student_not_found')} body={t('this_account_no_longer_exists')} action={<Link to="/m/students" className={btn('primary')}>{t('back_to_students')}</Link>} />
  }

  const profile = profileOf(state, user.id)
  const projects = projectsOf(state, user.id)
  const group = state.groups.find((g) => g.studentIds.includes(user.id))
  const lessons = state.lessons.filter((l) => profile?.completedLessonIds.includes(l.id))

  return (
    <div className="animate-rise space-y-6">
      <Link to="/m/students" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900">
        <ArrowLeft size={15} aria-hidden="true" />{t('all_students')}</Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.name} initials={user.avatar} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold tracking-[-0.025em] text-ink-900 sm:text-2xl">{user.name}</h1>
            <p className="text-sm text-ink-500">{user.email}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
              {group && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} aria-hidden="true" />
                  {group.name}
                </span>
              )}
              {profile && (
                <span className="inline-flex items-center gap-1.5">
                  <Flame size={12} className="text-rose-500" aria-hidden="true" />
                  {profile.streak} day streak · last active {relativeTime(profile.lastActiveDate)}
                </span>
              )}
            </p>
          </div>
          {profile && (
            <div className="rounded-[18px] fill-strong px-5 py-3 text-center ring-1 rim">
              <p className="text-[26px] leading-none font-bold text-ink-900 tabular-nums">{formatNumber(profile.xp)}</p>
              <p className="mt-1 text-xs text-ink-500">{t('total_xp')}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('track_progress')} icon={BookOpen} />
            <ul className="space-y-4">
              {(profile?.enrolledCourseIds ?? []).map((cid) => {
                const course = state.courses.find((c) => c.id === cid)
                if (!course) return null
                const p = courseProgress(state, user.id, cid)
                return (
                  <li key={cid}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-800">{course.title}</span>
                      <span className="text-xs font-semibold text-ink-500 tabular-nums">
                        {p.done}/{p.total} · {p.percent}%
                      </span>
                    </div>
                    <ProgressBar value={p.percent} size="sm" label={t('progress_of', { name: course.title })} />
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('submissions')} subtitle={t('n_projects_count', { n: projects.length })} />
            {projects.length === 0 ? (
              <p className="rounded-xl border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('nothing_submitted_yet')}</p>
            ) : (
              <ul className="divide-y divider">
                {projects.map((p) => {
                  const lesson = state.lessons.find((l) => l.id === p.lessonId)
                  return (
                    <li key={p.id}>
                      <Link to={`/m/reviews/${p.id}`} className="flex items-center gap-3 py-3 transition hover:fill">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-900">{p.title}</span>
                          <span className="block truncate text-xs text-ink-500">
                            {lesson?.title} · {relativeTime(p.submittedAt ?? p.createdAt)}
                          </span>
                        </span>
                        <Badge tone={STATUS_TONE[p.status]}>{t(STATUS_LABEL[p.status])}</Badge>
                        <ArrowRight size={15} className="shrink-0 text-ink-400" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('completed_lessons')} subtitle={t('n_finished', { n: lessons.length })} icon={GraduationCap} />
            {lessons.length === 0 ? (
              <p className="rounded-xl border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('no_lessons_completed_yet_worth_a_message')}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <Badge tone="neutral">{l.title}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('xp_this_fortnight')} icon={Zap} />
            <ActivityChart data={xpSeries(state, user.id)} height={100} />
          </Card>

          {profile && (
            <Card className="p-5 sm:p-6">
              <SectionHeading title={t('achievements')} subtitle={t('n_of_total', { n: profile.unlockedAchievementIds.length, total: state.achievements.length })} icon={Trophy} />
              <div className="grid grid-cols-4 gap-2">
                {state.achievements.map((a) => (
                  <AchievementBadge key={a.id} achievement={a} unlocked={profile.unlockedAchievementIds.includes(a.id)} compact />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
