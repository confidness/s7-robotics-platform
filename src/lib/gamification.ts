import type { AppState, Achievement } from './types'

export interface Level {
  index: number
  name: string
  minXp: number
  blurb: string
}

export const LEVELS: Level[] = [
  { index: 1, name: 'Beginner', minXp: 0, blurb: 'Learning the building blocks' },
  { index: 2, name: 'Builder', minXp: 400, blurb: 'Assembling working circuits' },
  { index: 3, name: 'Engineer', minXp: 1000, blurb: 'Designing systems with sensors' },
  { index: 4, name: 'Robotics Specialist', minXp: 2000, blurb: 'Autonomous behaviour & control' },
  { index: 5, name: 'Competition Engineer', minXp: 3500, blurb: 'Competing at national level' },
]

export function levelFor(xp: number) {
  const current = [...LEVELS].reverse().find((l) => xp >= l.minXp) ?? LEVELS[0]
  const next = LEVELS[current.index] // LEVELS is 1-indexed by `index`
  const span = next ? next.minXp - current.minXp : 1
  const gained = xp - current.minXp
  return {
    level: current,
    next,
    xpIntoLevel: gained,
    xpForLevel: span,
    xpToNext: next ? next.minXp - xp : 0,
    percent: next ? Math.min(100, Math.round((gained / span) * 100)) : 100,
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-robot', name: 'First Robot', description: 'Completed your very first lesson', icon: 'Bot', xp: 50, tier: 'bronze', hint: 'Finish any lesson' },
  { id: 'first-project', name: 'First Project', description: 'Submitted your first project for review', icon: 'Rocket', xp: 75, tier: 'bronze', hint: 'Submit a project' },
  { id: 'sensor-master', name: 'Sensor Master', description: 'Completed three lessons that use sensors', icon: 'Radar', xp: 150, tier: 'silver', hint: 'Complete 3 sensor lessons' },
  { id: 'code-explorer', name: 'Code Explorer', description: 'Passed the automatic code check', icon: 'Code2', xp: 100, tier: 'bronze', hint: 'Pass Auto Code Check in the editor' },
  { id: 'streak-7', name: '7 Day Streak', description: 'Practised robotics 7 days in a row', icon: 'Flame', xp: 120, tier: 'silver', hint: 'Keep a 7 day streak' },
  { id: 'approved-builder', name: 'Approved Builder', description: 'A mentor approved one of your projects', icon: 'BadgeCheck', xp: 150, tier: 'silver', hint: 'Get a project approved' },
  { id: 'challenge-hunter', name: 'Challenge Hunter', description: 'Completed three lesson challenges', icon: 'Target', xp: 130, tier: 'silver', hint: 'Complete 3 challenges' },
  { id: 'module-master', name: 'Module Master', description: 'Finished every lesson in a module', icon: 'Layers', xp: 200, tier: 'gold', hint: 'Complete a full module' },
  { id: 'competition-ready', name: 'Competition Ready', description: 'Joined a team and reached Engineer level', icon: 'Trophy', xp: 250, tier: 'gold', hint: 'Join a team and reach Engineer' },
  { id: 'mentor-favourite', name: 'Mentor Favourite', description: 'Collected three mentor reviews', icon: 'MessageSquareHeart', xp: 120, tier: 'silver', hint: 'Receive 3 mentor reviews' },
]

const SENSOR_TAG = 'sensor'

/** Pure: returns achievement ids the user now qualifies for but has not unlocked yet. */
export function evaluateAchievements(state: AppState, userId: string): string[] {
  const profile = state.profiles.find((p) => p.userId === userId)
  if (!profile) return []
  const owned = new Set(profile.unlockedAchievementIds)
  const lessons = state.lessons.filter((l) => profile.completedLessonIds.includes(l.id))
  const projects = state.projects.filter((p) => p.authorId === userId)
  const reviews = projects.flatMap((p) => p.feedback)
  const sensorLessons = lessons.filter((l) => l.objectives.join(' ').toLowerCase().includes(SENSOR_TAG) || l.title.toLowerCase().includes(SENSOR_TAG))
  const xp = profile.xp
  const inTeam = state.teams.some((t) => t.memberIds.includes(userId))

  const moduleDone = state.modules.some((m) => {
    const ids = state.lessons.filter((l) => l.moduleId === m.id).map((l) => l.id)
    return ids.length > 0 && ids.every((id) => profile.completedLessonIds.includes(id))
  })

  const rules: Record<string, boolean> = {
    'first-robot': lessons.length >= 1,
    'first-project': projects.some((p) => p.status !== 'draft'),
    'sensor-master': sensorLessons.length >= 3,
    'streak-7': profile.streak >= 7,
    'approved-builder': projects.some((p) => p.status === 'approved'),
    'challenge-hunter': profile.completedChallengeIds.length >= 3,
    'module-master': moduleDone,
    'competition-ready': inTeam && xp >= 1000,
    'mentor-favourite': reviews.length >= 3,
  }

  return Object.entries(rules)
    .filter(([id, ok]) => ok && !owned.has(id))
    .map(([id]) => id)
}

export const XP_RULES = {
  lesson: 'Lesson completed',
  challenge: 'Challenge completed',
  submission: 'Project submitted',
  approval: 'Project approved by mentor',
  achievement: 'Achievement unlocked',
  competition: 'Competition task scored',
} as const
