import { useMemo, useState } from 'react'
import { Images, Search } from 'lucide-react'
import { useApp } from '../../lib/store'
import { PLATFORMS } from '../../lib/curriculum'
import { ProjectCard } from '../../components/cards'
import { Badge, Card, EmptyState, SkeletonCard, controlClass, inputClass } from '../../components/ui'
import { plural, useLoaded } from '../../lib/hooks'
import { t } from '../../i18n'
import { localizeDifficulty } from '../../i18n/content'

const DIFFICULTY = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const

export default function Gallery() {
  const { state, toggleLike } = useApp()
  const ready = useLoaded()
  const [query, setQuery] = useState('')
  const [tech, setTech] = useState('all')
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY)[number]>('All')
  const [sort, setSort] = useState<'recent' | 'likes'>('likes')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.projects
      .filter((p) => p.status === 'approved' || p.status === 'under_review' || p.status === 'submitted')
      .filter((p) => {
        const lesson = state.lessons.find((l) => l.id === p.lessonId)
        const course = state.courses.find((c) => c.id === p.courseId)
        const matchesQuery = !q || [p.title, p.description, ...p.tags].join(' ').toLowerCase().includes(q)
        const matchesTech = tech === 'all' || course?.platform === tech || p.tags.includes(tech)
        const matchesDifficulty = difficulty === 'All' || lesson?.difficulty === difficulty
        return matchesQuery && matchesTech && matchesDifficulty
      })
      .sort((a, b) => (sort === 'likes' ? b.likes - a.likes : (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt)))
  }, [state.projects, state.lessons, state.courses, query, tech, difficulty, sort])

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('project_gallery')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('what_other_students_in_the_academy_have_built_st')}</p>
        </div>
        <Badge tone="brand">{plural(visible.length, 'project')}</Badge>
      </header>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input className={`${inputClass} pl-10`} type="search" placeholder={t('search_projects')} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('search_projects')} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${controlClass}`} value={tech} onChange={(e) => setTech(e.target.value)} aria-label={t('filter_by_technology')}>
              <option value="all">{t('all_technology')}</option>
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select className={`${controlClass}`} value={difficulty} onChange={(e) => setDifficulty(e.target.value as (typeof DIFFICULTY)[number])} aria-label={t('filter_by_difficulty')}>
              {DIFFICULTY.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? t('all') : localizeDifficulty(d)}
                </option>
              ))}
            </select>
            <select className={`${controlClass}`} value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'likes')} aria-label={t('sort_projects')}>
              <option value="likes">{t('most_liked')}</option>
              <option value="recent">{t('most_recent')}</option>
            </select>
          </div>
        </div>
      </Card>

      {!ready ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Images} title={t('nothing_matches_those_filters')} body={t('try_another_keyword_or_set_technology_and_diffic')} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} author={state.users.find((u) => u.id === p.authorId)} to={`/projects/${p.id}`} onLike={() => toggleLike(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
