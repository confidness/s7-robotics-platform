import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Clock, MapPin, Megaphone, Plus, Save, Target, Trash2, Trophy, Users, X } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { students } from '../../lib/selectors'
import type { Competition, CompetitionTask, ScheduleSlot, Team } from '../../lib/types'
import { Avatar, Badge, Button, Card, EmptyState, Field, SectionHeading, btn, controlClass, inputClass } from '../../components/ui'
import { t } from '../../i18n'

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

/** `datetime-local` wants `YYYY-MM-DDTHH:mm`; state keeps full ISO. */
const toLocalInput = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : '')

const DIFFICULTIES: CompetitionTask['difficulty'][] = ['Easy', 'Medium', 'Hard']

export default function EventBuilder() {
  const { competitionId } = useParams()
  const navigate = useNavigate()
  const { state, user, saveCompetition, announceCompetition, saveCompetitionTask, deleteCompetitionTask, saveTeam, deleteTeam } = useApp()
  const toast = useToast()

  const existing = state.competitions.find((c) => c.id === competitionId)
  const [name, setName] = useState(existing?.name ?? '')
  const [season, setSeason] = useState(existing?.season ?? '')
  const [location, setLocation] = useState(existing?.location ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [startsAt, setStartsAt] = useState(toLocalInput(existing?.startsAt ?? ''))
  const [endsAt, setEndsAt] = useState(toLocalInput(existing?.endsAt ?? ''))
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(existing?.schedule ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!user) return null

  const roster = students(state)
  const tasks = existing ? state.competitionTasks.filter((task) => task.competitionId === existing.id) : []
  const teams = existing ? state.teams.filter((team) => team.competitionId === existing.id) : []

  function validate() {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = t('give_the_event_a_name')
    if (!location.trim()) next.location = t('where_does_it_happen')
    if (!startsAt) next.startsAt = t('set_a_start_time')
    if (!endsAt) next.endsAt = t('set_an_end_time')
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) next.endsAt = t('it_has_to_end_after_it_starts')
    schedule.forEach((slot, i) => {
      if (!slot.time.trim() || !slot.title.trim()) next[`s-${slot.id}`] = t('slot_n_needs_a_time_and_a_title', { n: i + 1 })
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function persist(announce: boolean) {
    if (!validate()) {
      toast({ title: t('check_the_highlighted_fields'), tone: 'error' })
      return
    }
    const competition: Competition = {
      id: existing?.id ?? uid('c'),
      authorId: existing?.authorId ?? user!.id,
      name: name.trim(),
      season: season.trim(),
      location: location.trim(),
      description: description.trim(),
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      schedule,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    saveCompetition(competition)
    if (announce) announceCompetition(competition.id)
    toast({
      title: announce ? t('event_announced') : t('event_saved'),
      body: announce ? t('every_student_has_been_notified') : t('students_see_it_on_the_competition_page'),
      tone: 'success',
    })
    navigate('/m/competition')
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to="/m/competition" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
          <ArrowLeft size={15} aria-hidden="true" />
          {t('events')}
        </Link>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-ink-900">{existing ? t('edit_event') : t('new_event')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('set_the_dates_the_running_order_the_teams_and_th')}</p>
      </header>

      <Card className="space-y-5 p-6">
        <SectionHeading title={t('the_event')} subtitle={t('what_students_see_at_the_top_of_the_page')} icon={Trophy} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('event_name')} required error={errors.name}>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('eg_spring_robotics_cup')} />
          </Field>
          <Field label={t('season')} hint={t('optional_eg_spring_2026')}>
            <input className={inputClass} value={season} onChange={(e) => setSeason(e.target.value)} />
          </Field>
        </div>
        <Field label={t('location')} required error={errors.location}>
          <span className="relative block">
            <MapPin size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-500" aria-hidden="true" />
            <input className={`${inputClass} pl-10`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('eg_almaty_innovation_centre')} />
          </span>
        </Field>
        <Field label={t('description')} hint={t('what_happens_and_who_it_is_for')}>
          <textarea className={`${inputClass} min-h-24 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('starts')} required error={errors.startsAt}>
            <input type="datetime-local" className={inputClass} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </Field>
          <Field label={t('ends')} required error={errors.endsAt}>
            <input type="datetime-local" className={inputClass} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* ------------------------------------------------------------ running order */}
      <Card className="p-6">
        <SectionHeading title={t('running_order')} subtitle={t('n_slots_across_two_days', { n: schedule.length })} icon={CalendarClock} />

        <ul className="mt-5 space-y-3">
          {schedule.map((slot, i) => (
            <li key={slot.id} className="rounded-[18px] border edge fill-soft p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink-900">{t('slot_n', { n: i + 1 })}</span>
                <select
                  className={`${controlClass} w-auto`}
                  value={slot.day}
                  onChange={(e) => setSchedule((all) => all.map((x) => (x.id === slot.id ? { ...x, day: Number(e.target.value) as 1 | 2 } : x)))}
                  aria-label={t('day_for_slot_n', { n: i + 1 })}
                >
                  <option value={1}>{t('day_n', { n: 1 })}</option>
                  <option value={2}>{t('day_n', { n: 2 })}</option>
                </select>
                <span className="relative">
                  <Clock size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-500" aria-hidden="true" />
                  <input
                    type="time"
                    className={`${controlClass} w-32 pl-9`}
                    value={slot.time}
                    onChange={(e) => setSchedule((all) => all.map((x) => (x.id === slot.id ? { ...x, time: e.target.value } : x)))}
                    aria-label={t('time_for_slot_n', { n: i + 1 })}
                  />
                </span>
                <button
                  type="button"
                  onClick={() => setSchedule((all) => all.filter((x) => x.id !== slot.id))}
                  className="ml-auto grid h-8 w-8 place-items-center rounded-full fill text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={t('remove_slot_n', { n: i + 1 })}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={slot.title}
                  onChange={(e) => setSchedule((all) => all.map((x) => (x.id === slot.id ? { ...x, title: e.target.value } : x)))}
                  placeholder={t('eg_practice_rounds')}
                  aria-label={t('title_for_slot_n', { n: i + 1 })}
                />
                <input
                  className={inputClass}
                  value={slot.detail}
                  onChange={(e) => setSchedule((all) => all.map((x) => (x.id === slot.id ? { ...x, detail: e.target.value } : x)))}
                  placeholder={t('eg_two_timed_runs_on_the_official_mat')}
                  aria-label={t('detail_for_slot_n', { n: i + 1 })}
                />
              </div>
              {errors[`s-${slot.id}`] && (
                <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
                  {errors[`s-${slot.id}`]}
                </p>
              )}
            </li>
          ))}
        </ul>

        {schedule.length === 0 && <p className="mt-4 rounded-[16px] border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('no_slots_yet_add_the_first_one')}</p>}

        <button
          type="button"
          onClick={() => setSchedule((all) => [...all, { id: uid('s'), day: 1, time: '09:00', title: '', detail: '' }])}
          className={`${btn('secondary', 'md')} mt-5`}
        >
          <Plus size={15} aria-hidden="true" />
          {t('add_slot')}
        </button>
      </Card>

      {existing ? (
        <>
          <TeamsCard competition={existing} teams={teams} roster={roster} onSave={saveTeam} onDelete={deleteTeam} />
          <TasksCard competition={existing} tasks={tasks} onSave={saveCompetitionTask} onDelete={deleteCompetitionTask} />
        </>
      ) : (
        <Card className="p-6">
          <SectionHeading title={t('teams_and_tasks')} subtitle={t('save_the_event_first_then_add_them_here')} icon={Users} />
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => persist(false)} variant="secondary" icon={Save}>
          {t('save_event')}
        </Button>
        <Button onClick={() => persist(true)} icon={Megaphone}>
          {t('save_and_announce')}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ teams */

function TeamsCard({
  competition,
  teams,
  roster,
  onSave,
  onDelete,
}: {
  competition: Competition
  teams: Team[]
  roster: ReturnType<typeof students>
  onSave: (team: Team) => void
  onDelete: (teamId: string) => void
}) {
  const { user } = useApp()
  const [name, setName] = useState('')
  const [motto, setMotto] = useState('')

  return (
    <Card className="p-6">
      <SectionHeading title={t('teams')} subtitle={t('points_are_earned_by_scoring_tasks_never_typed_i')} icon={Users} />

      <ul className="mt-5 space-y-3">
        {teams.map((team) => (
          <li key={team.id} className="rounded-[18px] border edge fill-soft p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-ink-900">{team.name}</span>
              <Badge tone="accent">{t('n_points', { n: team.points })}</Badge>
              <button
                type="button"
                onClick={() => onDelete(team.id)}
                className="ml-auto grid h-8 w-8 place-items-center rounded-full fill text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label={t('remove_team', { name: team.name })}
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
            {team.motto && <p className="mt-1 text-xs text-ink-500 italic">“{team.motto}”</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {roster.map((student) => {
                const inTeam = team.memberIds.includes(student.id)
                return (
                  <button
                    key={student.id}
                    type="button"
                    aria-pressed={inTeam}
                    onClick={() =>
                      onSave({
                        ...team,
                        memberIds: inTeam ? team.memberIds.filter((id) => id !== student.id) : [...team.memberIds, student.id],
                      })
                    }
                    className={`flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-medium transition ${
                      inTeam ? 'bg-accent-100/80 text-accent-800 ring-1 rim ring-inset' : 'fill text-ink-600 ring-1 rim hover:text-ink-900'
                    }`}
                  >
                    <Avatar name={student.name} initials={student.avatar} size={20} />
                    {student.name.split(' ')[0]}
                    {inTeam && <X size={11} aria-hidden="true" />}
                  </button>
                )
              })}
              {roster.length === 0 && <p className="text-xs text-ink-500">{t('no_students_have_registered_yet')}</p>}
            </div>
          </li>
        ))}
      </ul>

      {teams.length === 0 && <p className="mt-4 rounded-[16px] border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('no_teams_yet_create_the_first_one')}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('team_name')} aria-label={t('team_name')} />
        <input className={inputClass} value={motto} onChange={(e) => setMotto(e.target.value)} placeholder={t('motto_optional')} aria-label={t('motto_optional')} />
        <Button
          variant="secondary"
          icon={Plus}
          onClick={() => {
            if (!name.trim() || !user) return
            onSave({ id: uid('tm'), name: name.trim(), motto: motto.trim(), coachId: user.id, memberIds: [], points: 0, competitionId: competition.id })
            setName('')
            setMotto('')
          }}
        >
          {t('add_team')}
        </Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ tasks */

function TasksCard({
  competition,
  tasks,
  onSave,
  onDelete,
}: {
  competition: Competition
  tasks: CompetitionTask[]
  onSave: (task: CompetitionTask) => void
  onDelete: (taskId: string) => void
}) {
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState(50)
  const [difficulty, setDifficulty] = useState<CompetitionTask['difficulty']>('Medium')

  return (
    <Card className="p-6">
      <SectionHeading title={t('competition_tasks')} subtitle={t('what_teams_can_score_during_the_event')} icon={Target} />

      <ul className="mt-5 space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="flex flex-wrap items-center gap-3 rounded-[18px] border edge fill-soft p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink-900">{task.title}</p>
              {task.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{task.description}</p>}
            </div>
            <Badge tone={task.difficulty === 'Hard' ? 'danger' : task.difficulty === 'Medium' ? 'warning' : 'success'}>{t(`difficulty_${task.difficulty.toLowerCase()}`)}</Badge>
            <Badge tone="accent">{t('n_points', { n: task.points })}</Badge>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="grid h-8 w-8 place-items-center rounded-full fill text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label={t('remove_task', { name: task.title })}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && <p className="mt-4 rounded-[16px] border border-dashed edge px-4 py-8 text-center text-sm text-ink-500">{t('no_tasks_yet_add_the_first_one')}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('task_title')} aria-label={t('task_title')} />
        <select className={`${controlClass} w-auto`} value={difficulty} onChange={(e) => setDifficulty(e.target.value as CompetitionTask['difficulty'])} aria-label={t('difficulty')}>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {t(`difficulty_${d.toLowerCase()}`)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          max={500}
          className={`${controlClass} w-24 text-center`}
          value={points}
          onChange={(e) => setPoints(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
          aria-label={t('points')}
        />
        <Button
          variant="secondary"
          icon={Plus}
          onClick={() => {
            if (!title.trim()) return
            onSave({
              id: uid('ct'),
              competitionId: competition.id,
              title: title.trim(),
              description: '',
              difficulty,
              points,
              deadline: competition.endsAt,
              status: 'open',
            })
            setTitle('')
          }}
        >
          {t('add_task')}
        </Button>
      </div>
    </Card>
  )
}

/** Shown on the mentor's competition page when the academy has announced nothing yet. */
export function NoEvents() {
  return <EmptyState icon={Trophy} title={t('no_events_yet')} body={t('announce_a_competition_and_it_appears_for_every_')} />
}
