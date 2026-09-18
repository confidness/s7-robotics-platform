import { useMemo, useState } from 'react'
import { FolderKanban, Search } from 'lucide-react'
import { useApp } from '../../lib/store'
import { byNewest } from '../../lib/selectors'
import type { ProjectStatus } from '../../lib/types'
import { Badge, Card, EmptyState, Tabs, controlClass, inputClass, STATUS_LABEL } from '../../components/ui'
import { ProjectCard } from '../../components/cards'
import { t } from '../../i18n'

type Filter = 'all' | ProjectStatus

export default function MentorProjects() {
  const { state, toggleLike } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState('all')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.projects
      .filter((p) => (filter === 'all' ? true : p.status === filter))
      .filter((p) => (courseId === 'all' ? true : p.courseId === courseId))
      .filter((p) => {
        if (!q) return true
        const author = state.users.find((u) => u.id === p.authorId)
        return [p.title, p.description, author?.name ?? ''].join(' ').toLowerCase().includes(q)
      })
      .sort(byNewest)
  }, [state.projects, state.users, filter, courseId, query])

  const count = (s: Filter) => (s === 'all' ? state.projects.length : state.projects.filter((p) => p.status === s).length)

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('all_projects')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('everything_students_have_built_across_every_grou')}</p>
        </div>
        <Badge tone="brand">{t('n_shown', { n: list.length })}</Badge>
      </header>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input className={`${inputClass} pl-10`} type="search" placeholder={t('search_by_project_or_student')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('search_projects')} />
          </div>
          <select className={`${controlClass} w-full sm:w-60`} value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label={t('filter_by_course')}>
            <option value="all">{t('all_courses')}</option>
            {state.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'all', label: t('all'), count: count('all') },
          { id: 'submitted', label: t(STATUS_LABEL.submitted), count: count('submitted') },
          { id: 'under_review', label: t(STATUS_LABEL.under_review), count: count('under_review') },
          { id: 'approved', label: t(STATUS_LABEL.approved), count: count('approved') },
          { id: 'needs_changes', label: t(STATUS_LABEL.needs_changes), count: count('needs_changes') },
        ]}
      />

      {list.length === 0 ? (
        <EmptyState icon={FolderKanban} title={t('no_projects_here')} body={t('change_the_filters_or_wait_for_the_next_submissi')} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} author={state.users.find((u) => u.id === p.authorId)} to={`/m/reviews/${p.id}`} onLike={() => toggleLike(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
