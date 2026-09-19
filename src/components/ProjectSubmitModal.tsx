import { useRef, useState } from 'react'
import { Film, ImagePlus, Save, Send, Trash2, UploadCloud } from 'lucide-react'
import type { Attachment, Lesson, Project } from '../lib/types'
import { useApp, useToast } from '../lib/store'
import { Button, Field, Modal, inputClass } from './ui'
import { CodeEditor } from './code'
import { uid } from '../lib/logic'
import { t } from '../i18n'

const MAX_BYTES = 3 * 1024 * 1024

export default function ProjectSubmitModal({
  open,
  onClose,
  lesson,
  existing,
  initialCode,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  lesson: Lesson
  existing?: Project
  /** Whatever the student currently has in the lesson editor — carried straight into the form. */
  initialCode?: string
  onSubmitted?: (project: Project) => void
}) {
  const { saveProject } = useApp()
  const toast = useToast()

  const [title, setTitle] = useState(existing?.title ?? `${lesson.task.title} — ${lesson.title}`)
  const [description, setDescription] = useState(existing?.description ?? '')
  const [code, setCode] = useState(existing?.code ?? initialCode ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | null, kind: Attachment['kind']) {
    if (!files) return
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        setErrors((e) => ({ ...e, upload: `${file.name} is larger than 3 MB. Compress it and try again.` }))
        continue
      }
      const reader = new FileReader()
      reader.onload = () => setAttachments((all) => [...all, { id: uid('a'), kind, name: file.name, url: String(reader.result), size: file.size }])
      reader.onerror = () => setErrors((e) => ({ ...e, upload: `${file.name} could not be read. Try a different file.` }))
      reader.readAsDataURL(file)
    }
    setErrors((e) => ({ ...e, upload: '' }))
  }

  function save(status: 'draft' | 'submitted') {
    const next: Record<string, string> = {}
    if (title.trim().length < 4) next.title = t('give_the_project_a_title_of_at_least_4_character')
    if (status === 'submitted') {
      if (description.trim().length < 30) next.description = t('describe_what_you_built_in_at_least_30_character')
      if (code.trim().length < 20) next.code = t('paste_the_code_you_actually_uploaded_to_the_boar')
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    const project = saveProject({ id: existing?.id, title: title.trim(), description: description.trim(), code, notes: notes.trim(), attachments, courseId: lesson.courseId, lessonId: lesson.id }, status)
    setBusy(false)

    toast(
      status === 'submitted'
        ? { title: t('project_submitted'), body: t('status_is_now_pending_review_your_mentor_has_bee'), tone: 'success' }
        : { title: t('draft_saved'), body: t('you_can_finish_and_submit_it_from_the_projects_p'), tone: 'info' },
    )
    onSubmitted?.(project)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={existing ? t('update_project') : t('submit_project')}
      subtitle={t('lesson_and_task', { lesson: lesson.title, task: lesson.task.title })}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button variant="secondary" icon={Save} onClick={() => save('draft')} disabled={busy}>
            {t('save_draft')}
          </Button>
          <Button icon={Send} onClick={() => save('submitted')} loading={busy}>
            {t('submit_for_review')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-200/70 bg-brand-100/50 p-3.5 text-sm text-brand-800">
          <p className="font-semibold">{t('what_the_mentor_checks')}</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-brand-800">
            {lesson.task.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <Field label={t('project_name')} required error={errors.title}>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ultrasonic_distance_meter')} />
        </Field>

        <Field label={t('description')} required error={errors.description} hint={t('what_does_it_do_how_did_you_build_it_and_what_su')}>
          <textarea className={`${inputClass} min-h-28 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('the_sensor_faces_forward_and_prints_the_distance')} />
        </Field>

        <div>
          <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-ink-800">
            {t('code')} <span className="text-rose-500">*</span>
          </span>
          <CodeEditor value={code} onChange={setCode} filename={lesson.code.filename} minRows={10} />
          {errors.code && <span className="mt-1.5 block text-xs font-medium text-rose-600">{errors.code}</span>}
        </div>

        {/* uploads */}
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { kind: 'image' as const, ref: imageInput, icon: ImagePlus, label: t('photos'), hint: t('wiring_build_bench_test'), accept: 'image/*' },
            { kind: 'video' as const, ref: videoInput, icon: Film, label: t('video'), hint: t('a_short_clip_of_it_running'), accept: 'video/*' },
          ].map((slot) => (
            <div key={slot.kind}>
              <input ref={slot.ref} type="file" accept={slot.accept} multiple={slot.kind === 'image'} className="sr-only" onChange={(e) => addFiles(e.target.files, slot.kind)} aria-label={t('upload_files', { kind: slot.label })} />
              <button
                type="button"
                onClick={() => slot.ref.current?.click()}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed edge fill-soft px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50/50"
              >
                <slot.icon size={20} className="text-ink-400" aria-hidden="true" />
                <span className="text-sm font-semibold text-ink-800">{slot.label}</span>
                <span className="text-xs text-ink-500">{slot.hint}</span>
              </button>
            </div>
          ))}
        </div>

        {errors.upload && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
            {errors.upload}
          </p>
        )}

        {attachments.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((a) => (
              <li key={a.id} className="group relative overflow-hidden rounded-xl border edge">
                {a.kind === 'image' ? (
                  <img src={a.url} alt={a.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="code-surface grid h-24 w-full place-items-center text-[#94a3b8]">
                    <Film size={22} aria-hidden="true" />
                  </div>
                )}
                <p className="truncate fill-strong px-2 py-1.5 text-[11px] text-ink-600">{a.name}</p>
                <button
                  onClick={() => setAttachments((all) => all.filter((x) => x.id !== a.id))}
                  className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-lg fill-strong text-rose-600 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                  aria-label={t('remove_file', { name: a.name })}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Field label={t('notes_for_the_mentor')} hint={t('anything_that_did_not_work_or_a_question_you_wan')}>
          <textarea className={`${inputClass} min-h-20 resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('the_readings_jumped_around_on_carpet_until_i_add')} />
        </Field>

        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <UploadCloud size={13} aria-hidden="true" />{t('files_stay_in_this_browser_nothing_is_uploaded_t')}</p>
      </div>
    </Modal>
  )
}
