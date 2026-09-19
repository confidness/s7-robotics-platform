import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Code2, FileText, ListChecks, MessageSquareText, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { customLessonById } from '../../lib/selectors'
import { MAX_TASKS_PER_LESSON, type CustomLesson, type CustomTask, type LessonMaterial, type TaskKind } from '../../lib/types'
import { Button, Card, Field, SectionHeading, btn, controlClass, inputClass } from '../../components/ui'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'

/** Teaching material is held as a data URL, the same way project attachments are. */
const MAX_MATERIAL_BYTES = 4 * 1024 * 1024
const MATERIAL_ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const KINDS: { kind: TaskKind; icon: typeof ListChecks; label: string; hint: string }[] = [
  { kind: 'quiz', icon: ListChecks, label: 'task_kind_quiz', hint: 'task_kind_quiz_hint' },
  { kind: 'code', icon: Code2, label: 'task_kind_code', hint: 'task_kind_code_hint' },
  { kind: 'open', icon: MessageSquareText, label: 'task_kind_open', hint: 'task_kind_open_hint' },
]

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

function emptyTask(kind: TaskKind): CustomTask {
  const base = { id: uid('t'), kind, prompt: '', points: 10 }
  if (kind === 'quiz') return { ...base, options: ['', ''], answerIndex: 0 }
  if (kind === 'code') return { ...base, starter: '' }
  return base
}

