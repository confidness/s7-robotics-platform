import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap, Play, Zap } from 'lucide-react'
import { useApp } from '../../lib/store'
import { courseProgress, currentLesson, profileOf } from '../../lib/selectors'
import { lessonsForCourse } from '../../lib/curriculum'
import { Badge, Card, EmptyState, ProgressBar, SectionHeading, btn } from '../../components/ui'
import { t } from '../../i18n'
import { localizeDifficulty } from '../../i18n/content'

export default function MyLearning() {
  const { state, user, setCurrentCourse } = useApp()
  if (!user) return null
  const profile = profileOf(state, user.id)!

  const enrolled = state.courses.filter((c) => profile.enrolledCourseIds.includes(c.id))
  const completed = state.lessons.filter((l) => profile.completedLessonIds.includes(l.id))
  const totalMinutes = completed.reduce((a, l) => a + l.minutes, 0)

  return (
    <div className="animate-rise space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('my_learning')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('your_enrolled_tracks_where_you_stopped_and_what_')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('courses_enrolled'), value: enrolled.length, icon: BookOpen },
          { label: t('lessons_completed'), value: completed.length, icon: CheckCircle2 },
          { label: t('time_on_task'), value: t('time_hours_minutes', { h: Math.round(totalMinutes / 60), m: totalMinutes % 60 }), icon: Clock },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3.5 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-200 ring-inset">
              <s.icon size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-ink-500">{s.label}</p>
              <p className="text-xl font-bold text-ink-900 tabular-nums">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {enrolled.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={t('you_are_not_enrolled_in_anything_yet')}
          body={t('pick_a_track_from_the_catalog_wedo_for_a_gentle_')}
          action={
            <Link to="/courses" className={btn('primary')}>
              {t('browse_courses')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {enrolled.map((course) => {
            const progress = courseProgress(state, user.id, course.id)
            const next = currentLesson(state, user.id, course.id)
            const lessons = lessonsForCourse(course.id)
            const isCurrent = profile.currentCourseId === course.id

            return (
              <Card key={course.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 border-b edge p-5">
                  <span className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${course.gradient}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/courses/${course.id}`} className="text-base font-bold text-ink-900 hover:text-brand-700">
                        {course.title}
                      </Link>
                      {isCurrent && <Badge tone="brand">{t('current_track')}</Badge>}
                      {progress.percent === 100 && <Badge tone="success">{t('finished')}</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-500">{course.tagline}</p>
                  </div>
                  <div className="w-full sm:w-52">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                      <span className="text-ink-600">
                        {progress.done}/{progress.total}
                      </span>
                      <span className="text-brand-700 tabular-nums">{progress.percent}%</span>
                    </div>
                    <ProgressBar value={progress.percent} size="sm" label={t('progress_of', { name: course.title })} />
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  {next ? (
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink-500">{t('next_up')}</p>
                      <p className="mt-1 text-sm font-bold text-ink-900">
                        {t('lesson_n_title', { n: lessons.findIndex((l) => l.id === next.id) + 1, title: next.title })}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} aria-hidden="true" />
                          {t('minutes_short', { n: next.minutes })}
                        </span>
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Zap size={12} aria-hidden="true" />+{next.xp} XP
                        </span>
                        <span>{localizeDifficulty(next.difficulty)}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-600">{t('every_lesson_in_this_course_is_complete_well_don')}</p>
                  )}

                  {next && (
                    <Link
                      to={`/learn/${course.id}/${next.id}`}
                      className={btn('primary', 'md')}
                      onClick={() => {
                        if (!isCurrent) setCurrentCourse(course.id)
                      }}
                    >
                      <Play size={16} aria-hidden="true" />
                      {progress.done === 0 ? t('start') : t('continue')}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {completed.length > 0 && (
        <Card className="p-5 sm:p-6">
          <SectionHeading title={t('completed_lessons')} subtitle={t('everything_you_have_finished_so_far')} icon={CheckCircle2} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {completed.map((l) => (
              <li key={l.id}>
                <Link to={`/learn/${l.courseId}/${l.id}`} className="flex items-center gap-3 rounded-[16px] border edge fill-soft p-3 transition hover:border-brand-300 hover:bg-brand-50/40">
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-500" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{l.title}</span>
                    <span className="block text-xs text-ink-500">{state.courses.find((c) => c.id === l.courseId)?.title}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-amber-600 tabular-nums">+{l.xp} XP</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
