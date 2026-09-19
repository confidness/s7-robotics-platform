import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ClipboardList, Code2, Download, FileText, ListChecks, MessageSquareText, Send } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { assignedLessons, customLessonById, submissionFor, userById } from '../../lib/selectors'
import type { CustomTask, TaskAnswer } from '../../lib/types'
import { Badge, Button, Card, EmptyState, SectionHeading, inputClass } from '../../components/ui'
import { t, formatDate } from '../../i18n'

const KIND_ICON = { quiz: ListChecks, code: Code2, open: MessageSquareText }
const KIND_LABEL = { quiz: 'task_kind_quiz', code: 'task_kind_code', open: 'task_kind_open' }

/* ------------------------------------------------------------------ list */

export default function Assigned() {
  const { state, user } = useApp()
  if (!user) return null
  const lessons = assignedLessons(state)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('mentor_assignments')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('material_and_questions_set_by_your_mentor')}</p>
      </header>

      {lessons.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('nothing_assigned_yet')} body={t('when_your_mentor_publishes_a_lesson_it_appears_h')} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {lessons.map((lesson) => {
            const done = submissionFor(state, lesson.id, user.id)
            const author = userById(state, lesson.authorId)
            return (
              <li key={lesson.id}>
                <Link to={`/assigned/${lesson.id}`} className="block h-full">
                  <Card className="flex h-full flex-col p-5 transition hover:border-brand-300">
                    <div className="flex flex-wrap items-center gap-2">
                      {done ? (
                        <Badge tone={done.status === 'reviewed' ? 'success' : 'warning'}>{done.status === 'reviewed' ? t('reviewed') : t('awaiting_review')}</Badge>
                      ) : (
                        <Badge tone="brand">{t('not_started')}</Badge>
                      )}
                      <Badge tone="neutral">{t('n_questions', { n: lesson.tasks.length })}</Badge>
                      {lesson.material && <Badge tone="accent">{t('has_material')}</Badge>}
                    </div>
                    <h2 className="mt-3 text-base font-bold text-ink-900">{lesson.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-600">{lesson.summary}</p>
                    <p className="mt-auto pt-3 text-xs text-ink-500">{t('from_mentor', { name: author?.name ?? '' })}</p>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ taking one */

export function AssignedLesson() {
  const { lessonId } = useParams()
  const { state, user, submitLessonAnswers } = useApp()
  const toast = useToast()
  const lesson = customLessonById(state, lessonId)

  const done = user && lesson ? submissionFor(state, lesson.id, user.id) : undefined
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries((lesson?.tasks ?? []).map((task) => [task.id, task.kind === 'code' ? (task.starter ?? '') : ''])),
  )
  const [error, setError] = useState('')

  const maxXp = useMemo(() => (lesson?.tasks ?? []).reduce((n, task) => n + task.points, 0), [lesson])

  if (!user) return null
  if (!lesson || !lesson.published) return <EmptyState icon={FileText} title={t('lesson_not_found')} body={t('it_may_have_been_deleted')} />

  const answered = lesson.tasks.filter((task) => (answers[task.id] ?? '').trim() !== '').length

  function submit() {
    if (answered < lesson!.tasks.length) {
      setError(t('answer_every_question_before_sending'))
      return
    }
    const payload: TaskAnswer[] = lesson!.tasks.map((task) => ({ taskId: task.id, value: answers[task.id] ?? '' }))
    submitLessonAnswers(lesson!.id, payload)
    toast({ title: t('answers_sent'), body: t('your_mentor_will_read_them'), tone: 'success' })
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to="/assigned" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
          <ArrowLeft size={15} aria-hidden="true" />
          {t('mentor_assignments')}
        </Link>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-ink-900">{lesson.title}</h1>
        <p className="mt-1 text-sm text-ink-600">{lesson.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="neutral">{t('n_questions', { n: lesson.tasks.length })}</Badge>
          <Badge tone="warning">{t('xp_available', { n: maxXp })}</Badge>
        </div>
      </header>

      {lesson.material && (
        <Card className="p-5">
          <SectionHeading title={t('teaching_material')} subtitle={t('read_this_before_answering')} icon={FileText} />
          <a
            href={lesson.material.url}
            download={lesson.material.name}
            className="mt-4 flex items-center gap-3 rounded-[14px] border edge fill px-4 py-3 transition hover:border-brand-300"
          >
            <FileText size={20} className="shrink-0 text-brand-600" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900">{lesson.material.name}</span>
              <span className="block text-xs text-ink-500">{t('n_kb', { n: Math.max(1, Math.round(lesson.material.size / 1024)) })}</span>
            </span>
            <Download size={16} className="shrink-0 text-ink-500" aria-hidden="true" />
          </a>
        </Card>
      )}

      {done ? (
        <Card className="p-6">
          <SectionHeading
            title={done.status === 'reviewed' ? t('reviewed') : t('awaiting_review')}
            subtitle={t('sent_on', { date: formatDate(done.submittedAt) })}
            icon={CheckCircle2}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {done.quizTotal > 0 && <Badge tone={done.quizScore === done.quizTotal ? 'success' : 'warning'}>{t('quiz_n_of_total', { n: done.quizScore, total: done.quizTotal })}</Badge>}
            {done.status === 'reviewed' && <Badge tone="brand">{t('plus_xp', { n: done.awardedXp ?? 0 })}</Badge>}
          </div>
          {done.feedback && (
            <p className="mt-4 rounded-[14px] border border-brand-200/70 bg-brand-100/50 px-4 py-3 text-sm leading-relaxed text-brand-800">{done.feedback}</p>
          )}

          <ol className="mt-5 space-y-3">
            {lesson.tasks.map((task, i) => (
              <li key={task.id} className="rounded-[16px] border edge fill-soft p-4">
                <Review task={task} index={i} value={done.answers.find((a) => a.taskId === task.id)?.value ?? ''} />
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <>
          <ol className="space-y-4">
            {lesson.tasks.map((task, i) => {
              const Icon = KIND_ICON[task.kind]
              return (
                <li key={task.id}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink-900">{t('question_n', { n: i + 1 })}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                        <Icon size={12} aria-hidden="true" />
                        {t(KIND_LABEL[task.kind])}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-ink-500">{t('plus_xp', { n: task.points })}</span>
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed font-medium text-ink-900">{task.prompt}</p>

                    <div className="mt-4">
                      {task.kind === 'quiz' ? (
                        <ul className="space-y-2" role="radiogroup" aria-label={t('question_n', { n: i + 1 })}>
                          {(task.options ?? []).map((option, oi) => {
                            const picked = answers[task.id] === String(oi)
                            return (
                              <li key={oi}>
                                <button
                                  type="button"
                                  role="radio"
                                  aria-checked={picked}
                                  onClick={() => setAnswers((a) => ({ ...a, [task.id]: String(oi) }))}
                                  className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-sm transition ${
                                    picked ? 'border-brand-400 bg-brand-100/60 font-semibold text-brand-800' : 'edge fill text-ink-700 hover:border-brand-300'
                                  }`}
                                >
                                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${picked ? 'border-brand-600' : 'border-ink-300'}`}>
                                    {picked && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                                  </span>
                                  {option}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      ) : task.kind === 'code' ? (
                        <textarea
                          className={`${inputClass} min-h-40 resize-y font-mono text-xs`}
                          value={answers[task.id] ?? ''}
                          onChange={(e) => setAnswers((a) => ({ ...a, [task.id]: e.target.value }))}
                          spellCheck={false}
                          aria-label={t('your_code_for_question_n', { n: i + 1 })}
                        />
                      ) : (
                        <textarea
                          className={`${inputClass} min-h-28 resize-y`}
                          value={answers[task.id] ?? ''}
                          onChange={(e) => setAnswers((a) => ({ ...a, [task.id]: e.target.value }))}
                          placeholder={t('write_your_answer')}
                          aria-label={t('your_answer_to_question_n', { n: i + 1 })}
                        />
                      )}
                    </div>
                  </Card>
                </li>
              )
            })}
          </ol>

          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-sm text-ink-600">{t('n_of_total_answered', { n: answered, total: lesson.tasks.length })}</p>
            <Button icon={Send} onClick={submit} disabled={lesson.tasks.length === 0}>
              {t('send_answers')}
            </Button>
          </Card>
          {error && (
            <p role="alert" className="rounded-[14px] border border-rose-300/60 bg-rose-100/60 px-3.5 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}

/** The student's own answer, shown back to them once it has been handed in. */
function Review({ task, index, value }: { task: CustomTask; index: number; value: string }) {
  const correct = task.kind === 'quiz' && Number(value) === task.answerIndex
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-ink-900">{t('question_n', { n: index + 1 })}</span>
        {task.kind === 'quiz' && <Badge tone={correct ? 'success' : 'danger'}>{correct ? t('correct') : t('incorrect')}</Badge>}
      </div>
      <p className="mt-2 text-sm font-medium text-ink-900">{task.prompt}</p>
      {task.kind === 'quiz' ? (
        <p className="mt-2 text-sm text-ink-600">
          {t('chose_answer', { answer: (task.options ?? [])[Number(value)] ?? '—' })}
          {!correct && <span className="block text-emerald-700">{t('correct_answer_was', { answer: (task.options ?? [])[task.answerIndex ?? 0] ?? '—' })}</span>}
        </p>
      ) : task.kind === 'code' ? (
        <pre className="code-surface mt-2 overflow-x-auto rounded-[12px] p-3 font-mono text-xs whitespace-pre-wrap text-[#e2e8f0]">{value || t('left_blank')}</pre>
      ) : (
        <p className="mt-2 rounded-[12px] fill px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-ink-700">{value || t('left_blank')}</p>
      )}
    </>
  )
}
