import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Clock, FolderKanban, GraduationCap, ListChecks, Lock, Play, Target, Zap } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { courseProgress, currentLesson, isLessonUnlocked, profileOf } from '../../lib/selectors'
import { lessonsForCourse, modulesForCourse, platformById } from '../../lib/curriculum'
import { Avatar, Badge, Button, Card, EmptyState, ProgressBar, SectionHeading, Tabs, btn } from '../../components/ui'
import { CourseCover, ProjectCard } from '../../components/cards'
import NotFound from '../NotFound'
import { t } from '../../i18n'
import { localizeDifficulty } from '../../i18n/content'

export default function CourseDetail() {
  const { courseId } = useParams()
  const { state, user, enroll, setCurrentCourse } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'curriculum' | 'overview' | 'projects'>('curriculum')

  const course = state.courses.find((c) => c.id === courseId)
  if (!course || !user) return <NotFound />

  const profile = profileOf(state, user.id)!
  const modules = modulesForCourse(course.id)
  const lessons = lessonsForCourse(course.id)
  const progress = courseProgress(state, user.id, course.id)
  const next = currentLesson(state, user.id, course.id)
  const instructor = state.users.find((u) => u.id === course.instructorId)
  const enrolled = profile.enrolledCourseIds.includes(course.id)
  const platform = platformById(course.platform)
  const courseProjects = state.projects.filter((p) => p.courseId === course.id && p.status === 'approved')

  return (
    <div className="animate-rise space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900">
        <ArrowLeft size={15} aria-hidden="true" />{t('all_courses')}</Link>

      <Card className="overflow-hidden">
        <CourseCover course={course} className="h-36 sm:h-44">
          <div className="absolute inset-0 flex items-end p-5 sm:p-6">
            <div className="text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-black/40 px-2.5 py-1 text-xs font-bold backdrop-blur-sm">{platform.name}</span>
                <span className="rounded-lg fill-strong px-2.5 py-1 text-xs font-bold text-ink-800">{localizeDifficulty(course.level)}</span>
                <span className="rounded-lg bg-black/40 px-2.5 py-1 text-xs font-bold backdrop-blur-sm">{course.ageRange}</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-[-0.03em] drop-shadow sm:text-3xl">{course.title}</h1>
            </div>
          </div>
        </CourseCover>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.7fr_1fr]">
          <div>
            <p className="text-[15px] leading-relaxed text-ink-700">{course.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: t('lessons'), value: lessons.length, icon: BookOpen },
                { label: t('duration'), value: t('hours_short', { n: course.hours }), icon: Clock },
                { label: t('modules'), value: modules.length, icon: ListChecks },
                { label: t('total_xp'), value: lessons.reduce((a, l) => a + l.xp + l.task.xp + l.challenge.xp, 0), icon: Zap },
              ].map((s) => (
                <div key={s.label} className="rounded-xl fill p-3">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                    <s.icon size={13} aria-hidden="true" />
                    {s.label}
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-ink-900 tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-4 rounded-[20px] border edge fill-soft p-4">
            {enrolled ? (
              <>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                    <span className="text-ink-600">
                      {t('n_of_total_lessons', { done: progress.done, total: progress.total })}
                    </span>
                    <span className="text-brand-700 tabular-nums">{progress.percent}%</span>
                  </div>
                  <ProgressBar value={progress.percent} label={t('course_progress')} />
                </div>
                {next && (
                  <div className="rounded-xl border edge fill-strong p-3.5">
                    <p className="text-xs font-medium text-ink-500">{t('next_lesson')}</p>
                    <p className="mt-1 text-sm font-bold text-ink-900">{next.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {t('minutes_short', { n: next.minutes })} · {localizeDifficulty(next.difficulty)}
                    </p>
                  </div>
                )}
                {next && (
                  <Link
                    to={`/learn/${course.id}/${next.id}`}
                    className={btn('primary', 'lg', 'w-full')}
                    onClick={() => {
                      if (profile.currentCourseId !== course.id) setCurrentCourse(course.id)
                    }}
                  >
                    <Play size={17} aria-hidden="true" />
                    {progress.done === 0 ? t('start_course') : t('continue_course')}
                  </Link>
                )}
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-ink-600">{t('you_are_not_enrolled_yet_enrolling_adds_this_cou')}</p>
                <Button
                  size="lg"
                  className="w-full"
                  icon={GraduationCap}
                  onClick={() => {
                    enroll(course.id)
                    setCurrentCourse(course.id)
                    toast({ title: t('enrolled'), body: `${course.title} added to My Learning.`, tone: 'success' })
                    navigate(`/learn/${course.id}/${lessons[0].id}`)
                  }}
                >
                  {t('enroll_and_start')}
                </Button>
              </>
            )}

            {instructor && (
              <div className="flex items-center gap-3 border-t edge pt-4">
                <Avatar name={instructor.name} initials={instructor.avatar} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">{instructor.name}</p>
                  <p className="truncate text-xs text-ink-500">{instructor.title}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'curriculum', label: t('curriculum'), icon: ListChecks, count: lessons.length },
          { id: 'overview', label: t('outcomes'), icon: Target },
          { id: 'projects', label: t('student_projects'), icon: FolderKanban, count: courseProjects.length },
        ]}
      />

      {tab === 'curriculum' && (
        <div className="space-y-5">
          {modules.map((module, mi) => {
            const moduleLessons = lessons.filter((l) => l.moduleId === module.id)
            const done = moduleLessons.filter((l) => profile.completedLessonIds.includes(l.id)).length
            return (
              <Card key={module.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b edge fill-soft px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-500">{t('module_n', { n: mi + 1 })}</p>
                    <h3 className="text-base font-bold text-ink-900">{module.title}</h3>
                    <p className="mt-0.5 text-sm text-ink-500">{module.summary}</p>
                  </div>
                  <Badge tone={done === moduleLessons.length ? 'success' : 'neutral'}>
                    {t('n_of_total_done', { done, total: moduleLessons.length })}
                  </Badge>
                </div>

                <ul className="divide-y divider">
                  {moduleLessons.map((lesson) => {
                    const complete = profile.completedLessonIds.includes(lesson.id)
                    const unlocked = enrolled && isLessonUnlocked(state, user.id, lesson.id)
                    const isNext = next?.id === lesson.id
                    const Row = (
                      <div className={`flex items-center gap-4 px-5 py-4 ${unlocked ? 'transition hover:fill' : 'opacity-60'}`}>
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${complete ? 'bg-emerald-50 text-emerald-600' : unlocked ? 'bg-brand-50 text-brand-600' : 'fill text-ink-400'}`}>
                          {complete ? <CheckCircle2 size={17} aria-hidden="true" /> : unlocked ? <Circle size={17} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-ink-900">{lesson.title}</span>
                            {isNext && <Badge tone="brand">{t('next_up')}</Badge>}
                            {lesson.requiresProject && <Badge tone="accent">{t('project')}</Badge>}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-ink-500">{lesson.summary}</span>
                        </span>
                        <span className="hidden shrink-0 items-center gap-3 text-xs text-ink-500 sm:flex">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} aria-hidden="true" />
                            {t('minutes_short', { n: lesson.minutes })}
                          </span>
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Zap size={12} aria-hidden="true" />
                            {lesson.xp}
                          </span>
                          {unlocked && <ArrowRight size={15} className="text-ink-400" aria-hidden="true" />}
                        </span>
                      </div>
                    )
                    return (
                      <li key={lesson.id}>
                        {unlocked ? (
                          <Link to={`/learn/${course.id}/${lesson.id}`}>{Row}</Link>
                        ) : (
                          <div title={enrolled ? t('finish_the_previous_lesson_to_unlock_this_one') : t('enroll_to_start_this_course')}>{Row}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('what_you_will_be_able_to_do')} icon={Target} />
            <ul className="space-y-3">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-3 text-sm text-ink-700">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  {o}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('platform_tooling')} icon={BookOpen} />
            <dl className="space-y-3 text-sm">
              {[
                ['Hardware', platform.name],
                ['Vendor', platform.vendor],
                ['Language', platform.language],
                ['Recommended age', course.ageRange],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b edge pb-2.5">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="font-semibold text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'projects' && (
        <>
          {courseProjects.length === 0 ? (
            <EmptyState icon={FolderKanban} title={t('no_approved_projects_yet')} body={t('approved_work_from_this_course_will_be_shown_her')} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {courseProjects.map((p) => (
                <ProjectCard key={p.id} project={p} author={state.users.find((u) => u.id === p.authorId)} to={`/projects/${p.id}`} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
