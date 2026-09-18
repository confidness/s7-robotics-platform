import type { AppState, Competition, CompetitionTask } from './types'
import { ACHIEVEMENTS } from './gamification'
import { COURSES, LESSONS, MODULES } from './curriculum'

/**
 * The platform ships with curriculum, not with people.
 *
 * Courses, modules, lessons, achievements and the season calendar are content — they are the
 * product. Students, mentors, groups, teams and projects are created by whoever actually uses
 * the app, so nothing here invents a person who does not exist.
 */

const DAY = 86_400_000
const inDays = (days: number, hour = 9) => {
  const d = new Date(Date.now() + days * DAY)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const COMPETITIONS: Competition[] = [
  {
    id: 'c-1',
    name: 'S7 Regional Robotics Cup',
    season: 'Spring 2026',
    location: 'Almaty Innovation Centre',
    startsAt: inDays(24, 9),
    endsAt: inDays(25, 18),
    description:
      'Two days of mission rounds, a design defence in front of judges and a head-to-head final. Teams of three to five with one coach. Each team presents an engineering notebook alongside their robot.',
    schedule: [
      { time: '09:00', title: 'Check-in & pit setup', detail: 'Teams claim a pit table and pass the size inspection.' },
      { time: '10:30', title: 'Practice rounds', detail: 'Two timed practice runs on the official mat.' },
      { time: '13:00', title: 'Qualification rounds 1–3', detail: 'Best score of three counts.' },
      { time: '15:30', title: 'Design defence', detail: 'Ten minutes with the judging panel, notebook required.' },
      { time: '10:00', title: 'Day 2 — Finals', detail: 'Top eight teams, single elimination.' },
    ],
  },
]

/** Season tasks belong to the competition, not to any invented team. Teams claim them in-app. */
export const COMPETITION_TASKS: CompetitionTask[] = [
  { id: 'ct-1', competitionId: 'c-1', title: 'Mission M04 — Crane lift', description: 'Lift the cargo crate to the upper platform without touching the frame. The attachment must be swappable in under 10 seconds.', difficulty: 'Hard', points: 120, deadline: inDays(18, 18), status: 'open' },
  { id: 'ct-2', competitionId: 'c-1', title: 'Mission M08 — Lever switch', description: 'Flip both levers on the centre module in a single run and return to base.', difficulty: 'Medium', points: 75, deadline: inDays(15, 18), status: 'open' },
  { id: 'ct-3', competitionId: 'c-1', title: 'Engineering notebook — round 1', description: 'Submit the first notebook draft: problem statement, three design iterations and test data.', difficulty: 'Medium', points: 60, deadline: inDays(21, 18), status: 'open' },
  { id: 'ct-4', competitionId: 'c-1', title: 'Reliability benchmark', description: 'Prove 8 successful runs out of 10 on your primary routine, logged and signed by a mentor.', difficulty: 'Hard', points: 100, deadline: inDays(11, 18), status: 'open' },
  { id: 'ct-5', competitionId: 'c-1', title: 'Pit presentation rehearsal', description: 'A two minute design defence, recorded and reviewed by the coach.', difficulty: 'Easy', points: 40, deadline: inDays(22, 18), status: 'open' },
]

export function createInitialState(): AppState {
  return {
    users: [],
    profiles: [],
    courses: COURSES,
    modules: MODULES,
    lessons: LESSONS,
    projects: [],
    achievements: ACHIEVEMENTS,
    xp: [],
    groups: [],
    teams: [],
    competitions: COMPETITIONS,
    competitionTasks: COMPETITION_TASKS,
    notifications: [],
    sessionUserId: null,
  }
}
