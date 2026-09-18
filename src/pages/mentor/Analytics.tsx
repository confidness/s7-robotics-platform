import { Activity, BarChart3, CheckCircle2, PieChart, TrendingUp, Users } from 'lucide-react'
import { useApp } from '../../lib/store'
import { courseProgress, profileOf, students } from '../../lib/selectors'
import { lessonsForCourse } from '../../lib/curriculum'
import { Badge, Card, ProgressBar, SectionHeading, StatTile } from '../../components/ui'
import type { ProjectStatus } from '../../lib/types'
import { STATUS_LABEL } from '../../components/ui'
import { t, formatNumber } from '../../i18n'

/* Palette kept to four hues so the donut and the bars read as one system. */
const STATUS_COLOR: Record<ProjectStatus, string> = {
  draft: '#94a3b8',
  submitted: '#f59e0b',
  under_review: '#2563eb',
  approved: '#10b981',
  needs_changes: '#f43f5e',
}

function Donut({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-ink-200)" strokeWidth="16" />
        {segments.map((s) => {
          const length = total ? (s.value / total) * c : 0
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${length} ${c - length}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          )
          offset += length
          return el
        })}
        <text x="70" y="66" textAnchor="middle" className="fill-ink-900" fontSize="22" fontWeight="800" fontFamily="Inter, sans-serif">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-ink-500" fontSize="11" fontFamily="Inter, sans-serif">
          {t('projects').toLowerCase()}
        </text>
      </svg>

      <ul className="min-w-[10rem] flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            <span className="flex-1 text-ink-600">{s.label}</span>
            <span className="font-bold text-ink-900 tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MentorAnalytics() {
  const { state } = useApp()
  const roster = students(state)

  const statuses = (Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => ({
    label: t(STATUS_LABEL[s]),
    value: state.projects.filter((p) => p.status === s).length,
    color: STATUS_COLOR[s],
  }))

  const byCourse = state.courses.map((c) => {
    const total = lessonsForCourse(c.id).length
    const enrolled = roster.filter((u) => profileOf(state, u.id)?.enrolledCourseIds.includes(c.id))
    const completed = enrolled.reduce((a, u) => a + courseProgress(state, u.id, c.id).done, 0)
    const avg = enrolled.length ? Math.round(enrolled.reduce((a, u) => a + courseProgress(state, u.id, c.id).percent, 0) / enrolled.length) : 0
    return { course: c, total, enrolled: enrolled.length, completed, avg }
  })

  const totalXp = state.xp.reduce((a, t) => a + t.amount, 0)
  const approved = state.projects.filter((p) => p.status === 'approved').length
  const decided = state.projects.filter((p) => p.status !== 'draft').length
  const approvalRate = decided ? Math.round((approved / decided) * 100) : 0
  const activeWeek = roster.filter((u) => {
    const p = profileOf(state, u.id)
    return p ? Date.now() - new Date(p.lastActiveDate).getTime() < 7 * 86_400_000 : false
  }).length

  const maxCompleted = Math.max(1, ...byCourse.map((b) => b.completed))

  return (
    <div className="animate-rise space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('analytics')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('how_the_academy_is_moving_engagement_completion_')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('students')} value={roster.length} sub={t('active_this_week_count', { n: activeWeek })} icon={Users} tone="brand" />
        <StatTile label={t('xp_awarded')} value={formatNumber(totalXp)} sub={t('across_all_courses')} icon={TrendingUp} tone="warning" />
        <StatTile label={t('projects_approved')} value={approved} sub={t('approval_rate', { n: approvalRate })} icon={CheckCircle2} tone="success" />
        <StatTile label={t('lessons_completed')} value={byCourse.reduce((a, b) => a + b.completed, 0)} sub={t('total_across_academy')} icon={Activity} tone="violet" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionHeading title={t('submission_pipeline')} subtitle={t('where_every_project_currently_sits')} icon={PieChart} />
          <Donut segments={statuses} total={state.projects.length} />
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading title={t('lessons_completed_by_course')} subtitle={t('total_across_enrolled_students')} icon={BarChart3} />
          <ul className="space-y-4">
            {byCourse.map((b) => (
              <li key={b.course.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-ink-800">
                    <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${b.course.gradient}`} aria-hidden="true" />
                    {b.course.title}
                  </span>
                  <span className="text-xs font-semibold text-ink-500 tabular-nums">{b.completed}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-200/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-[width] duration-500" style={{ width: `${(b.completed / maxCompleted) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('course_health')} subtitle={t('enrolment_and_average_completion_per_track')} icon={TrendingUp} />
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b edge text-xs font-semibold text-ink-500">
                <th scope="col" className="py-2.5 pr-3 font-semibold">
                  {t('course')}
                </th>
                <th scope="col" className="py-2.5 pr-3 font-semibold">
                  {t('lessons')}
                </th>
                <th scope="col" className="py-2.5 pr-3 font-semibold">
                  {t('enrolled')}
                </th>
                <th scope="col" className="py-2.5 font-semibold">
                  {t('average_completion')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divider">
              {byCourse.map((b) => (
                <tr key={b.course.id}>
                  <td className="py-3 pr-3 font-semibold text-ink-900">{b.course.title}</td>
                  <td className="py-3 pr-3 text-ink-600 tabular-nums">{b.total}</td>
                  <td className="py-3 pr-3">
                    <Badge tone={b.enrolled > 0 ? 'brand' : 'neutral'}>{b.enrolled}</Badge>
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      <span className="w-28">
                        <ProgressBar value={b.avg} size="sm" label={t('average_completion_of', { name: b.course.title })} />
                      </span>
                      <span className="text-xs font-semibold text-ink-600 tabular-nums">{b.avg}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
