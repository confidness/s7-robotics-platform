import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Eye, Film, Heart, MessageSquare, Send, Sparkles, Zap } from 'lucide-react'
import { useApp } from '../../lib/store'
import { Avatar, Badge, Button, Card, SectionHeading, STATUS_LABEL, STATUS_TONE, btn } from '../../components/ui'
import { CodeBlock } from '../../components/code'
import ProjectSubmitModal from '../../components/ProjectSubmitModal'
import { formatDate, relativeTime } from '../../lib/hooks'
import NotFound from '../NotFound'
import { t } from '../../i18n'

const RUBRIC_LABELS: Record<string, string> = { wiring: 'wiring_build', code: 'code_quality', documentation: 'documentation' }

export default function ProjectDetail() {
  const { projectId } = useParams()
  const { state, user, toggleLike } = useApp()
  const [editing, setEditing] = useState(false)

  const project = state.projects.find((p) => p.id === projectId)
  if (!project || !user) return <NotFound />

  const author = state.users.find((u) => u.id === project.authorId)
  const lesson = state.lessons.find((l) => l.id === project.lessonId)
  const course = state.courses.find((c) => c.id === project.courseId)
  const isMine = project.authorId === user.id
  const images = project.attachments.filter((a) => a.kind === 'image')
  const videos = project.attachments.filter((a) => a.kind === 'video')

  return (
    <div className="animate-rise space-y-5">
      <Link to={isMine ? '/projects' : '/gallery'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900">
        <ArrowLeft size={15} aria-hidden="true" /> {isMine ? t('my_projects') : t('gallery')}
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[project.status]}>{t(STATUS_LABEL[project.status])}</Badge>
              {course && <Badge tone="neutral">{course.title}</Badge>}
              {lesson && <Badge tone="neutral">{lesson.title}</Badge>}
            </div>
            <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-ink-900">{project.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-500">
              <span className="flex items-center gap-2">
                {author && <Avatar name={author.name} initials={author.avatar} size={26} />}
                <span className="font-medium text-ink-700">{author?.name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} aria-hidden="true" />
                {project.submittedAt ? `Submitted ${relativeTime(project.submittedAt)}` : `Created ${relativeTime(project.createdAt)}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={14} aria-hidden="true" />
                {project.views} views
              </span>
              <button onClick={() => toggleLike(project.id)} className={`flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition hover:text-rose-600 ${project.likedByMe ? 'text-rose-600' : ''}`} aria-label={project.likedByMe ? t('remove_like') : t('like_this_project')}>
                <Heart size={14} fill={project.likedByMe ? 'currentColor' : 'none'} aria-hidden="true" />
                {project.likes} likes
              </button>
            </div>
          </div>

          {isMine && (project.status === 'draft' || project.status === 'needs_changes') && lesson && (
            <Button icon={Send} onClick={() => setEditing(true)}>
              {project.status === 'draft' ? t('finish_and_submit') : t('resubmit_with_changes')}
            </Button>
          )}
        </div>
      </Card>

      {/* mentor feedback first — it is what the student came for */}
      {project.feedback.length > 0 && (
        <div className="space-y-3">
          {project.feedback.map((f) => {
            const mentor = state.users.find((u) => u.id === f.mentorId)
            const approved = f.decision === 'approved'
            return (
              <Card key={f.id} className={`overflow-hidden border-l-4 ${approved ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5">
                      {mentor && <Avatar name={mentor.name} initials={mentor.avatar} size={34} />}
                      <span>
                        <span className="block text-sm font-bold text-ink-900">{mentor?.name}</span>
                        <span className="block text-xs text-ink-500">
                          {mentor?.title ? t(mentor.title) : ''} · {formatDate(f.createdAt)}
                        </span>
                      </span>
                    </span>
                    <Badge tone={approved ? 'success' : 'warning'} icon={approved ? CheckCircle2 : MessageSquare}>
                      {approved ? t('approved') : t('changes_requested')}
                    </Badge>
                  </div>

                  <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-ink-700">{f.message}</p>

                  {f.rubric && (
                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                      {Object.entries(f.rubric).map(([k, v]) => (
                        <div key={k} className="rounded-xl fill p-3">
                          <dt className="text-xs font-semibold text-ink-500">{t(RUBRIC_LABELS[k] ?? k)}</dt>
                          <dd className="mt-1 flex items-center gap-1" aria-label={`${v} out of 5`}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={`h-2 w-full rounded-full ${i < v ? 'bg-brand-600' : 'bg-ink-200'}`} aria-hidden="true" />
                            ))}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {project.status === 'approved' && lesson && (
        <Card className="flex flex-wrap items-center gap-4 border-emerald-200 bg-emerald-50/60 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
            <Zap size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-900">{t('approved_xp_awarded')}</p>
            <p className="mt-0.5 text-sm text-emerald-800">
              {t('lesson_marked_complete_next_unlocked', { title: lesson.title })}
            </p>
          </div>
          <Link to={`/courses/${project.courseId}`} className={btn('success', 'sm')}>
            {t('continue_course')}
          </Link>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('description')} icon={Sparkles} />
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-700">{project.description}</p>
            {project.notes && (
              <div className="mt-5 rounded-xl border edge fill p-4">
                <p className="text-xs font-semibold text-ink-500">{t('notes_for_the_mentor')}</p>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-700">{project.notes}</p>
              </div>
            )}
          </Card>

          {project.code && (
            <Card className="p-5 sm:p-6">
              <SectionHeading title={t('submitted_code')} subtitle={lesson?.code.filename} />
              <CodeBlock source={project.code} filename={lesson?.code.filename} />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('attachments')} subtitle={t('files_n', { n: project.attachments.length })} />
            {project.attachments.length === 0 ? (
              <p className="rounded-xl border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('no_photos_or_video_were_attached')}</p>
            ) : (
              <div className="space-y-3">
                {images.map((a) => (
                  <figure key={a.id} className="overflow-hidden rounded-xl border edge">
                    <img src={a.url} alt={a.name} className="w-full object-cover" loading="lazy" />
                    <figcaption className="fill px-3 py-2 text-xs text-ink-600">{a.name}</figcaption>
                  </figure>
                ))}
                {videos.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-[16px] border edge fill-soft p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-gradient-to-b from-brand-400 to-accent-500 text-white">
                      <Film size={17} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{a.name}</span>
                      <span className="block text-xs text-ink-500">{t('video_attachment')}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('details')} />
            <dl className="space-y-2.5 text-sm">
              {[
                ['Course', course?.title],
                ['Lesson', lesson?.title],
                [t('created'), formatDate(project.createdAt)],
                [t('submitted'), project.submittedAt ? formatDate(project.submittedAt) : '—'],
                [t('reviewed'), project.reviewedAt ? formatDate(project.reviewedAt) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 border-b edge pb-2.5">
                  <dt className="shrink-0 text-ink-500">{k}</dt>
                  <dd className="text-right font-semibold text-ink-900">{v ?? '—'}</dd>
                </div>
              ))}
            </dl>
            {project.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    #{t}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {lesson && editing && <ProjectSubmitModal open onClose={() => setEditing(false)} lesson={lesson} existing={project} />}
    </div>
  )
}
