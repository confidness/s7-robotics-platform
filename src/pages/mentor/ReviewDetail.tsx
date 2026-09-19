import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Film, ListChecks, MessageSquare, Send, Sparkles, Target, Trophy, Zap } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { APPROVAL_BONUS } from '../../lib/logic'
import { runChecks } from '../../lib/codecheck'
import { levelFor } from '../../lib/gamification'
import { courseProgress, nextLessonAfter, profileOf } from '../../lib/selectors'
import { Avatar, Badge, Button, Card, Field, ProgressBar, SectionHeading, inputClass, STATUS_LABEL, STATUS_TONE } from '../../components/ui'
import { CodeBlock } from '../../components/code'
import { relativeTime } from '../../lib/hooks'
import NotFound from '../NotFound'
import { t, formatNumber } from '../../i18n'
import { localizeLevelName } from '../../i18n/content'

const RUBRIC = [
  { key: 'wiring', label: 'wiring_build' },
  { key: 'code', label: 'code_quality' },
  { key: 'documentation', label: 'documentation' },
] as const

/** Dictionary keys — the phrases are translated when the chips render. */
const QUICK_FEEDBACK = ['quick_clean_build', 'quick_logic_correct', 'quick_before_approve', 'quick_good_diagnosis']

export default function ReviewDetail() {
  const { projectId } = useParams()
  const { state, user, startReview, reviewProject } = useApp()
  const toast = useToast()
  const navigate = useNavigate()

  const [message, setMessage] = useState('')
  const [rubric, setRubric] = useState({ wiring: 4, code: 4, documentation: 4 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const project = state.projects.find((p) => p.id === projectId)

  useEffect(() => {
    if (project?.status === 'submitted') startReview(project.id)
    // Opening the submission is what claims it — the student sees "Under review" immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  if (!project || !user) return <NotFound />

  const author = state.users.find((u) => u.id === project.authorId)
  const lesson = state.lessons.find((l) => l.id === project.lessonId)
  const course = state.courses.find((c) => c.id === project.courseId)
  const profile = author ? profileOf(state, author.id) : undefined
  const progress = author && course ? courseProgress(state, author.id, course.id) : undefined
  const next = lesson ? nextLessonAfter(state, lesson.id) : undefined
  const decided = project.status === 'approved' || project.status === 'needs_changes'
  const report = lesson && project.code ? runChecks(project.code, lesson.checks) : null
  const reward = (lesson?.task.xp ?? 0) + APPROVAL_BONUS

  function decide(decision: 'approved' | 'needs_changes') {
    if (message.trim().length < 20) {
      setError('Write at least a sentence of feedback — this is the part the student actually reads.')
      return
    }
    setBusy(true)
    reviewProject(project!.id, decision, message.trim(), rubric)
    setBusy(false)
    toast(
      decision === 'approved'
        ? { title: t('project_approved'), body: next
            ? t('student_received_xp_unlocked', { name: author?.name.split(' ')[0] ?? '', xp: reward, title: next.title })
            : t('student_received_xp', { name: author?.name.split(' ')[0] ?? '', xp: reward }), tone: 'success' }
        : { title: t('changes_requested'), body: t('student_notified_resubmit', { name: author?.name.split(' ')[0] ?? '' }), tone: 'info' },
    )
    navigate('/m/reviews')
  }

  return (
    <div className="animate-rise space-y-5">
      <Link to="/m/reviews" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-ink-900">
        <ArrowLeft size={15} aria-hidden="true" />{t('review_queue')}</Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[project.status]}>{t(STATUS_LABEL[project.status])}</Badge>
              {course && <Badge tone="neutral">{course.title}</Badge>}
              {lesson && <Badge tone="neutral">{lesson.title}</Badge>}
            </div>
            <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-ink-900">{project.title}</h1>
            <p className="mt-2 text-sm text-ink-500">{t('submitted_when', { when: relativeTime(project.submittedAt ?? project.createdAt) })}</p>
          </div>

          {author && profile && (
            <Link to={`/m/students/${author.id}`} className="flex min-w-[15rem] items-center gap-3 rounded-[16px] border edge fill-soft p-3 transition hover:border-brand-300 hover:bg-brand-50/40">
              <Avatar name={author.name} initials={author.avatar} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink-900">{author.name}</p>
                <p className="text-xs text-ink-500">
                  {localizeLevelName(levelFor(profile.xp).level.name)} · {formatNumber(profile.xp)} XP
                </p>
                {progress && (
                  <div className="mt-1.5">
                    <ProgressBar value={progress.percent} size="sm" label={t('course_progress_of', { name: author.name })} />
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('what_the_student_says')} icon={Sparkles} />
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-700">{project.description}</p>
            {project.notes && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-xs font-semibold text-amber-800">{t('notes_for_you')}</p>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-amber-900">{project.notes}</p>
              </div>
            )}
          </Card>

          {project.code && (
            <Card className="p-5 sm:p-6">
              <SectionHeading title={t('submitted_code')} subtitle={lesson?.code.filename} />
              <CodeBlock source={project.code} filename={lesson?.code.filename} />

              {report && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                    <p className="text-xs font-bold text-emerald-800">{t('checks_passed_n', { n: report.passed.length })}</p>
                    <ul className="mt-2 space-y-1 text-sm text-emerald-900">
                      {report.passed.map((c) => (
                        <li key={c.id}>· {t(c.label)}</li>
                      ))}
                      {report.passed.length === 0 && <li className="text-emerald-900/70">{t('none')}</li>}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
                    <p className="text-xs font-bold text-rose-800">{t('checks_missing_n', { n: report.failed.length })}</p>
                    <ul className="mt-2 space-y-1 text-sm text-rose-900">
                      {report.failed.map((c) => (
                        <li key={c.id}>· {t(c.label)}</li>
                      ))}
                      {report.failed.length === 0 && <li className="text-rose-900/70">{t('nothing_all_checks_pass')}</li>}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('attachments')} subtitle={t('files_n', { n: project.attachments.length })} />
            {project.attachments.length === 0 ? (
              <p className="rounded-xl border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('nothing_attached_consider_asking_for_a_photo_of_')}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {project.attachments.map((a) =>
                  a.kind === 'image' ? (
                    <figure key={a.id} className="overflow-hidden rounded-xl border edge">
                      <img src={a.url} alt={a.name} className="w-full object-cover" loading="lazy" />
                      <figcaption className="fill px-3 py-2 text-xs text-ink-600">{a.name}</figcaption>
                    </figure>
                  ) : (
                    <div key={a.id} className="flex items-center gap-3 rounded-[16px] border edge fill-soft p-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-gradient-to-b from-brand-400 to-accent-500 text-white">
                        <Film size={17} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">{a.name}</span>
                        <span className="block text-xs text-ink-500">{t('video_attachment')}</span>
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </Card>

          {lesson && (
            <Card className="p-5 sm:p-6">
              <SectionHeading title={t('lesson_brief')} subtitle={t('what_was_asked_of_the_student')} icon={Target} />
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-ink-900">{lesson.task.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">{lesson.task.brief}</p>
                  <ul className="mt-2.5 space-y-1.5">
                    {lesson.task.requirements.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-ink-700">
                        <ListChecks size={15} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-accent-200 bg-accent-50/60 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-accent-800">
                    <Trophy size={13} aria-hidden="true" /> {t('challenge_title', { title: lesson.challenge.title })}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-accent-800">{lesson.challenge.brief}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* decision panel */}
        <div className="space-y-5 lg:sticky lg:top-24">
          {decided ? (
            <Card className="p-5 sm:p-6">
              <SectionHeading title={t('decision_recorded')} icon={CheckCircle2} />
              {project.feedback.map((f) => (
                <div key={f.id} className="rounded-xl border edge fill p-4">
                  <Badge tone={f.decision === 'approved' ? 'success' : 'warning'}>{f.decision === 'approved' ? t('approved') : t('changes_requested')}</Badge>
                  <p className="mt-2.5 text-sm leading-relaxed whitespace-pre-line text-ink-700">{f.message}</p>
                </div>
              ))}
              <Link to="/m/reviews" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
                {t('back_to_the_queue')}
              </Link>
            </Card>
          ) : (
            <Card className="p-5 sm:p-6">
              <SectionHeading title={t('your_review')} subtitle={t('feedback_is_required_for_both_decisions')} icon={MessageSquare} />

              <fieldset className="mb-4">
                <legend className="mb-2 text-sm font-semibold text-ink-800">{t('rubric')}</legend>
                <div className="space-y-3">
                  {RUBRIC.map((r) => (
                    <label key={r.key} className="block">
                      <span className="mb-1 flex items-center justify-between text-xs font-medium text-ink-600">
                        {t(r.label)}
                        <span className="font-bold text-ink-900 tabular-nums">{rubric[r.key]}/5</span>
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={rubric[r.key]}
                        onChange={(e) => setRubric({ ...rubric, [r.key]: Number(e.target.value) })}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
                        aria-label={t('score_of', { name: t(r.label) })}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field label={t('feedback')} required error={error} hint={t('name_one_thing_that_was_done_well_and_one_thing_')}>
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={t('the_conversion_from_echo_time_to_centimetres_is_')}
                />
              </Field>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_FEEDBACK.map((q) => (
                  <button key={q} onClick={() => setMessage((m) => `${m}${t(q)} `)} className="rounded-full border edge fill-strong px-2.5 py-1 text-[11px] font-medium text-ink-600 transition hover:border-brand-300 hover:bg-brand-50">
                    {t(q)}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-2.5">
                <Button variant="success" size="lg" icon={CheckCircle2} className="w-full" loading={busy} onClick={() => decide('approved')}>
                  {t('approve_project')}
                </Button>
                <Button variant="secondary" size="lg" icon={Send} className="w-full" disabled={busy} onClick={() => decide('needs_changes')}>
                  {t('request_changes')}
                </Button>
              </div>

              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Zap size={13} aria-hidden="true" />{t('on_approval')}</p>
                <ul className="mt-2 space-y-1 text-sm text-emerald-900">
                  <li>· {t('name_receives_xp', { name: author?.name.split(' ')[0] ?? '', xp: reward })}</li>
                  <li>· {t('title_marked_complete', { title: lesson?.title ?? '' })}</li>
                  {next && <li>· {t('title_unlocks', { title: next.title })}</li>}
                  <li>{t('a_notification_is_sent_immediately')}</li>
                </ul>
              </div>
            </Card>
          )}

          {project.status === 'needs_changes' && (
            <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/60 p-4">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-sm text-amber-900">{t('this_project_was_returned_for_changes_when_the_s')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