export default function LessonBuilder() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { state, user, saveCustomLesson, setLessonPublished } = useApp()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const existing = customLessonById(state, lessonId)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [summary, setSummary] = useState(existing?.summary ?? '')
  const [material, setMaterial] = useState<LessonMaterial | undefined>(existing?.material)
  const [tasks, setTasks] = useState<CustomTask[]>(existing?.tasks ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalPoints = useMemo(() => tasks.reduce((n, task) => n + task.points, 0), [tasks])
  const full = tasks.length >= MAX_TASKS_PER_LESSON

  if (!user) return null

  function patchTask(id: string, patch: Partial<CustomTask>) {
    setTasks((all) => all.map((task) => (task.id === id ? { ...task, ...patch } : task)))
  }

  function readMaterial(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_MATERIAL_BYTES) {
      setErrors((e) => ({ ...e, material: t('file_too_large', { name: file.name, mb: 4 }) }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setMaterial({ name: file.name, mime: file.type || 'application/octet-stream', size: file.size, url: String(reader.result) })
      setErrors((e) => ({ ...e, material: '' }))
    }
    reader.onerror = () => setErrors((e) => ({ ...e, material: t('file_could_not_be_read', { name: file.name }) }))
    reader.readAsDataURL(file)
  }

  /** Everything a lesson needs before a student can be asked to do it. */
  function validate() {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = t('give_the_lesson_a_title')
    if (!summary.trim()) next.summary = t('describe_what_the_lesson_covers')
    if (tasks.length === 0) next.tasks = t('add_at_least_one_task')
    tasks.forEach((task, i) => {
      if (!task.prompt.trim()) next[`p-${task.id}`] = t('task_n_needs_a_question', { n: i + 1 })
      if (task.kind === 'quiz') {
        const filled = (task.options ?? []).filter((o) => o.trim())
        if (filled.length < 2) next[`o-${task.id}`] = t('task_n_needs_two_options', { n: i + 1 })
        else if (!(task.options ?? [])[task.answerIndex ?? 0]?.trim()) next[`o-${task.id}`] = t('task_n_needs_a_marked_answer', { n: i + 1 })
      }
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function persist(publish: boolean) {
    if (!validate()) {
      toast({ title: t('check_the_highlighted_fields'), tone: 'error' })
      return
    }
    const lesson: CustomLesson = {
      id: existing?.id ?? uid('cl'),
      authorId: existing?.authorId ?? user!.id,
      title: title.trim(),
      summary: summary.trim(),
      material,
      tasks: tasks.map((task) => (task.kind === 'quiz' ? { ...task, options: (task.options ?? []).map((o) => o.trim()).filter(Boolean) } : task)),
      published: existing?.published ?? false,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveCustomLesson(lesson)
    if (publish) setLessonPublished(lesson.id, true)
    toast({
      title: publish ? t('lesson_published') : t('lesson_saved'),
      body: publish ? t('students_can_see_it_now') : t('it_stays_a_draft_until_you_publish'),
      tone: 'success',
    })
    navigate('/m/lessons')
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to="/m/lessons" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
          <ArrowLeft size={15} aria-hidden="true" />
          {t('my_lessons')}
        </Link>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-ink-900">{existing ? t('edit_lesson') : t('new_lesson')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('upload_the_material_then_add_up_to_n_questions', { n: MAX_TASKS_PER_LESSON })}</p>
      </header>

      <Card className="space-y-5 p-6">
        <SectionHeading title={t('the_lesson')} subtitle={t('what_students_see_before_they_open_it')} icon={FileText} />
        <Field label={t('title')} required error={errors.title}>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('eg_soldering_safety')} />
        </Field>
        <Field label={t('summary')} required error={errors.summary} hint={t('one_or_two_sentences')}>
          <textarea className={`${inputClass} min-h-20 resize-y`} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field>

        <Field label={t('teaching_material')} error={errors.material} hint={t('pdf_or_word_up_to_n_mb', { n: 4 })}>
          {material ? (
            <div className="flex items-center gap-3 rounded-[14px] border edge fill px-4 py-3">
              <FileText size={18} className="shrink-0 text-brand-600" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink-900">{material.name}</span>
                <span className="block text-xs text-ink-500">{t('n_kb', { n: Math.max(1, Math.round(material.size / 1024)) })}</span>
              </span>
              <button
                type="button"
                onClick={() => setMaterial(undefined)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full fill text-ink-500 transition hover:fill-raised hover:text-ink-900"
                aria-label={t('remove_file', { name: material.name })}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={MATERIAL_ACCEPT}
                className="sr-only"
                onChange={(e) => readMaterial(e.target.files?.[0] ?? undefined)}
                aria-label={t('teaching_material')}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed edge fill-soft px-4 py-6 text-sm font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-700"
              >
                <Upload size={16} aria-hidden="true" />
                {t('upload_pdf_or_word')}
              </button>
            </>
          )}
        </Field>
      </Card>

      <Card className="p-6">
        <SectionHeading
          title={t('questions')}
          subtitle={t('n_of_max_used_worth_total_xp', { n: tasks.length, max: MAX_TASKS_PER_LESSON, xp: totalPoints })}
          icon={ListChecks}
        />

        {errors.tasks && (
          <p role="alert" className="mt-3 rounded-[14px] border border-rose-300/60 bg-rose-100/60 px-3.5 py-2.5 text-sm font-medium text-rose-700">
            {errors.tasks}
          </p>
        )}

        <ul className="mt-5 space-y-4">
          {tasks.map((task, i) => {
            const meta = KINDS.find((k) => k.kind === task.kind)!
            return (
              <li key={task.id} className="rounded-[18px] border edge fill-soft p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-ink-900">{t('question_n', { n: i + 1 })}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/80 px-2.5 py-1 text-xs font-semibold text-brand-800 ring-1 rim ring-inset">
                    <meta.icon size={12} aria-hidden="true" />
                    {t(meta.label)}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                      {t('points')}
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={task.points}
                        onChange={(e) => patchTask(task.id, { points: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                        className={`${controlClass} w-20 text-center`}
                        aria-label={t('points_for_question_n', { n: i + 1 })}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setTasks((all) => all.filter((x) => x.id !== task.id))}
                      className="grid h-8 w-8 place-items-center rounded-full fill text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={t('remove_question_n', { n: i + 1 })}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </span>
                </div>

                <div className="mt-3.5 space-y-3">
                  <Field label={t('question')} required error={errors[`p-${task.id}`]}>
                    <textarea
                      className={`${inputClass} min-h-16 resize-y`}
                      value={task.prompt}
                      onChange={(e) => patchTask(task.id, { prompt: e.target.value })}
                      placeholder={t(meta.hint)}
                    />
                  </Field>

                  {task.kind === 'quiz' && (
                    <Field label={t('answer_options')} required error={errors[`o-${task.id}`]} hint={t('tick_the_correct_one')}>
                      <ul className="space-y-2">
                        {(task.options ?? []).map((option, oi) => (
                          <li key={oi} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => patchTask(task.id, { answerIndex: oi })}
                              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                                task.answerIndex === oi ? 'bg-emerald-600 text-white' : 'fill text-ink-500 ring-1 rim hover:text-ink-900'
                              }`}
                              aria-label={t('mark_option_n_correct', { n: oi + 1 })}
                              aria-pressed={task.answerIndex === oi}
                            >
                              {task.answerIndex === oi ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}
                            </button>
                            <input
                              className={inputClass}
                              value={option}
                              onChange={(e) => patchTask(task.id, { options: (task.options ?? []).map((o, x) => (x === oi ? e.target.value : o)) })}
                              placeholder={t('option_n', { n: oi + 1 })}
                              aria-label={t('option_n', { n: oi + 1 })}
                            />
                            {(task.options ?? []).length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  patchTask(task.id, {
                                    options: (task.options ?? []).filter((_, x) => x !== oi),
                                    answerIndex: (task.answerIndex ?? 0) >= oi ? Math.max(0, (task.answerIndex ?? 0) - 1) : (task.answerIndex ?? 0),
                                  })
                                }
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full fill text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
                                aria-label={t('remove_option_n', { n: oi + 1 })}
                              >
                                <X size={14} aria-hidden="true" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                      {(task.options ?? []).length < 6 && (
                        <button
                          type="button"
                          onClick={() => patchTask(task.id, { options: [...(task.options ?? []), ''] })}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
                        >
                          <Plus size={13} aria-hidden="true" />
                          {t('add_option')}
                        </button>
                      )}
                    </Field>
                  )}

                  {task.kind === 'code' && (
                    <Field label={t('starter_code')} hint={t('optional_what_the_editor_opens_with')}>
                      <textarea
                        className={`${inputClass} min-h-24 resize-y font-mono text-xs`}
                        value={task.starter ?? ''}
                        onChange={(e) => patchTask(task.id, { starter: e.target.value })}
                        spellCheck={false}
                      />
                    </Field>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {tasks.length === 0 && (
          <p className="mt-4 rounded-[16px] border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('no_questions_yet_pick_a_type_below')}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              disabled={full}
              onClick={() => setTasks((all) => [...all, emptyTask(k.kind)])}
              className={`${btn('secondary', 'md')} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Plus size={15} aria-hidden="true" />
              {t(k.label)}
            </button>
          ))}
        </div>
        {full && <p className="mt-3 text-xs font-medium text-ink-500">{t('that_is_the_maximum_of_n_questions', { n: MAX_TASKS_PER_LESSON })}</p>}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => persist(false)} variant="secondary" icon={Save}>
          {t('save_draft')}
        </Button>
        <Button onClick={() => persist(true)} icon={CheckCircle2}>
          {t('publish_to_students')}
        </Button>
      </div>
    </div>
  )
}
