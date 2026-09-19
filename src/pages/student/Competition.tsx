import { useState } from 'react'
import { CalendarClock, Crown, Flag, MapPin, Medal, Target, Trophy, Users, Zap } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { leaderboard } from '../../lib/selectors'
import { Avatar, Badge, Button, Card, EmptyState, SectionHeading, Tabs } from '../../components/ui'
import { formatDate } from '../../lib/hooks'
import type { CompetitionTask } from '../../lib/types'
import { t, formatNumber } from '../../i18n'
import { localizeDifficulty, localizeLevelName } from '../../i18n/content'

const TASK_TONE: Record<CompetitionTask['status'], 'neutral' | 'brand' | 'warning' | 'success'> = {
  open: 'neutral',
  in_progress: 'brand',
  submitted: 'warning',
  scored: 'success',
}
const TASK_LABEL: Record<CompetitionTask['status'], string> = {
  open: 'task_status_open',
  in_progress: 'task_status_in_progress',
  submitted: 'task_status_submitted',
  scored: 'task_status_scored',
}

export default function Competition() {
  const { state, user, joinTeam, setTaskStatus } = useApp()
  const toast = useToast()
  const [tab, setTab] = useState<'teams' | 'tasks' | 'schedule' | 'leaderboard'>('teams')
  const [picked, setPicked] = useState<string | null>(null)
  if (!user) return null

  // Events are announced by a mentor; nothing is seeded, so this is empty until one is.
  const competition = state.competitions.find((c) => c.id === picked) ?? state.competitions[0]
  if (!competition) {
    return (
      <div className="animate-rise space-y-6">
        <header>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('competition')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('events_your_academy_is_running')}</p>
        </header>
        <EmptyState icon={Trophy} title={t('no_events_yet')} body={t('when_a_mentor_announces_one_it_appears_here_with')} />
      </div>
    )
  }

  const teams = state.teams.filter((t) => t.competitionId === competition.id).sort((a, b) => b.points - a.points)
  const myTeam = teams.find((t) => t.memberIds.includes(user.id))
  const tasks = state.competitionTasks.filter((t) => t.competitionId === competition.id)
  const board = leaderboard(state)
  const daysToGo = Math.max(0, Math.ceil((new Date(competition.startsAt).getTime() - Date.now()) / 86_400_000))

  return (
    <div className="animate-rise space-y-6">
      {state.competitions.length > 1 && (
        <div className="flex flex-wrap gap-2">
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
      )}

      <Card className="overflow-hidden">
        <div className="tint-accent specular relative p-6 sm:p-8">
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
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
                  {formatDate(competition.startsAt)}
                </span>
              </p>
            </div>
            <div className="rounded-[18px] fill-strong px-5 py-3 text-center ring-1 rim">
              <p className="text-[30px] leading-none font-bold text-ink-900 tabular-nums">{daysToGo}</p>
              <p className="mt-1 text-xs text-ink-500">{t('days_to_go')}</p>
            </div>
          </div>
          <p className="relative mt-5 max-w-3xl text-[15px] leading-relaxed text-ink-700">{competition.description}</p>
        </div>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'teams', label: t('teams'), icon: Users, count: teams.length },
          { id: 'tasks', label: t('tasks'), icon: Target, count: tasks.length },
          { id: 'schedule', label: t('schedule'), icon: CalendarClock },
          { id: 'leaderboard', label: t('leaderboard'), icon: Medal },
        ]}
      />

      {tab === 'teams' && teams.length === 0 && (
        <EmptyState
          icon={Users}
          title={t('no_teams_yet')}
          body={t('teams_appear_here_once_a_coach_creates_one_for_t')}
        />
      )}

      {tab === 'teams' && teams.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-3">
          {teams.map((team, i) => {
            const coach = state.users.find((u) => u.id === team.coachId)
            const mine = team.id === myTeam?.id
            return (
              <Card key={team.id} className={`flex flex-col p-5 ${mine ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-base font-bold text-ink-900">
                      {i === 0 && <Crown size={16} className="text-amber-500" aria-hidden="true" />}
                      {team.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500 italic">“{team.motto}”</p>
                  </div>
                  <Badge tone={i === 0 ? 'warning' : 'neutral'}>{team.points} pts</Badge>
                </div>

                <ul className="mt-4 flex-1 space-y-2">
                  {team.memberIds.map((id) => {
                    const member = state.users.find((u) => u.id === id)
                    if (!member) return null
                    return (
                      <li key={id} className="flex items-center gap-2.5">
                        <Avatar name={member.name} initials={member.avatar} size={26} />
                        <span className="truncate text-sm text-ink-700">{member.name}</span>
                        {member.id === user.id && <Badge tone="brand">{t('you')}</Badge>}
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-4 flex items-center justify-between gap-2 border-t edge pt-4">
                  <span className="flex min-w-0 items-center gap-2 text-xs text-ink-500">
                    <Flag size={13} aria-hidden="true" />
                    <span className="truncate">Coach: {coach?.name}</span>
                  </span>
                  {!mine && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        joinTeam(team.id)
                        toast({ title: t('joined_team', { team: team.name }), body: t('your_coach_has_been_notified'), tone: 'success' })
                      }}
                    >
                      {t('join_team')}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState icon={Target} title={t('no_competition_tasks_yet')} body={t('tasks_appear_here_once_your_coach_publishes_the_')} />
          ) : (
            tasks.map((task) => {
              const team = state.teams.find((t) => t.id === task.teamId)
              const mine = team?.memberIds.includes(user.id)
              return (
                <Card key={task.id} className="flex flex-wrap items-start gap-4 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-700 ring-1 ring-accent-200 ring-inset">
                    <Target size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-[14rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-ink-900">{task.title}</h3>
                      <Badge tone={TASK_TONE[task.status]}>{t(TASK_LABEL[task.status])}</Badge>
                      <Badge tone={task.difficulty === 'Hard' ? 'danger' : task.difficulty === 'Medium' ? 'warning' : 'success'}>{localizeDifficulty(task.difficulty)}</Badge>
                      {team && <Badge tone="neutral">{team.name}</Badge>}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{task.description}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock size={12} aria-hidden="true" />
                        {t('due_date', { date: formatDate(task.deadline) })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
                        <Zap size={12} aria-hidden="true" />
                        {t('n_pts', { n: task.points })}
                      </span>
                    </p>
                  </div>
                  {/* An open task has no team yet, so claiming it is what assigns one. */}
                  {myTeam && (task.status === 'open' || (mine && task.status !== 'scored')) && (
                    <Button
                      size="sm"
                      variant={task.status === 'open' ? 'primary' : 'secondary'}
                      onClick={() => {
                        const next = task.status === 'open' ? 'in_progress' : 'submitted'
                        setTaskStatus(task.id, next, myTeam.id)
                        toast({ title: next === 'in_progress' ? t('task_started') : t('task_submitted'), body: task.title, tone: 'success' })
                      }}
                    >
                      {task.status === 'open' ? t('start_task') : t('submit_for_scoring')}
                    </Button>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <Card className="p-5 sm:p-6">
          <SectionHeading title={t('running_order')} subtitle={t('date_range', { from: formatDate(competition.startsAt), to: formatDate(competition.endsAt) })} icon={CalendarClock} />
          {competition.schedule.length === 0 && <p className="mt-3 text-sm text-ink-500">{t('the_running_order_has_not_been_published_yet')}</p>}
          <ol className="relative space-y-4 border-l edge pl-6">
            {competition.schedule.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute top-1.5 -left-[1.9rem] h-3 w-3 rounded-full bg-accent-600 ring-4 ring-white" aria-hidden="true" />
                <p className="font-mono text-xs font-bold text-accent-700">
                  {t('day_n', { n: item.day })} · {item.time}
                </p>
                <p className="mt-0.5 text-sm font-bold text-ink-900">{item.title}</p>
                <p className="mt-0.5 text-sm text-ink-600">{item.detail}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {tab === 'leaderboard' && (
        <Card className="overflow-hidden">
          <div className="border-b edge px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
              <Medal size={17} className="text-amber-500" aria-hidden="true" />{t('academy_leaderboard')}</h2>
            <p className="mt-0.5 text-sm text-ink-500">{t('ranked_by_total_experience_across_every_course')}</p>
          </div>
          <ol className="divide-y divider">
            {board.map((entry, i) => (
              <li key={entry.user.id} className={`flex items-center gap-4 px-5 py-3.5 ${entry.user.id === user.id ? 'bg-brand-50/60' : ''}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold tabular-nums ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-ink-200 text-ink-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'fill text-ink-500'}`}>
                  {i + 1}
                </span>
                <Avatar name={entry.user.name} initials={entry.user.avatar} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink-900">{entry.user.name}</span>
                    {entry.user.id === user.id && <Badge tone="brand">{t('you')}</Badge>}
                  </span>
                  <span className="block text-xs text-ink-500">{localizeLevelName(entry.level.level.name)}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-ink-900 tabular-nums">{formatNumber(entry.profile?.xp ?? 0)}</span>
                  <span className="block text-[10px] font-semibold text-ink-500">{t('xp')}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
