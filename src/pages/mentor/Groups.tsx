import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ClipboardCheck, MapPin, Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { courseProgress, profileOf, students, REVIEW_QUEUE } from '../../lib/selectors'
import type { Group } from '../../lib/types'
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, ProgressBar, SectionHeading, controlClass, inputClass } from '../../components/ui'
import { plural } from '../../lib/hooks'
import { t, formatNumber } from '../../i18n'

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

export default function MentorGroups() {
  const { state, user, saveGroup, deleteGroup } = useApp()
  const toast = useToast()
  const [editing, setEditing] = useState<Group | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Group | null>(null)
  if (!user) return null

  const groups = state.groups.filter((g) => g.mentorId === user.id)
  const roster = students(state)

  const blank = (): Group => ({
    id: uid('g'),
    name: '',
    mentorId: user.id,
    schedule: '',
    room: '',
    studentIds: [],
    courseId: state.courses[0]?.id ?? '',
  })

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('groups')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('your_scheduled_sessions_and_who_is_in_each_one')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{plural(groups.length, 'group')}</Badge>
          <Button icon={Plus} onClick={() => setEditing(blank())}>
            {t('new_group')}
          </Button>
        </div>
      </header>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('no_groups_yet')}
          body={t('create_a_group_give_it_a_room_and_a_slot_and_add')}
          action={
            <Button icon={Plus} onClick={() => setEditing(blank())}>
              {t('new_group')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const course = state.courses.find((c) => c.id === group.courseId)
            const members = state.users.filter((u) => group.studentIds.includes(u.id))
            const avg = Math.round(members.reduce((a, m) => a + courseProgress(state, m.id, group.courseId).percent, 0) / (members.length || 1))
            const pending = state.projects.filter((p) => group.studentIds.includes(p.authorId) && REVIEW_QUEUE.includes(p.status))

            return (
              <Card key={group.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b edge fill-soft p-5">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-ink-900">{group.name}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={12} aria-hidden="true" />
                        {group.schedule}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={12} aria-hidden="true" />
                        {group.room}
                      </span>
                      <span>{course?.title}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pending.length > 0 && (
                      <Link to="/m/reviews">
                        <Badge tone="warning" icon={ClipboardCheck}>
                          {t('n_to_review', { n: pending.length })}
                        </Badge>
                      </Link>
                    )}
                    <Badge tone="neutral">{plural(members.length, 'student')}</Badge>
                    <Badge tone="accent">{t('n_percent_average', { n: avg })}</Badge>
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(group)}>
                      {t('edit')}
                    </Button>
                    <Button variant="ghost" size="sm" icon={Trash2} className="text-rose-600" onClick={() => setConfirmDelete(group)}>
                      {t('delete')}
                    </Button>
                  </div>
                </div>

                <div className="p-5">
                  <SectionHeading title={t('roster')} subtitle={t('tap_a_student_for_the_full_profile')} />
                  {members.length === 0 && (
                    <p className="rounded-[16px] border border-dashed edge px-4 py-6 text-center text-sm text-ink-500">{t('nobody_in_this_group_yet')}</p>
                  )}
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {members.map((m) => {
                      const profile = profileOf(state, m.id)
                      const p = courseProgress(state, m.id, group.courseId)
                      return (
                        <li key={m.id}>
                          <Link to={`/m/students/${m.id}`} className="flex items-center gap-3 rounded-[16px] border edge fill-soft p-3 transition hover:border-brand-300 hover:bg-brand-50/40">
                            <Avatar name={m.name} initials={m.avatar} size={36} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-900">{m.name}</span>
                              <span className="mt-1 block">
                                <ProgressBar value={p.percent} size="sm" label={t('progress_of', { name: m.name })} />
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-bold text-ink-600 tabular-nums">{formatNumber(profile?.xp ?? 0) ?? 0}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <GroupEditor
        group={editing}
        roster={roster}
        courses={state.courses}
        onClose={() => setEditing(null)}
        onSave={(g) => {
          saveGroup(g)
          setEditing(null)
          toast({ title: t('group_saved'), body: t('students_see_it_on_their_profile'), tone: 'success' })
        }}
      />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t('delete_this_group')} subtitle={confirmDelete?.name}>
        <p className="text-sm leading-relaxed text-ink-600">{t('the_students_stay_in_the_academy_only_the_group_')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => {
              deleteGroup(confirmDelete!.id)
              setConfirmDelete(null)
              toast({ title: t('group_deleted'), tone: 'success' })
            }}
          >
            {t('delete')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------------------------------------------ editor */

function GroupEditor({
  group,
  roster,
  courses,
  onClose,
  onSave,
}: {
  group: Group | null
  roster: ReturnType<typeof students>
  courses: { id: string; title: string }[]
  onClose: () => void
  onSave: (group: Group) => void
}) {
  const [draft, setDraft] = useState<Group | null>(group)
  const [error, setError] = useState('')

  // One modal serves every group, so it re-seeds itself whenever a different one opens.
  if (group && draft?.id !== group.id) {
    setDraft(group)
    setError('')
  }
  if (!group || !draft) return null

  return (
    <Modal open wide onClose={onClose} title={group.name ? t('edit_group') : t('new_group')} subtitle={t('a_room_a_slot_and_who_is_in_it')}>
      <div className="space-y-5">
        <Field label={t('group_name')} required error={error}>
          <input
            className={inputClass}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder={t('eg_arduino_tuesday_group')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('schedule')} hint={t('eg_tue_and_thu_1600')}>
            <span className="relative block">
              <CalendarClock size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500" aria-hidden="true" />
              <input className={`${inputClass} pl-10`} value={draft.schedule} onChange={(e) => setDraft({ ...draft, schedule: e.target.value })} />
            </span>
          </Field>
          <Field label={t('room')} hint={t('eg_lab_2')}>
            <span className="relative block">
              <MapPin size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500" aria-hidden="true" />
              <input className={`${inputClass} pl-10`} value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} />
            </span>
          </Field>
        </div>

        <Field label={t('course')} hint={t('progress_on_this_track_is_what_the_group_average')}>
          <select className={controlClass} value={draft.courseId} onChange={(e) => setDraft({ ...draft, courseId: e.target.value })}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('roster')} hint={t('a_student_belongs_to_one_group_at_a_time')}>
          {roster.length === 0 ? (
            <p className="text-sm text-ink-500">{t('no_students_have_registered_yet')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roster.map((student) => {
                const inGroup = draft.studentIds.includes(student.id)
                return (
                  <button
                    key={student.id}
                    type="button"
                    aria-pressed={inGroup}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        studentIds: inGroup ? draft.studentIds.filter((id) => id !== student.id) : [...draft.studentIds, student.id],
                      })
                    }
                    className={`flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-medium transition ${
                      inGroup ? 'bg-accent-100/80 text-accent-800 ring-1 rim ring-inset' : 'fill text-ink-600 ring-1 rim hover:text-ink-900'
                    }`}
                  >
                    <Avatar name={student.name} initials={student.avatar} size={20} />
                    {student.name.split(' ')[0]}
                    {inGroup && <X size={11} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          )}
        </Field>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              if (!draft.name.trim()) {
                setError(t('give_the_group_a_name'))
                return
              }
              onSave({ ...draft, name: draft.name.trim(), schedule: draft.schedule.trim(), room: draft.room.trim() })
            }}
          >
            {t('save_group')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
