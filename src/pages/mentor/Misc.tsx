import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, CalendarClock, Flag, LogOut, MapPin, Medal, Pencil, Plus, RefreshCw, Shield, Target, Trash2, Trophy, Users, Zap } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { courseProgress, leaderboard, profileOf, students } from '../../lib/selectors'
import { lessonsForCourse, modulesForCourse } from '../../lib/curriculum'
import { Avatar, Badge, Button, Card, EmptyState, Modal, ProgressBar, SectionHeading } from '../../components/ui'
import { formatDate } from '../../lib/hooks'
import { NoEvents } from './EventBuilder'
import { t, formatNumber } from '../../i18n'

/* ------------------------------------------------------------------ courses */

export function MentorCourses() {
  const { state } = useApp()
  const roster = students(state)

  return (
    <div className="animate-rise space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('courses')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('the_curriculum_you_teach_from_with_live_enrolmen')}</p>
      </header>

      <div className="space-y-5">
        {state.courses.map((course) => {
          const lessons = lessonsForCourse(course.id)
          const modules = modulesForCourse(course.id)
          const enrolled = roster.filter((u) => profileOf(state, u.id)?.enrolledCourseIds.includes(course.id))
          const avg = enrolled.length ? Math.round(enrolled.reduce((a, u) => a + courseProgress(state, u.id, course.id).percent, 0) / enrolled.length) : 0
          const instructor = state.users.find((u) => u.id === course.instructorId)

          return (
            <Card key={course.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 border-b edge p-5">
                <span className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${course.gradient}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-ink-900">{course.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-500">{course.tagline}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{t('n_lessons', { n: lessons.length })}</Badge>
                  <Badge tone="brand">{t('n_enrolled', { n: enrolled.length })}</Badge>
                  <Badge tone={avg > 50 ? 'success' : 'warning'}>{t('n_percent_average', { n: avg })}</Badge>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[1.3fr_1fr]">
                <div>
                  <SectionHeading title={t('modules')} icon={BookOpen} />
                  <ol className="space-y-2.5">
                    {modules.map((m, i) => {
                      const ml = lessons.filter((l) => l.moduleId === m.id)
                      return (
                        <li key={m.id} className="flex items-start gap-3 rounded-[16px] border edge fill-soft p-3">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand-400 to-accent-500 text-white text-xs font-bold">{i + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-ink-900">{m.title}</span>
                            <span className="block text-xs text-ink-500">{m.summary}</span>
                          </span>
                          <Badge tone="neutral">{ml.length}</Badge>
                        </li>
                      )
                    })}
                  </ol>
                </div>

                <div>
                  <SectionHeading title={t('students_on_this_track')} icon={Users} />
                  {enrolled.length === 0 ? (
                    <p className="rounded-xl border border-dashed edge px-4 py-6 text-center text-sm text-ink-500">{t('nobody_is_enrolled_yet')}</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {enrolled.map((u) => {
                        const p = courseProgress(state, u.id, course.id)
                        return (
                          <li key={u.id}>
                            <Link to={`/m/students/${u.id}`} className="flex items-center gap-3 rounded-[16px] border edge fill-soft p-2.5 transition hover:border-brand-300 hover:bg-brand-50/40">
                              <Avatar name={u.name} initials={u.avatar} size={30} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-ink-900">{u.name}</span>
                                <span className="mt-1 block">
                                  <ProgressBar value={p.percent} size="sm" label={t('progress_of', { name: u.name })} />
                                </span>
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-ink-600 tabular-nums">{p.percent}%</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {instructor && <p className="mt-4 text-xs text-ink-500">{t('lead_instructor', { name: instructor.name })}</p>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ competition */

export function MentorCompetition() {
  const { state, user, setTaskStatus, deleteCompetition } = useApp()
  const toast = useToast()
  const [picked, setPicked] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!user) return null

  // Nothing is seeded, so an academy that has announced nothing lands here.
  const competition = state.competitions.find((c) => c.id === picked) ?? state.competitions[0]
  if (!competition) {
    return (
      <div className="animate-rise space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('events')}</h1>
            <p className="mt-1 text-sm text-ink-500">{t('announce_a_competition_set_the_running_order_and')}</p>
          </div>
          <Link to="/m/competition/new" className="shrink-0">
            <Button icon={Plus}>{t('new_event')}</Button>
          </Link>
        </header>
        <NoEvents />
      </div>
    )
  }

  const teams = state.teams.filter((t) => t.competitionId === competition.id).sort((a, b) => b.points - a.points)
  const tasks = state.competitionTasks.filter((t) => t.competitionId === competition.id)
  const board = leaderboard(state).slice(0, 6)

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {state.competitions.map((c) => (
            <button
              key={c.id}
              onClick={() => setPicked(c.id)}
              aria-pressed={c.id === competition.id}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                c.id === competition.id ? 'bg-accent-600 text-white' : 'fill text-ink-600 ring-1 rim hover:text-ink-900'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/m/competition/${competition.id}/edit`}>
            <Button variant="secondary" size="sm" icon={Pencil}>
              {t('edit')}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" icon={Trash2} className="text-rose-600" onClick={() => setConfirmDelete(true)}>
            {t('delete')}
          </Button>
          <Link to="/m/competition/new">
            <Button size="sm" icon={Plus}>
              {t('new_event')}
            </Button>
          </Link>
        </div>
      </header>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('delete_this_event')} subtitle={competition.name}>
        <p className="text-sm leading-relaxed text-ink-600">{t('deleting_removes_the_running_order_its_tasks_and')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => {
              deleteCompetition(competition.id)
              setPicked(null)
              setConfirmDelete(false)
              toast({ title: t('event_deleted'), tone: 'success' })
            }}
          >
            {t('delete')}
          </Button>
        </div>
      </Modal>

      <Card className="overflow-hidden">
        <div className="tint-accent specular relative p-6 sm:p-8">
          {competition.season && (
            <span className="inline-flex items-center gap-1.5 rounded-full fill-strong px-3 py-1 text-xs font-bold text-accent-700">
              <Trophy size={13} aria-hidden="true" /> {competition.season}
            </span>
          )}
          <h1 className="mt-3 text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink-900 sm:text-[34px]">{competition.name}</h1>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} aria-hidden="true" />
              {competition.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={14} aria-hidden="true" />
              {formatDate(competition.startsAt)} — {formatDate(competition.endsAt)}
            </span>
          </p>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('teams')} subtitle={t('rosters_you_coach_and_their_current_score')} icon={Users} />
            {teams.length === 0 && <EmptyState icon={Users} title={t('no_teams_yet')} body={t('create_teams_with_your_students_and_they_will_sh')} />}
            <ul className="space-y-3">
              {teams.map((team, i) => {
                const coach = state.users.find((u) => u.id === team.coachId)
                return (
                  <li key={team.id} className="rounded-[16px] border edge fill-soft p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                        <span className={`grid h-6 w-6 place-items-center rounded-md text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'fill text-ink-500'}`}>{i + 1}</span>
                        {team.name}
                      </p>
                      <Badge tone={i === 0 ? 'warning' : 'neutral'}>{t('n_pts', { n: team.points })}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-ink-500 italic">“{team.motto}”</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {team.memberIds.map((id) => {
                        const m = state.users.find((u) => u.id === id)
                        return m ? (
                          <Link key={id} to={`/m/students/${id}`} className="flex items-center gap-1.5 rounded-full border edge py-1 pr-2.5 pl-1 transition hover:border-brand-300">
                            <Avatar name={m.name} initials={m.avatar} size={20} />
                            <span className="text-xs font-medium text-ink-700">{m.name.split(' ')[0]}</span>
                          </Link>
                        ) : null
                      })}
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                      <Flag size={12} aria-hidden="true" /> {t('coach_name', { name: coach?.name ?? '—' })}
                    </p>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('competition_tasks')} subtitle={t('score_a_task_once_the_team_has_demonstrated_it')} icon={Target} />
            {tasks.length === 0 ? (
              <EmptyState icon={Target} title={t('no_tasks_published')} body={t('publish_the_season_plan_and_tasks_will_appear_fo')} />
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => {
                  const team = state.teams.find((t) => t.id === task.teamId)
                  return (
                    <li key={task.id} className="flex flex-wrap items-start gap-3 rounded-[16px] border edge fill-soft p-4">
                      <div className="min-w-[13rem] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-ink-900">{task.title}</p>
                          <Badge tone={task.status === 'scored' ? 'success' : task.status === 'submitted' ? 'warning' : 'neutral'}>{t(`task_status_${task.status}`)}</Badge>
                          {team && <Badge tone="neutral">{team.name}</Badge>}
                        </div>
                        <p className="mt-1.5 text-sm text-ink-600">{task.description}</p>
                        <p className="mt-2 flex items-center gap-4 text-xs text-ink-500">
                          <span>{t('due_date', { date: formatDate(task.deadline) })}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                            <Zap size={12} aria-hidden="true" />
                            {t('n_pts', { n: task.points })}
                          </span>
                        </p>
                      </div>
                      {task.status === 'submitted' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            setTaskStatus(task.id, 'scored')
                            toast({ title: t('task_scored'), body: t('points_awarded', { title: task.title, n: task.points }), tone: 'success' })
                          }}
                        >
                          {t('score_task')}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('leaderboard')} icon={Medal} />
            {board.length === 0 && <p className="text-sm text-ink-500">{t('nobody_has_earned_experience_yet')}</p>}
            <ol className="space-y-2.5">
              {board.map((e, i) => (
                <li key={e.user.id} className="flex items-center gap-3">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'fill text-ink-500'}`}>{i + 1}</span>
                  <Avatar name={e.user.name} initials={e.user.avatar} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{e.user.name}</span>
                  <span className="shrink-0 text-xs font-bold text-ink-600 tabular-nums">{formatNumber(e.profile?.xp ?? 0)}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('running_order')} icon={CalendarClock} />
            {competition.schedule.length === 0 && <p className="mt-3 text-sm text-ink-500">{t('no_slots_yet_add_the_first_one')}</p>}
            <ol className="relative space-y-3.5 border-l edge pl-5">
              {competition.schedule.map((s) => (
                <li key={s.id} className="relative">
                  <span className="absolute top-1.5 -left-[1.65rem] h-2.5 w-2.5 rounded-full bg-accent-600 ring-4 ring-white" aria-hidden="true" />
                  <p className="font-mono text-xs font-bold text-accent-700">
                    {t('day_n', { n: s.day })} · {s.time}
                  </p>
                  <p className="text-sm font-semibold text-ink-900">{s.title}</p>
                  <p className="text-xs text-ink-500">{s.detail}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ settings */

export function MentorSettings() {
  const { state, user, resetDemo, logout } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  if (!user) return null

  const groups = state.groups.filter((g) => g.mentorId === user.id)

  return (
    <div className="animate-rise max-w-3xl space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('settings')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('your_mentor_account_and_the_data_stored_in_this_')}</p>
      </header>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.name} initials={user.avatar} size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-ink-900">{user.name}</p>
            <p className="text-sm text-ink-500">{user.title ? t(user.title) : ''}</p>
            <p className="text-xs text-ink-500">{user.email}</p>
          </div>
        </div>
        {user.bio && <p className="mt-4 text-sm leading-relaxed text-ink-700">{user.bio}</p>}
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            [t('groups'), groups.length],
            [t('students'), groups.reduce((a, g) => a + g.studentIds.length, 0)],
            [t('reviews_given'), state.projects.reduce((a, p) => a + p.feedback.filter((f) => f.mentorId === user.id).length, 0)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl fill p-3">
              <dt className="text-xs font-semibold text-ink-500">{k}</dt>
              <dd className="mt-1 text-lg font-bold text-ink-900 tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('academy_data')} subtitle={t('everything_is_stored_in_this_browser_only')} icon={Shield} />
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={() => setConfirmReset(true)}>
            {t('erase_all_data')}
          </Button>
          <Button
            variant="danger"
            icon={LogOut}
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            {t('sign_out')}
          </Button>
        </div>
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('erase_everything_in_this_browser')}
        subtitle={t('every_account_project_review_and_xp_record_store')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('keep_data')}
            </Button>
            <Button
              variant="danger"
              icon={RefreshCw}
              onClick={() => {
                resetDemo()
                setConfirmReset(false)
                navigate('/login')
                toast({ title: t('data_erased'), body: t('the_platform_is_back_to_a_clean_install'), tone: 'info' })
              }}
            >
              {t('erase_everything')}
            </Button>
          </>
        }
      >
        <p className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('this_cannot_be_undone_and_it_affects_every_accou')}
        </p>
      </Modal>
    </div>
  )
}
