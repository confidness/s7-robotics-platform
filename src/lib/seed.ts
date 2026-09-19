import type { AppState } from './types'
import { ACHIEVEMENTS } from './gamification'
import { COURSES, LESSONS, MODULES } from './curriculum'

/**
 * The platform ships with curriculum, not with people or events.
 *
 * Courses, modules, lessons and achievements are content — they are the product. Students,
 * mentors, groups, teams, projects and competitions are created by whoever actually uses the
 * app, so nothing here invents a person, a team or a cup that does not exist.
 */
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
    competitions: [],
    competitionTasks: [],
    notifications: [],
    customLessons: [],
    lessonSubmissions: [],
    sessionUserId: null,
  }
}
