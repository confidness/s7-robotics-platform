import { Link } from 'react-router-dom'
import { ArrowRight, Award, BookOpen, Bot, CheckCircle2, Clock, Flame, FolderKanban, Play, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useApp } from '../../lib/store'
import { courseProgress, currentLesson, profileOf, projectsOf, xpSeries } from '../../lib/selectors'
import { levelFor } from '../../lib/gamification'
import { lessonsForCourse, modulesForCourse } from '../../lib/curriculum'
import { Badge, Card, EmptyState, ProgressBar, Ring, SectionHeading, Skeleton, SkeletonCard, StatTile, STATUS_LABEL, STATUS_TONE, btn } from '../../components/ui'
import { ActivityChart } from '../../components/cards'
import { useLoaded, relativeTime } from '../../lib/hooks'
import { AchievementBadge } from './Achievements'
import { t, formatNumber, formatDate } from '../../i18n'
import { localizeDifficulty, localizeLevelBlurb, localizeLevelName } from '../../i18n/content'

export default function Dashboard() {
  const { state, user } = useApp()
  const ready = useLoaded()
  if (!user) return null
  const profile = profileOf(state, user.id)!

  const course = state.courses.find((c) => c.id === profile.currentCourseId)!
  const lesson = currentLesson(state, user.id, course.id)
  const progress = courseProgress(state, user.id, course.id)
  const lv = levelFor(profile.xp)
  const projects = projectsOf(state, user.id)
  const approved = projects.filter((p) => p.status === 'approved').length
  const pending = projects.filter((p) => p.status === 'submitted' || p.status === 'under_review')
  const modules = modulesForCourse(course.id)
  const moduleOfLesson = modules.find((m) => m.id === lesson?.moduleId)
  const lessonNumber = lesson ? lessonsForCourse(course.id).findIndex((l) => l.id === lesson.id) + 1 : 0
  const unlocked = state.achievements.filter((a) => profile.unlockedAchievementIds.includes(a.id))
  const nextUp = state.achievements.filter((a) => !profile.unlockedAchievementIds.includes(a.id)).slice(0, 3)

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise space-y-6">
      {/* hero */}
      <section className="card specular tint-blue relative overflow-hidden p-6 sm:p-8">
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm text-ink-500">
              {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-1.5 text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink-900 sm:text-[34px]">{t('welcome_back_name', { name: user.name.split(' ')[0] })}</h1>
            <p className="mt-2.5 flex items-center gap-2 text-sm text-ink-600">
              <Target size={15} className="text-brand-500" aria-hidden="true" />
              {t(profile.goal)}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-sm text-ink-500">{t('level_n', { n: lv.level.index })}</p>
              <p className="text-lg font-bold tracking-[-0.02em] text-ink-900">{localizeLevelName(lv.level.name)}</p>
              <p className="mt-0.5 text-xs font-medium text-brand-600">{lv.next ? t('xp_to_level', { n: lv.xpToNext, level: localizeLevelName(lv.next.name) }) : t('top_level')}</p>
            </div>
            <Ring value={lv.percent} size={76}>
              <span className="text-center">
                <span className="block text-base leading-none font-bold text-ink-900 tabular-nums">{formatNumber(profile.xp)}</span>
                <span className="block text-[11px] text-ink-500">{t('xp')}</span>
              </span>
            </Ring>
          </div>
        </div>
      </section>

      {/* continue learning — the one main action on this screen */}
      {lesson && (
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.6fr_1fr]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand" icon={Play}>
                  {t('continue_learning')}
                </Badge>
                <Badge tone="neutral">{course.title}</Badge>
              </div>

              <h2 className="mt-3.5 text-[22px] font-bold tracking-[-0.025em] text-ink-900 sm:text-2xl">
                {t('lesson_n_title', { n: lessonNumber, title: lesson.title })}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{lesson.summary}</p>

              <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-ink-400" aria-hidden="true" />
                  <dt className="sr-only">{t('module')}</dt>
                  <dd>{moduleOfLesson?.title}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-ink-400" aria-hidden="true" />
                  <dt className="sr-only">{t('estimated_time')}</dt>
                  <dd>{t('minutes_short', { n: lesson.minutes })}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" aria-hidden="true" />
                  <dt className="sr-only">{t('reward')}</dt>
                  <dd>{t('xp_available', { n: lesson.xp + lesson.task.xp })}</dd>
                </div>
                <Badge tone={lesson.difficulty === 'Beginner' ? 'success' : lesson.difficulty === 'Intermediate' ? 'warning' : 'danger'}>{localizeDifficulty(lesson.difficulty)}</Badge>
              </dl>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                  <span className="text-ink-600">
                    {t('course_progress_n_of_total', { done: progress.done, total: progress.total })}
                  </span>
                  <span className="text-brand-700 tabular-nums">{progress.percent}%</span>
                </div>
                <ProgressBar value={progress.percent} label={t('course_progress')} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to={`/learn/${course.id}/${lesson.id}`} className={btn('primary', 'lg')}>{t('continue_lesson')}<ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link to={`/courses/${course.id}`} className={btn('secondary', 'lg')}>
                  {t('course_overview')}
                </Link>
              </div>
            </div>

            <div className={`relative hidden bg-gradient-to-br lg:block ${course.gradient}`}>
              <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
                <defs>
                  <pattern id="dash-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M24 0H0v24" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dash-grid)" />
              </svg>
              <div className="relative flex h-full flex-col justify-end p-6 text-white">
                <p className="text-xs font-medium opacity-90">{t('up_next_after_this')}</p>
                <p className="mt-1 text-lg font-bold">{lesson.task.title}</p>
                <p className="mt-1 text-sm opacity-90">{lesson.challenge.title} · +{lesson.challenge.xp} XP</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t('experience')} value={formatNumber(profile.xp)} sub={lv.next ? t('xp_to_level', { n: lv.xpToNext, level: localizeLevelName(lv.next.name) }) : t('highest_level')} icon={Zap} tone="brand" />
        <StatTile label={t('day_streak')} value={`${profile.streak}`} sub={profile.streak >= 7 ? t('streak_achievement_unlocked') : t('days_to_streak_badge', { n: 7 - profile.streak })} icon={Flame} tone="accent" />
        <StatTile label={t('projects_approved')} value={approved} sub={pending.length ? t('n_waiting_for_review', { n: pending.length }) : t('nothing_pending')} icon={CheckCircle2} tone="success" />
        <StatTile label={t('achievements')} value={`${unlocked.length}/${state.achievements.length}`} sub={t('unlocked_so_far')} icon={Award} tone="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* overall progress */}
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title={t('overall_progress')}
              subtitle={t('every_track_in_the_academy')}
              icon={TrendingUp}
              action={
                <Link to="/learning" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  {t('my_learning')}
                </Link>
              }
            />
            <ul className="space-y-4">
              {state.courses.map((c) => {
                const p = courseProgress(state, user.id, c.id)
                const enrolled = profile.enrolledCourseIds.includes(c.id)
                return (
                  <li key={c.id}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/courses/${c.id}`} className="flex items-center gap-2 text-sm font-semibold text-ink-800 hover:text-brand-700">
                        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${c.gradient}`} aria-hidden="true" />
                        {c.title}
                        {!enrolled && (
                          <Badge tone="neutral" className="ml-1">
                            {t('not_enrolled')}
                          </Badge>
                        )}
                      </Link>
                      <span className="text-xs font-semibold text-ink-500 tabular-nums">
                        {p.done}/{p.total}
                      </span>
                    </div>
                    <ProgressBar value={p.percent} size="sm" tone={p.percent === 100 ? 'success' : 'brand'} label={t('progress_of', { name: c.title })} />
                  </li>
                )
              })}
            </ul>
          </Card>

          {/* recent projects */}
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title={t('recent_projects')}
              subtitle={t('what_you_have_submitted_and_where_it_stands')}
              icon={FolderKanban}
              action={
                <Link to="/projects" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  {t('all_projects')}
                </Link>
              }
            />
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title={t('no_projects_yet')}
                body={t('finish_the_task_in_your_current_lesson_and_submi')}
                action={
                  lesson && (
                    <Link to={`/learn/${course.id}/${lesson.id}`} className={btn('primary')}>
                      {t('open_current_lesson')}
                    </Link>
                  )
                }
              />
            ) : (
              <ul className="divide-y divider">
                {projects.slice(0, 4).map((p) => {
                  const l = state.lessons.find((x) => x.id === p.lessonId)
                  return (
                    <li key={p.id}>
                      <Link to={`/projects/${p.id}`} className="flex items-center gap-3 py-3 transition hover:fill">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl fill text-ink-500">
                          <FolderKanban size={17} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-900">{p.title}</span>
                          <span className="block truncate text-xs text-ink-500">
                            {l?.title} · {relativeTime(p.submittedAt ?? p.createdAt)}
                          </span>
                        </span>
                        <Badge tone={STATUS_TONE[p.status]}>{t(STATUS_LABEL[p.status])}</Badge>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* level */}
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('level')} subtitle={localizeLevelBlurb(lv.level.name, lv.level.blurb)} icon={Zap} />
            <div className="flex items-center gap-4">
              <Ring value={lv.percent} size={88}>
                <span className="text-center">
                  <span className="block text-lg leading-none font-bold text-ink-900">{lv.level.index}</span>
                  <span className="block text-[10px] font-semibold text-ink-500">{t('level')}</span>
                </span>
              </Ring>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink-900">{localizeLevelName(lv.level.name)}</p>
                <p className="mt-0.5 text-sm text-ink-500 tabular-nums">
                  {lv.xpIntoLevel} / {lv.xpForLevel} XP
                </p>
                {lv.next && <p className="mt-1.5 text-xs text-ink-500">{t('next_level', { level: localizeLevelName(lv.next.name) })}</p>}
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={lv.percent} tone="amber" label={t('level_progress')} />
            </div>
          </Card>

          {/* activity */}
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('xp_this_fortnight')} subtitle={t('experience_earned_per_day')} icon={TrendingUp} />
            <ActivityChart data={xpSeries(state, user.id)} />
          </Card>

          {/* achievements */}
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title={t('achievements')}
              subtitle={t('n_of_total_unlocked', { n: unlocked.length, total: state.achievements.length })}
              icon={Trophy}
              action={
                <Link to="/achievements" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  {t('all')}
                </Link>
              }
            />
            <div className="grid grid-cols-3 gap-2.5">
              {[...unlocked.slice(-3), ...nextUp].slice(0, 6).map((a) => (
                <AchievementBadge key={a.id} achievement={a} unlocked={profile.unlockedAchievementIds.includes(a.id)} compact />
              ))}
            </div>
          </Card>

          {/* ai mentor */}
          <Card className="overflow-hidden">
            <div className="tint-accent relative p-5">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] fill-strong shadow-[var(--shadow-soft)]">
                <Bot size={20} className="text-accent-600" aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 text-base font-bold tracking-[-0.02em] text-ink-900">{t('stuck_on_something')}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{t('ask_the_ai_robotics_mentor_about_wiring_an_error')}</p>
              <Link to="/ai" className={btn('primary', 'sm', 'mt-4')}>{t('open_ai_mentor')}<ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
