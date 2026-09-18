import { Link } from 'react-router-dom'
import { BookOpen, Clock, Eye, Heart, Signal, Users } from 'lucide-react'
import type { Course, Project, User } from '../lib/types'
import { Badge, Card, ProgressBar, STATUS_LABEL, STATUS_TONE, Avatar } from './ui'
import { lessonsForCourse, platformById } from '../lib/curriculum'
import { t, formatDate } from '../i18n'
import { localizeDifficulty } from '../i18n/content'

export function CourseCover({ course, className = '', children }: { course: Course; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${course.gradient} ${className}`}>
      {/* frosted veil, so a saturated cover still belongs to the glass system */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-transparent" aria-hidden="true" />
      <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden="true">
        <defs>
          <pattern id={`p-${course.id}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0v26" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.8" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p-${course.id})`} />
      </svg>
      {children}
    </div>
  )
}

export function CourseCard({ course, progress, instructor }: { course: Course; progress?: { done: number; total: number; percent: number }; instructor?: User }) {
  const lessons = lessonsForCourse(course.id).length
  const platform = platformById(course.platform)

  return (
    <Card className="card-hover group flex flex-col overflow-hidden">
      <Link to={`/courses/${course.id}`} className="flex flex-1 flex-col focus-visible:outline-none">
        <CourseCover course={course} className="h-28 sm:h-32">
          <div className="absolute inset-0 flex items-end justify-between p-4">
            <span className="rounded-lg bg-black/25 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">{platform.name}</span>
            <span className="rounded-lg fill-strong px-2.5 py-1 text-xs font-bold text-ink-800">{localizeDifficulty(course.level)}</span>
          </div>
        </CourseCover>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="text-base font-bold tracking-tight text-ink-900 transition group-hover:text-brand-700">{course.title}</h3>
          <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-600">{course.tagline}</p>

          <dl className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
            <div className="flex items-center gap-1.5">
              <BookOpen size={13} aria-hidden="true" />
              <dt className="sr-only">{t('lessons')}</dt>
              <dd>{t('n_lessons', { n: lessons })}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} aria-hidden="true" />
              <dt className="sr-only">{t('duration')}</dt>
              <dd>{t('hours_short', { n: course.hours })}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Signal size={13} aria-hidden="true" />
              <dt className="sr-only">{t('age_range')}</dt>
              <dd>{course.ageRange}</dd>
            </div>
          </dl>

          {progress && progress.done > 0 ? (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-ink-600">
                  {progress.done} of {progress.total} lessons
                </span>
                <span className="text-brand-700 tabular-nums">{progress.percent}%</span>
              </div>
              <ProgressBar value={progress.percent} size="sm" label={t('progress_of', { name: course.title })} />
            </div>
          ) : (
            instructor && (
              <div className="mt-4 flex items-center gap-2 border-t edge pt-3.5">
                <Avatar name={instructor.name} initials={instructor.avatar} size={26} />
                <span className="text-xs text-ink-500">{instructor.name}</span>
              </div>
            )
          )}
        </div>
      </Link>
    </Card>
  )
}

export function ProjectCard({ project, author, to, onLike }: { project: Project; author?: User; to: string; onLike?: () => void }) {
  const cover = project.attachments.find((a) => a.kind === 'image')

  return (
    <Card className="card-hover group flex flex-col overflow-hidden">
      <Link to={to} className="block">
        <div className="relative h-36 overflow-hidden">
          {cover ? (
            <img src={cover.url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" loading="lazy" />
          ) : (
            <div className="fill-soft grid h-full place-items-center text-ink-400">
              <BookOpen size={26} aria-hidden="true" />
            </div>
          )}
          <span className="absolute top-3 right-3">
            <Badge tone={STATUS_TONE[project.status]}>{t(STATUS_LABEL[project.status])}</Badge>
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={to}>
          <h3 className="line-clamp-1 text-sm font-bold text-ink-900 transition group-hover:text-brand-700">{project.title}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-500">{project.description}</p>

        <div className="mt-3 flex items-center justify-between gap-2 border-t edge pt-3">
          <span className="flex min-w-0 items-center gap-2">
            {author && <Avatar name={author.name} initials={author.avatar} size={24} />}
            <span className="truncate text-xs font-medium text-ink-600">{author?.name ?? t('unknown')}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2.5 text-xs text-ink-500">
            <button
              onClick={onLike}
              disabled={!onLike}
              className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition ${onLike ? 'hover:bg-rose-50 hover:text-rose-600' : ''} ${project.likedByMe ? 'text-rose-600' : ''}`}
              aria-label={project.likedByMe ? `Unlike ${project.title}` : `Like ${project.title}`}
            >
              <Heart size={13} fill={project.likedByMe ? 'currentColor' : 'none'} aria-hidden="true" />
              {project.likes}
            </button>
            <span className="inline-flex items-center gap-1">
              <Eye size={13} aria-hidden="true" />
              {project.views}
            </span>
          </span>
        </div>
      </div>
    </Card>
  )
}

/** Compact XP-per-day chart. Hand-drawn SVG — a charting library would be the heaviest dependency here. */
export function ActivityChart({ data, height = 120 }: { data: { label: string; value: number; date: string }[]; height?: number }) {
  const max = Math.max(60, ...data.map((d) => d.value))
  const total = data.reduce((a, b) => a + b.value, 0)

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label={t('xp_chart_label', { days: data.length, total })}>
        {data.map((d) => (
          <div key={d.date} className="group/bar relative flex flex-1 flex-col justify-end" title={t('xp_amount', { n: d.value })}>
            <div
              className={`w-full rounded-t-md transition-all duration-500 ${d.value > 0 ? 'bg-gradient-to-t from-brand-600 to-accent-500' : 'bg-ink-200'}`}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-ink-400">
        <span>{data[0] ? formatDate(data[0].date, { day: 'numeric', month: 'short' }) : ''}</span>
        <span>{t('today')}</span>
      </div>
    </div>
  )
}

export function StudentRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 rounded-xl border edge fill-strong p-3 transition hover:border-ink-300">{children}</div>
}

export const GroupMeta = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
    <Users size={13} aria-hidden="true" />
    {count} students
  </span>
)
