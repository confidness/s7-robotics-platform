import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Code2, EyeOff, FileText, ListChecks, MessageSquareText, Pencil, Plus, Send, Trash2, Users } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { customLessonById, lessonsByAuthor, submissionsForLesson, userById } from '../../lib/selectors'
import type { CustomTask, LessonSubmission } from '../../lib/types'
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, inputClass } from '../../components/ui'
import { t, formatDate } from '../../i18n'

const KIND_ICON = { quiz: ListChecks, code: Code2, open: MessageSquareText }
const KIND_LABEL = { quiz: 'task_kind_quiz', code: 'task_kind_code', open: 'task_kind_open' }

/* ------------------------------------------------------------------ list */

export default function MentorLessons() {
  const { state, user, setLessonPublished, deleteCustomLesson } = useApp()
  const toast = useToast()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  if (!user) return null

  const lessons = lessonsByAuthor(state, user.id)
  const doomed = confirmDelete ? customLessonById(state, confirmDelete) : undefined

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('my_lessons')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('write_your_own_material_and_set_the_questions')}</p>
        </div>
        <Link to="/m/lessons/new" className="shrink-0">
          <Button icon={Plus}>{t('new_lesson')}</Button>
        </Link>
      </header>

      {lessons.length === 0 ? (
        <EmptyState icon={FileText} title={t('no_lessons_yet')} body={t('upload_a_pdf_or_word_file_add_questions_and_publ')} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {lessons.map((lesson) => {
            const subs = submissionsForLesson(state, lesson.id)
            const waiting = subs.filter((s) => s.status === 'submitted').length
            return (
              <li key={lesson.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={lesson.published ? 'success' : 'neutral'}>{lesson.published ? t('published') : t('draft')}</Badge>
                    <Badge tone="brand">{t('n_questions', { n: lesson.tasks.length })}</Badge>
                    {lesson.material && <Badge tone="accent">{t('has_material')}</Badge>}
                    {waiting > 0 && <Badge tone="warning">{t('n_waiting_for_review', { n: waiting })}</Badge>}
                  </div>

                  <h2 className="mt-3 text-base font-bold text-ink-900">{lesson.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-600">{lesson.summary}</p>
                  <p className="mt-2 text-xs text-ink-500">{t('updated_on', { date: formatDate(lesson.updatedAt) })}</p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t edge pt-4">
                    <Link to={`/m/lessons/${lesson.id}`}>
                      <Button variant="secondary" size="sm" icon={Users}>
                        {t('n_submissions', { n: subs.length })}
                      </Button>
                    </Link>
                    <Link to={`/m/lessons/${lesson.id}/edit`}>
                      <Button variant="ghost" size="sm" icon={Pencil}>
                        {t('edit')}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={lesson.published ? EyeOff : Send}
                      onClick={() => {
                        setLessonPublished(lesson.id, !lesson.published)
                        toast({ title: lesson.published ? t('lesson_hidden') : t('lesson_published'), tone: 'success' })
                      }}
                    >
                      {lesson.published ? t('unpublish') : t('publish')}
                    </Button>
                    <Button variant="ghost" size="sm" icon={Trash2} className="ml-auto text-rose-600" onClick={() => setConfirmDelete(lesson.id)}>
                      {t('delete')}
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={!!doomed} onClose={() => setConfirmDelete(null)} title={t('delete_this_lesson')} subtitle={doomed?.title}>
        <p className="text-sm leading-relaxed text-ink-600">{t('deleting_removes_the_lesson_and_every_answer_sen')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => {
              deleteCustomLesson(confirmDelete!)
              setConfirmDelete(null)
              toast({ title: t('lesson_deleted'), tone: 'success' })
            }}
          >
            {t('delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ submissions for one lesson */

export function LessonSubmissions() {
  const { lessonId } = useParams()
  const { state, reviewLessonSubmission } = useApp()
  const toast = useToast()
  const [open, setOpen] = useState<LessonSubmission | null>(null)
  const [feedback, setFeedback] = useState('')
  const [xp, setXp] = useState(0)
  const [error, setError] = useState('')

  const lesson = customLessonById(state, lessonId)
  if (!lesson) return <EmptyState icon={FileText} title={t('lesson_not_found')} body={t('it_may_have_been_deleted')} />

  const subs = submissionsForLesson(state, lesson.id)
  const maxXp = lesson.tasks.reduce((n, task) => n + task.points, 0)

  function startReview(sub: LessonSubmission) {
    setOpen(sub)
    setFeedback('')
    // Quiz answers already mark themselves; that share of the points is the obvious starting offer.
    setXp(sub.quizTotal ? Math.round((sub.quizScore / sub.quizTotal) * maxXp) : maxXp)
    setError('')
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to="/m/lessons" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
          <ArrowLeft size={15} aria-hidden="true" />
          {t('my_lessons')}
        </Link>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-ink-900">{lesson.title}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('n_submissions_worth_up_to_xp', { n: subs.length, xp: maxXp })}</p>
      </header>

      {subs.length === 0 ? (
        <EmptyState icon={Users} title={t('nobody_has_answered_yet')} body={lesson.published ? t('students_can_see_this_lesson_answers_appear_here') : t('this_lesson_is_still_a_draft_publish_it_first')} />
      ) : (
        <ul className="space-y-3">
          {subs.map((sub) => {
            const student = userById(state, sub.studentId)
            return (
              <li key={sub.id}>
                <Card className="flex flex-wrap items-center gap-4 p-4">
                  <Avatar name={student?.name ?? ''} initials={student?.avatar ?? '?'} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{student?.name ?? t('unknown')}</p>
                    <p className="text-xs text-ink-500">{t('submitted_when', { when: formatDate(sub.submittedAt) })}</p>
                  </div>
                  {sub.quizTotal > 0 && (
                    <Badge tone={sub.quizScore === sub.quizTotal ? 'success' : 'warning'}>{t('quiz_n_of_total', { n: sub.quizScore, total: sub.quizTotal })}</Badge>
                  )}
                  <Badge tone={sub.status === 'reviewed' ? 'success' : 'warning'}>{sub.status === 'reviewed' ? t('reviewed') : t('awaiting_review')}</Badge>
                  {sub.status === 'reviewed' ? (
                    <Badge tone="brand">{t('plus_xp', { n: sub.awardedXp ?? 0 })}</Badge>
                  ) : (
                    <Button size="sm" onClick={() => startReview(sub)}>
                      {t('review')}
                    </Button>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} wide title={t('review_answers')} subtitle={userById(state, open?.studentId)?.name}>
        {open && (
          <div className="space-y-5">
            <ol className="space-y-3">
              {lesson.tasks.map((task, i) => (
                <li key={task.id} className="rounded-[16px] border edge fill-soft p-4">
                  <AnswerRow task={task} index={i} value={open.answers.find((a) => a.taskId === task.id)?.value ?? ''} />
                </li>
              ))}
            </ol>

            <Field label={t('feedback')} required error={error} hint={t('name_one_thing_that_was_done_well_and_one_thing_')}>
              <textarea className={`${inputClass} min-h-24 resize-y`} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </Field>

            <Field label={t('xp_to_award')} hint={t('up_to_n_for_this_lesson', { n: maxXp })}>
              <input
                type="number"
                min={0}
                max={maxXp}
                className={inputClass}
                value={xp}
                onChange={(e) => setXp(Math.max(0, Math.min(maxXp, Number(e.target.value) || 0)))}
              />
            </Field>

            <Button
              icon={CheckCircle2}
              className="w-full"
              onClick={() => {
                if (!feedback.trim()) {
                  setError(t('feedback_is_required_for_any_decision'))
                  return
                }
                reviewLessonSubmission(open.id, feedback.trim(), xp)
                setOpen(null)
                toast({ title: t('answers_reviewed'), body: t('the_student_has_been_notified'), tone: 'success' })
              }}
            >
              {t('finish_review')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

/** One answer, rendered the way its question type deserves. */
function AnswerRow({ task, index, value }: { task: CustomTask; index: number; value: string }) {
  const Icon = KIND_ICON[task.kind]
  const correct = task.kind === 'quiz' && Number(value) === task.answerIndex
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-ink-900">{t('question_n', { n: index + 1 })}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
          <Icon size={12} aria-hidden="true" />
          {t(KIND_LABEL[task.kind])}
        </span>
        {task.kind === 'quiz' && <Badge tone={correct ? 'success' : 'danger'}>{correct ? t('correct') : t('incorrect')}</Badge>}
        <span className="ml-auto text-xs font-semibold text-ink-500">{t('plus_xp', { n: task.points })}</span>
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
