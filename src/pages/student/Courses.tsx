import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useApp } from '../../lib/store'
import { courseProgress, profileOf } from '../../lib/selectors'
import { PLATFORMS } from '../../lib/curriculum'
import { CourseCard } from '../../components/cards'
import { Badge, Card, EmptyState, SkeletonCard, controlClass, inputClass } from '../../components/ui'
import { plural, useLoaded } from '../../lib/hooks'
import { t } from '../../i18n'
import { localizeDifficulty } from '../../i18n/content'

const LEVELS = ['All levels', 'Beginner', 'Intermediate', 'Advanced'] as const

export default function Courses() {
  const { state, user } = useApp()
  const ready = useLoaded()
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<string>('all')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All levels')

  const profile = user ? profileOf(state, user.id) : undefined

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.courses.filter((c) => {
      const matchesQuery = !q || [c.title, c.tagline, c.description, ...c.tags].join(' ').toLowerCase().includes(q)
      const matchesPlatform = platform === 'all' || c.platform === platform
      const matchesLevel = level === 'All levels' || c.level === level
      return matchesQuery && matchesPlatform && matchesLevel
    })
  }, [state.courses, query, platform, level])

  const usedPlatforms = PLATFORMS.filter((p) => state.courses.some((c) => c.platform === p.id))

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('course_catalog')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('five_tracks_from_first_motor_to_competition_engi')}</p>
        </div>
        <Badge tone="brand">{plural(state.courses.length, 'course')}</Badge>
      </header>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input
              className={`${inputClass} pl-10`}
              placeholder={t('search_courses_topics_or_hardware')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('search_courses')}
              type="search"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <SlidersHorizontal size={15} className="hidden shrink-0 text-ink-400 lg:block" aria-hidden="true" />
            <select className={`${controlClass} min-w-36`} value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label={t('filter_by_platform')}>
              <option value="all">{t('all_platforms')}</option>
              {usedPlatforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select className={`${controlClass} min-w-36`} value={level} onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])} aria-label={t('filter_by_level')}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === 'All levels' ? t('all_levels') : localizeDifficulty(l)}
                </option>
              ))}
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
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t('no_courses_match_that')} body={t('try_a_different_keyword_or_clear_the_platform_an')} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              instructor={state.users.find((u) => u.id === course.instructorId)}
              progress={user && profile?.enrolledCourseIds.includes(course.id) ? courseProgress(state, user.id, course.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
