import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Plus } from 'lucide-react'
import { useApp } from '../../lib/store'
import { currentLesson, profileOf, projectsOf } from '../../lib/selectors'
import type { ProjectStatus } from '../../lib/types'
import { Badge, Card, EmptyState, SkeletonCard, Tabs, btn, STATUS_LABEL } from '../../components/ui'
import { ProjectCard } from '../../components/cards'
import { useLoaded } from '../../lib/hooks'
import { t } from '../../i18n'

type Filter = 'all' | ProjectStatus

export default function Projects() {
  const { state, user, toggleLike } = useApp()
  const ready = useLoaded()
  const [filter, setFilter] = useState<Filter>('all')
  if (!user) return null

  const profile = profileOf(state, user.id)!
  const all = projectsOf(state, user.id)
  const shown = filter === 'all' ? all : all.filter((p) => p.status === filter)
  const lesson = currentLesson(state, user.id, profile.currentCourseId)

  const counts = (s: Filter) => (s === 'all' ? all.length : all.filter((p) => p.status === s).length)

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('my_projects')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('everything_you_have_built_and_where_each_one_sta')}</p>
        </div>
        {lesson && (
          <Link to={`/learn/${lesson.courseId}/${lesson.id}`} className={btn('primary')}>
            <Plus size={17} aria-hidden="true" />
            {t('new_project_from_current_lesson')}
          </Link>
        )}
      </header>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'all', label: t('all'), count: counts('all') },
          { id: 'draft', label: t(STATUS_LABEL.draft), count: counts('draft') },
          { id: 'submitted', label: t(STATUS_LABEL.submitted), count: counts('submitted') },
          { id: 'under_review', label: t(STATUS_LABEL.under_review), count: counts('under_review') },
          { id: 'approved', label: t(STATUS_LABEL.approved), count: counts('approved') },
          { id: 'needs_changes', label: t(STATUS_LABEL.needs_changes), count: counts('needs_changes') },
        ]}
      />

      {!ready ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={filter === 'all' ? t('no_projects_yet') : t('nothing_with_status', { status: t(STATUS_LABEL[filter as ProjectStatus]).toLowerCase() })}
          body={
            filter === 'all'
              ? t('open_your_current_lesson_finish_the_task_and_sub')
              : t('projects_with_this_status_will_appear_here')
          }
          action={
            lesson && (
              <Link to={`/learn/${lesson.courseId}/${lesson.id}`} className={btn('primary')}>
                {t('open_current_lesson')}
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} author={user} to={`/projects/${p.id}`} onLike={() => toggleLike(p.id)} />
            ))}
          </div>

          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-ink-600">
              {t('n_approved_n_awaiting', {
                approved: all.filter((p) => p.status === 'approved').length,
                awaiting: all.filter((p) => p.status === 'submitted' || p.status === 'under_review').length,
              })}
            </p>
            <Badge tone="brand">{t('n_projects_in_total', { n: all.length })}</Badge>
          </Card>
        </>
      )}
    </div>
  )
}
