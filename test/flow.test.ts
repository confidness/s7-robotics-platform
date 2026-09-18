/**
 * One runnable check over the chain the whole product hangs on:
 * register → submit → review → approve → XP → lesson complete → next lesson unlocked.
 *
 * It starts from an empty platform, exactly like a fresh deployment.
 *
 *   npm run check
 */

/** Three lines instead of @types/node — this file is a check, not a test suite. */
const assert = {
  ok(value: unknown, message = 'expected a truthy value') {
    if (!value) throw new Error(`FAILED: ${message}`)
  },
  equal<T>(actual: T, expected: T, message = 'values differ') {
    if (actual !== expected) throw new Error(`FAILED: ${message} — got ${String(actual)}, expected ${String(expected)}`)
  },
}

import { createInitialState } from '../src/lib/seed'
import * as logic from '../src/lib/logic'
import { currentLesson, isLessonUnlocked, mentorStats, profileOf } from '../src/lib/selectors'
import { levelFor } from '../src/lib/gamification'
import { runChecks } from '../src/lib/codecheck'

let state = createInitialState()

// --- a fresh deployment ships content, not people -------------------------------------------
assert.equal(state.users.length, 0, 'no seeded accounts')
assert.equal(state.projects.length, 0, 'no seeded projects')
assert.ok(state.courses.length >= 5, 'courses ship with the product')
assert.ok(state.lessons.length >= 15, 'lessons ship with the product')

// --- registration ----------------------------------------------------------------------------
const studentResult = logic.registerUser(state, { name: 'Aisha Kim', email: 'aisha@school.kz', password: 'secret123', role: 'student' })
assert.ok(studentResult.user, 'student registers')
state = studentResult.state
const STUDENT = studentResult.user!.id

const mentorResult = logic.registerUser(state, { name: 'Ruslan Orazov', email: 'ruslan@school.kz', password: 'secret123', role: 'mentor' })
assert.ok(mentorResult.user, 'mentor registers')
state = mentorResult.state
const mentor = mentorResult.user!

assert.ok(logic.registerUser(state, { name: 'Twin', email: 'AISHA@school.kz', password: 'secret123', role: 'student' }).error, 'duplicate email is rejected')

// a mentor with no groups still sees the whole roster
assert.equal(mentorStats(state, mentor.id).total, 1, 'mentor sees every student without needing groups')

// --- the new student starts at lesson one ------------------------------------------------------
const lesson = currentLesson(state, STUDENT, 'arduino')!
assert.equal(lesson.id, 'ar-l1', 'a new student starts at the first Arduino lesson')
assert.equal(isLessonUnlocked(state, STUDENT, 'ar-l2'), false, 'the second lesson starts locked')

// --- the auto checker separates a stub from a finished sketch ------------------------------------
const ultrasonic = state.lessons.find((l) => l.id === 'ar-l4')!
assert.ok(runChecks(ultrasonic.code.starter!, ultrasonic.checks).failed.length > 0, 'starter code should fail checks')
const full = runChecks(ultrasonic.code.source, ultrasonic.checks)
assert.equal(full.failed.length, 0, 'the worked example passes every check')
assert.equal(full.score, 100)

// --- submit --------------------------------------------------------------------------------------
const xpBefore = profileOf(state, STUDENT)!.xp
const submitted = logic.upsertProject(
  state,
  STUDENT,
  { title: 'Blinking LED', description: 'The LED blinks once a second and the state prints to Serial.', code: lesson.code.source, notes: '', attachments: [], courseId: 'arduino', lessonId: lesson.id },
  'submitted',
)
state = submitted.state
const projectId = submitted.project.id

assert.equal(submitted.project.status, 'submitted')
// submitting pays the submission XP and trips the "First Project" achievement on top
assert.ok(profileOf(state, STUDENT)!.xp >= xpBefore + logic.SUBMIT_XP, 'submitting awards the submission XP')
assert.ok(profileOf(state, STUDENT)!.unlockedAchievementIds.includes('first-project'), 'first submission unlocks First Project')
assert.ok(state.notifications.some((n) => n.userId === mentor.id && n.kind === 'review'), 'the mentor is notified')

// --- opening the submission claims it ---------------------------------------------------------------
state = logic.startReview(state, mentor.id, projectId)
assert.equal(state.projects.find((p) => p.id === projectId)!.status, 'under_review')

// --- approve: the whole chain fires ------------------------------------------------------------------
state = logic.reviewProject(state, mentor, projectId, 'approved', 'Clean wiring and the Serial output makes the state obvious.', { wiring: 5, code: 5, documentation: 4 })

const project = state.projects.find((p) => p.id === projectId)!
const profile = profileOf(state, STUDENT)!

assert.equal(project.status, 'approved')
assert.equal(project.feedback.length, 1, 'feedback is stored with the project')
assert.ok(profile.completedLessonIds.includes(lesson.id), 'approval completes the lesson')
assert.equal(isLessonUnlocked(state, STUDENT, 'ar-l2'), true, 'the next lesson unlocks')
assert.ok(
  profile.xp >= xpBefore + logic.SUBMIT_XP + logic.APPROVAL_BONUS + lesson.task.xp + lesson.xp,
  'approval pays the bonus, the task XP and the lesson XP',
)
assert.ok(state.notifications.some((n) => n.userId === STUDENT && n.kind === 'approval'))
assert.ok(state.notifications.some((n) => n.userId === STUDENT && n.kind === 'unlock'))

// --- returning work instead of approving ----------------------------------------------------------------
const retry = logic.upsertProject(state, STUDENT, { title: 'Retry', description: 'x', code: 'void loop() {}', notes: '', attachments: [], courseId: 'arduino', lessonId: 'ar-l2' }, 'submitted')
const returned = logic.reviewProject(retry.state, mentor, retry.project.id, 'needs_changes', 'Add the fade and resubmit.')
assert.equal(returned.projects.find((p) => p.id === retry.project.id)!.status, 'needs_changes')
assert.ok(!profileOf(returned, STUDENT)!.completedLessonIds.includes('ar-l2'), 'a returned project must not complete the lesson')

// --- levels ---------------------------------------------------------------------------------------------
assert.equal(levelFor(0).level.name, 'Beginner')
assert.equal(levelFor(760).level.name, 'Builder')
assert.equal(levelFor(1200).level.name, 'Engineer')
assert.equal(levelFor(99_999).level.name, 'Competition Engineer')
assert.equal(levelFor(400).xpToNext, 600)

console.log('✓ empty install, registration, progress chain, code check and levels all behave')
