/** Domain model for S7 Robotics Platform. UI never mutates these directly — see store.tsx. */

export type Role = 'student' | 'mentor'

/** Hardware platforms. Adding one here + an entry in PLATFORMS is all a new platform needs. */
export type PlatformId = 'arduino' | 'esp32' | 'pico' | 'wedo' | 'spike' | 'python'

export interface Platform {
  id: PlatformId
  name: string
  vendor: string
  language: string
  color: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  avatar: string
  groupId?: string
  title?: string
  joinedAt: string
  bio?: string
  city?: string
}

export interface StudentProfile {
  userId: string
  xp: number
  streak: number
  lastActiveDate: string
  enrolledCourseIds: string[]
  currentCourseId: string
  completedLessonIds: string[]
  completedChallengeIds: string[]
  unlockedAchievementIds: string[]
  goal: string
}

export interface Component {
  id: string
  name: string
  qty: number
  role: string
  description: string
  icon: 'board' | 'sensor' | 'led' | 'wire' | 'breadboard' | 'resistor' | 'motor' | 'battery'
}

export interface TheoryBlock {
  id: string
  title: string
  body: string
  callout?: { kind: 'info' | 'warning' | 'tip'; text: string }
  formula?: string
}

export interface WiringRow {
  from: string
  to: string
  color: string
  note: string
}

export interface Lesson {
  id: string
  moduleId: string
  courseId: string
  order: number
  title: string
  summary: string
  minutes: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  xp: number
  objectives: string[]
  theory: TheoryBlock[]
  components: Component[]
  wiring: { description: string; rows: WiringRow[] }
  /** `starter` is what the editor opens with; `source` is the worked reference. */
  code: { filename: string; source: string; starter?: string; explain: string[] }
  task: { title: string; brief: string; requirements: string[]; xp: number }
  challenge: { id: string; title: string; brief: string; hints: string[]; xp: number }
  /** Ids of checks from codecheck.ts the auto-checker runs for this lesson. */
  checks: string[]
  requiresProject: boolean
}

export interface Module {
  id: string
  courseId: string
  title: string
  summary: string
  order: number
}

export interface Course {
  id: string
  title: string
  tagline: string
  description: string
  platform: PlatformId
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  ageRange: string
  hours: number
  instructorId: string
  gradient: string
  accent: string
  tags: string[]
  outcomes: string[]
}

export type ProjectStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'needs_changes'

export interface Attachment {
  id: string
  kind: 'image' | 'video'
  name: string
  /** data-URL for uploads, remote/inline SVG for seeded demo data. */
  url: string
  size?: number
}

export interface Feedback {
  id: string
  projectId: string
  mentorId: string
  createdAt: string
  decision: 'approved' | 'needs_changes' | 'comment'
  message: string
  rubric?: { wiring: number; code: number; documentation: number }
}

export interface Project {
  id: string
  title: string
  authorId: string
  courseId: string
  lessonId: string
  description: string
  code: string
  notes: string
  attachments: Attachment[]
  status: ProjectStatus
  createdAt: string
  submittedAt?: string
  reviewedAt?: string
  reviewerId?: string
  feedback: Feedback[]
  likes: number
  views: number
  likedByMe?: boolean
  tags: string[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xp: number
  tier: 'bronze' | 'silver' | 'gold'
  hint: string
}

/** Text the app generates and stores is kept as a dictionary key plus its values, never as a
 *  finished sentence — otherwise it would be frozen in whatever language was active when it
 *  was written. `t()` falls back to the key itself, so text the user typed still renders. */
export type TextVars = Record<string, string | number>

export interface XPTransaction {
  id: string
  userId: string
  amount: number
  /** Dictionary key; see TextVars. */
  reason: string
  vars?: TextVars
  kind: 'lesson' | 'challenge' | 'submission' | 'approval' | 'achievement' | 'competition'
  createdAt: string
  refId?: string
}

export interface Group {
  id: string
  name: string
  mentorId: string
  schedule: string
  room: string
  studentIds: string[]
  courseId: string
}

export interface Team {
  id: string
  name: string
  coachId: string
  memberIds: string[]
  points: number
  competitionId: string
  motto: string
}

export interface CompetitionTask {
  id: string
  competitionId: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  points: number
  deadline: string
  status: 'open' | 'in_progress' | 'submitted' | 'scored'
  teamId?: string
}

export interface Competition {
  id: string
  name: string
  season: string
  location: string
  startsAt: string
  endsAt: string
  description: string
  schedule: { time: string; title: string; detail: string }[]
}

export interface Notification {
  id: string
  userId: string
  /** Dictionary keys; see TextVars. */
  title: string
  body: string
  vars?: TextVars
  createdAt: string
  read: boolean
  kind: 'review' | 'approval' | 'xp' | 'unlock' | 'achievement' | 'system'
  href?: string
}

export interface AppState {
  users: User[]
  profiles: StudentProfile[]
  courses: Course[]
  modules: Module[]
  lessons: Lesson[]
  projects: Project[]
  achievements: Achievement[]
  xp: XPTransaction[]
  groups: Group[]
  teams: Team[]
  competitions: Competition[]
  competitionTasks: CompetitionTask[]
  notifications: Notification[]
  sessionUserId: string | null
}
