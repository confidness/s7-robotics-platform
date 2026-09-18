import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock, ImageOff } from 'lucide-react'
import { useApp } from '../../lib/store'
import { byNewest } from '../../lib/selectors'
import { Avatar, Badge, Card, EmptyState, SkeletonCard, Tabs, STATUS_LABEL, STATUS_TONE } from '../../components/ui'
import { relativeTime } from '../../lib/hooks'
import { useLoaded } from '../../lib/hooks'
import { t } from '../../i18n'

export default function MentorReviews() {
  const { state } = useApp()
  const ready = useLoaded()
  const [tab, setTab] = useState<'queue' | 'done'>('queue')

  const queue = state.projects.filter((p) => p.status === 'submitted' || p.status === 'under_review').sort(byNewest)
  const done = state.projects.filter((p) => p.status === 'approved' || p.status === 'needs_changes').sort(byNewest)
  const list = tab === 'queue' ? queue : done

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('project_reviews')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('read_the_submission_leave_feedback_and_approve_o')}</p>
        </div>
        <Badge tone={queue.length ? 'warning' : 'success'}>{t('awaiting_review_count', { n: queue.length })}</Badge>
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'queue', label: t('needs_review'), icon: ClipboardCheck, count: queue.length },
          { id: 'done', label: t('reviewed'), icon: CheckCircle2, count: done.length },
        ]}
      />

      {!ready ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={tab === 'queue' ? CheckCircle2 : ClipboardCheck}
          title={tab === 'queue' ? t('nothing_waiting') : t('no_reviews_yet')}
          body={tab === 'queue' ? t('every_submission_has_been_handled_new_ones_land_') : t('once_you_approve_or_return_a_project_it_will_be_')}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const author = state.users.find((u) => u.id === p.authorId)
            const lesson = state.lessons.find((l) => l.id === p.lessonId)
            const course = state.courses.find((c) => c.id === p.courseId)
            const cover = p.attachments.find((a) => a.kind === 'image')
            return (
              <li key={p.id}>
                <Card className="card-hover overflow-hidden">
                  <Link to={`/m/reviews/${p.id}`} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-[16px] sm:h-20 sm:w-28">
                      {cover ? (
                        <img src={cover.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="fill-soft grid h-full w-full place-items-center text-ink-400">
                          <ImageOff size={18} aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-ink-900">{p.title}</h2>
                        <Badge tone={STATUS_TONE[p.status]}>{t(STATUS_LABEL[p.status])}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{p.description}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1.5">
                          {author && <Avatar name={author.name} initials={author.avatar} size={20} />}
                          {author?.name}
                        </span>
                        <span>·</span>
                        <span>{course?.title}</span>
                        <span>·</span>
                        <span>{lesson?.title}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" />
                          {relativeTime(p.submittedAt ?? p.createdAt)}
                        </span>
                      </p>
                    </div>

                    <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600">
                      {tab === 'queue' ? t('review') : t('open')}
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
