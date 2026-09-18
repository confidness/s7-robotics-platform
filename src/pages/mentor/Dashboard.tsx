import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Flame, TrendingUp, UserCheck, Users } from 'lucide-react'
import { useApp } from '../../lib/store'
import { mentorStats, profileOf, reviewQueue, studentSummary } from '../../lib/selectors'
import { levelFor } from '../../lib/gamification'
import { Avatar, Badge, Card, EmptyState, ProgressBar, SectionHeading, SkeletonCard, Skeleton, StatTile, btn, STATUS_LABEL, STATUS_TONE } from '../../components/ui'
import { relativeTime } from '../../lib/hooks'
import { useLoaded } from '../../lib/hooks'
import { t, formatNumber, formatDate } from '../../i18n'
import { localizeLevelName } from '../../i18n/content'

export default function MentorDashboard() {
  const { state, user } = useApp()
  const ready = useLoaded()
  if (!user) return null

  const stats = mentorStats(state, user.id)
  const queue = reviewQueue(state).filter((p) => stats.roster.some((s) => s.id === p.authorId))
  const roster = stats.roster.map((s) => studentSummary(state, s))
  const needsAttention = roster.filter((r) => (r.profile ? Date.now() - new Date(r.profile.lastActiveDate).getTime() > 6 * 86_400_000 : false))

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="animate-rise space-y-6">
      <section className="card specular tint-blue relative overflow-hidden p-6 sm:p-8">
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm text-ink-500">{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink-900 sm:text-[34px]">{t('good_to_see_you_name', { name: user.name.split(' ')[0] })}</h1>
            <p className="mt-2.5 text-sm text-ink-600">
              {queue.length === 0 ? t('the_review_queue_is_empty_everything_is_up_to_da') : queue.length === 1 ? t('one_project_awaiting') : t('n_projects_awaiting', { n: queue.length })}
            </p>
          </div>
          {queue.length > 0 && (
            <Link to="/m/reviews" className={btn('primary', 'lg')}>
              <ClipboardCheck size={18} aria-hidden="true" />
              {t('review_submissions')}
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('total_students')} value={stats.total} sub={t('n_groups', { n: stats.groups.length })} icon={Users} tone="brand" />
        <StatTile label={t('active_this_week')} value={stats.active} sub={t('attendance_percent', { n: stats.attendance })} icon={UserCheck} tone="success" />
        <StatTile label={t('awaiting_review')} value={queue.length} sub={queue.length ? t('oldest_first_in_the_queue') : t('nothing_pending')} icon={ClipboardCheck} tone={queue.length ? 'warning' : 'neutral'} />
        <StatTile label={t('average_progress')} value={`${stats.avgProgress}%`} sub={t('across_current_tracks')} icon={TrendingUp} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title={t('needs_review')}
              subtitle={t('open_a_submission_to_read_the_code_the_notes_and')}
              icon={ClipboardCheck}
              action={
                <Link to="/m/reviews" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  {t('full_queue')}
                </Link>
              }
            />
            {queue.length === 0 ? (
              <EmptyState icon={CheckCircle2} title={t('queue_is_clear')} body={t('every_submitted_project_has_been_reviewed_new_su')} />
            ) : (
              <ul className="space-y-3">
                {queue.slice(0, 4).map((p) => {
                  const author = state.users.find((u) => u.id === p.authorId)
                  const lesson = state.lessons.find((l) => l.id === p.lessonId)
                  return (
                    <li key={p.id}>
                      <Link to={`/m/reviews/${p.id}`} className="flex flex-wrap items-center gap-3 rounded-[16px] border edge fill-soft p-3.5 transition hover:border-brand-300 hover:bg-brand-50/40">
                        {author && <Avatar name={author.name} initials={author.avatar} size={38} />}
                        <span className="min-w-[10rem] flex-1">
                          <span className="block text-sm font-bold text-ink-900">{p.title}</span>
                          <span className="block truncate text-xs text-ink-500">
                            {author?.name} · {lesson?.title} · {relativeTime(p.submittedAt ?? p.createdAt)}
                          </span>
                        </span>
                        <Badge tone={STATUS_TONE[p.status]}>{t(STATUS_LABEL[p.status])}</Badge>
                        <ArrowRight size={16} className="text-ink-400" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading
              title={t('student_progress')}
              subtitle={t('current_lesson_and_track_completion')}
              icon={TrendingUp}
              action={
                <Link to="/m/students" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  {t('all_students')}
                </Link>
              }
            />
            {roster.length === 0 && (
              <p className="rounded-[18px] border border-dashed edge px-4 py-10 text-center text-sm text-ink-500">
                {t('nobody_has_registered_yet_share_the_platform_lin')}
              </p>
            )}
            <div className={`-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0 ${roster.length === 0 ? 'hidden' : ''}`}>
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b edge text-xs font-semibold text-ink-500">
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      {t('student')}
                    </th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      {t('current_lesson')}
                    </th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      {t('progress')}
                    </th>
                    <th scope="col" className="py-2.5 pr-3 font-semibold">
                      XP
                    </th>
                    <th scope="col" className="py-2.5 font-semibold">
                      {t('streak')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divider">
                  {roster.map((r) => (
                    <tr key={r.user.id} className="transition hover:fill">
                      <td className="py-3 pr-3">
                        <Link to={`/m/students/${r.user.id}`} className="flex items-center gap-2.5">
                          <Avatar name={r.user.name} initials={r.user.avatar} size={30} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink-900">{r.user.name}</span>
                            <span className="block truncate text-xs text-ink-500">{r.course?.title}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-ink-600">{r.lesson?.title ?? '—'}</td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-2">
                          <span className="w-20">
                            <ProgressBar value={r.progress.percent} size="sm" label={t('progress_of', { name: r.user.name })} />
                          </span>
                          <span className="text-xs font-semibold text-ink-600 tabular-nums">{r.progress.percent}%</span>
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-semibold text-ink-900 tabular-nums">{formatNumber(r.profile?.xp ?? 0)}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-ink-600">
                          <Flame size={13} className={r.profile && r.profile.streak > 0 ? 'text-rose-500' : 'text-ink-300'} aria-hidden="true" />
                          {r.profile?.streak ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('my_groups')} icon={Users} action={<Link to="/m/groups" className="text-sm font-semibold text-brand-600 hover:text-brand-700">{t('manage')}</Link>} />
            {stats.groups.length === 0 && (
              <p className="rounded-[18px] border border-dashed edge px-4 py-6 text-center text-sm text-ink-500">
                {t('no_groups_yet_students_who_register_are_listed_u')}
              </p>
            )}
            <ul className="space-y-3">
              {stats.groups.map((g) => {
                const course = state.courses.find((c) => c.id === g.courseId)
                return (
                  <li key={g.id} className="rounded-[16px] border edge fill-soft p-3.5">
                    <p className="text-sm font-bold text-ink-900">{g.name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {course?.title} · {g.room}
                    </p>
                    <p className="mt-2 flex items-center justify-between text-xs text-ink-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={12} aria-hidden="true" />
                        {g.schedule}
                      </span>
                      <Badge tone="neutral">{g.studentIds.length}</Badge>
                    </p>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('needs_attention')} subtitle={t('no_activity_for_a_week_or_more')} />
            {needsAttention.length === 0 ? (
              <p className="rounded-[18px] border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">
                {roster.length === 0 ? t('no_students_have_registered_yet') : t('everyone_has_been_active_in_the_last_week')}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {needsAttention.map((r) => (
                  <li key={r.user.id}>
                    <Link to={`/m/students/${r.user.id}`} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 transition hover:bg-amber-50">
                      <Avatar name={r.user.name} initials={r.user.avatar} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">{r.user.name}</span>
                        <span className="block text-xs text-amber-700">Last active {r.profile ? relativeTime(r.profile.lastActiveDate) : 'unknown'}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('top_of_the_class')} />
            {roster.length === 0 && <p className="text-sm text-ink-500">{t('rankings_appear_once_students_start_earning_expe')}</p>}
            <ol className="space-y-2.5">
              {[...roster]
                .sort((a, b) => (b.profile?.xp ?? 0) - (a.profile?.xp ?? 0))
                .slice(0, 3)
                .map((r, i) => (
                  <li key={r.user.id} className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'fill text-ink-500'}`}>{i + 1}</span>
                    <Avatar name={r.user.name} initials={r.user.avatar} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{r.user.name}</span>
                    <span className="shrink-0 text-xs font-bold text-ink-600 tabular-nums">{localizeLevelName(levelFor(profileOf(state, r.user.id)?.xp ?? 0).level.name)}</span>
                  </li>
                ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}
