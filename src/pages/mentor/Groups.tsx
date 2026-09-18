import { Link } from 'react-router-dom'
import { CalendarClock, ClipboardCheck, MapPin, Users } from 'lucide-react'
import { useApp } from '../../lib/store'
import { courseProgress, profileOf, REVIEW_QUEUE } from '../../lib/selectors'
import { Avatar, Badge, Card, EmptyState, ProgressBar, SectionHeading } from '../../components/ui'
import { plural } from '../../lib/hooks'
import { t, formatNumber } from '../../i18n'

export default function MentorGroups() {
  const { state, user } = useApp()
  if (!user) return null

  const groups = state.groups.filter((g) => g.mentorId === user.id)

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('groups')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('your_scheduled_sessions_and_who_is_in_each_one')}</p>
        </div>
        <Badge tone="brand">{plural(groups.length, 'group')}</Badge>
      </header>

      {groups.length === 0 ? (
        <EmptyState icon={Users} title={t('no_groups_assigned')} body={t('groups_you_coach_will_appear_here_with_their_sch')} />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const course = state.courses.find((c) => c.id === group.courseId)
            const members = state.users.filter((u) => group.studentIds.includes(u.id))
            const avg = Math.round(members.reduce((a, m) => a + courseProgress(state, m.id, group.courseId).percent, 0) / (members.length || 1))
            const pending = state.projects.filter((p) => group.studentIds.includes(p.authorId) && REVIEW_QUEUE.includes(p.status))

            return (
              <Card key={group.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b edge fill-soft p-5">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-ink-900">{group.name}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={12} aria-hidden="true" />
                        {group.schedule}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={12} aria-hidden="true" />
                        {group.room}
                      </span>
                      <span>{course?.title}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pending.length > 0 && (
                      <Link to="/m/reviews">
                        <Badge tone="warning" icon={ClipboardCheck}>
                          {pending.length} to review
                        </Badge>
                      </Link>
                    )}
                    <Badge tone="neutral">{plural(members.length, 'student')}</Badge>
                    <Badge tone="brand">{t('n_percent_average', { n: avg })}</Badge>
                  </div>
                </div>

                <div className="p-5">
                  <SectionHeading title={t('roster')} subtitle={t('tap_a_student_for_the_full_profile')} />
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {members.map((m) => {
                      const profile = profileOf(state, m.id)
                      const p = courseProgress(state, m.id, group.courseId)
                      return (
                        <li key={m.id}>
                          <Link to={`/m/students/${m.id}`} className="flex items-center gap-3 rounded-[16px] border edge fill-soft p-3 transition hover:border-brand-300 hover:bg-brand-50/40">
                            <Avatar name={m.name} initials={m.avatar} size={36} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-900">{m.name}</span>
                              <span className="mt-1 block">
                                <ProgressBar value={p.percent} size="sm" label={t('progress_of', { name: m.name })} />
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-bold text-ink-600 tabular-nums">{formatNumber(profile?.xp ?? 0) ?? 0}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
