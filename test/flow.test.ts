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
import { parseReply } from '../api/mentor'
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

// --- mentor-authored lessons ----------------------------------------------------------------------------
const MAX = 10
const overLong = {
  id: 'cl-1',
  authorId: mentor.id,
  title: 'Soldering safety',
  summary: 'How to hold the iron.',
  tasks: Array.from({ length: MAX + 3 }, (_, i) => ({ id: `t${i}`, kind: 'open' as const, prompt: `Q${i}`, points: 5 })),
  published: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
let ls = logic.saveCustomLesson(returned, overLong)
assert.equal(ls.customLessons[0].tasks.length, MAX, 'a lesson is capped at ten questions')

// A quiz-only lesson settles itself; anything hand-written waits for the mentor.
const quizOnly = {
  ...overLong,
  id: 'cl-2',
  published: true,
  tasks: [
    { id: 'q1', kind: 'quiz' as const, prompt: '180 or 320?', points: 10, options: ['180', '320'], answerIndex: 1 },
    { id: 'q2', kind: 'quiz' as const, prompt: 'Flux?', points: 10, options: ['yes', 'no'], answerIndex: 0 },
  ],
}
ls = logic.saveCustomLesson(ls, quizOnly)
const xpBeforeQuiz = profileOf(ls, STUDENT)!.xp
ls = logic.submitLessonAnswers(ls, STUDENT, 'cl-2', [
  { taskId: 'q1', value: '1' },
  { taskId: 'q2', value: '1' },
])
const auto = ls.lessonSubmissions.find((s) => s.lessonId === 'cl-2')!
assert.equal(auto.status, 'reviewed', 'a quiz-only lesson marks itself')
assert.equal(auto.quizScore, 1)
assert.equal(auto.awardedXp, 10, 'half right pays half the points')
assert.equal(profileOf(ls, STUDENT)!.xp, xpBeforeQuiz + 10)

// The same lesson cannot be handed in twice.
const twice = logic.submitLessonAnswers(ls, STUDENT, 'cl-2', [{ taskId: 'q1', value: '1' }])
assert.equal(twice.lessonSubmissions.filter((s) => s.lessonId === 'cl-2').length, 1)

// A written answer goes to the mentor, and the award is capped at the lesson's points.
const mixed = { ...overLong, id: 'cl-3', published: true, tasks: [{ id: 'w1', kind: 'open' as const, prompt: 'Why?', points: 20 }] }
ls = logic.saveCustomLesson(ls, mixed)
ls = logic.submitLessonAnswers(ls, STUDENT, 'cl-3', [{ taskId: 'w1', value: 'Because of the fumes.' }])
const waiting = ls.lessonSubmissions.find((s) => s.lessonId === 'cl-3')!
assert.equal(waiting.status, 'submitted', 'written answers wait for a person')
const xpBeforeReview = profileOf(ls, STUDENT)!.xp
ls = logic.reviewLessonSubmission(ls, waiting.id, mentor.id, 'Good reasoning.', 999)
const reviewed = ls.lessonSubmissions.find((s) => s.id === waiting.id)!
assert.equal(reviewed.status, 'reviewed')
assert.equal(reviewed.awardedXp, 20, 'the award cannot exceed what the lesson is worth')
assert.equal(profileOf(ls, STUDENT)!.xp, xpBeforeReview + 20)

// Deleting a lesson takes its submissions with it.
ls = logic.deleteCustomLesson(ls, 'cl-3')
assert.ok(!ls.customLessons.some((l) => l.id === 'cl-3'))
assert.ok(!ls.lessonSubmissions.some((s) => s.lessonId === 'cl-3'), 'answers do not outlive their lesson')

// --- XP is paid once per thing ------------------------------------------------------------------------
// Reported from the outside: a project sent back for changes and resubmitted paid its submission
// XP again. The guard now lives in awardXp, so every path is covered, not just this one.
{
  const start = logic.upsertProject(returned, STUDENT, { title: 'Farm', description: 'x', code: 'void loop() {}', notes: '', attachments: [], courseId: 'arduino', lessonId: 'ar-l4' }, 'submitted')
  const paidOnce = profileOf(start.state, STUDENT)!.xp
  const bounced = logic.reviewProject(start.state, mentor, start.project.id, 'needs_changes', 'Add the timeout.')
  const again = logic.upsertProject(bounced, STUDENT, { id: start.project.id, title: 'Farm', description: 'x', code: 'void loop() {}', notes: '', attachments: [], courseId: 'arduino', lessonId: 'ar-l4' }, 'submitted').state
  // Total XP may legitimately move — an achievement can become eligible — so the assertion is
  // about the submission award itself, which is what was being farmed.
  const paidFor = (s: typeof again) => s.xp.filter((t) => t.kind === 'submission' && t.refId === start.project.id)
  assert.equal(paidFor(again).length, 1, 'resubmitting does not pay the submission XP again')
  assert.equal(
    paidFor(again).reduce((n, t) => n + t.amount, 0),
    paidFor(start.state).reduce((n, t) => n + t.amount, 0),
    'the submission is worth the same after a resubmit as before',
  )
  void paidOnce

  // The same guard, asked directly and from a different angle.
  const twice = logic.awardXp(again, STUDENT, 500, 'xp_lesson_completed', 'lesson', 'ar-l1')
  assert.equal(profileOf(twice, STUDENT)!.xp, profileOf(again, STUDENT)!.xp, 'a lesson already paid cannot pay again')

  // An award with nothing to identify it still goes through — there is nothing to deduplicate.
  const anon = logic.awardXp(again, STUDENT, 5, 'xp_lesson_completed', 'lesson')
  assert.equal(profileOf(anon, STUDENT)!.xp, profileOf(again, STUDENT)!.xp + 5)
}

// --- the model reply parser -------------------------------------------------------------------------
// The one fragile seam in the AI path: a model that wraps its JSON, or drops a field, must not
// cost the student an answer — and junk must fall through to the offline base rather than render.
const clean = parseReply('{"text":"Check the ground wire.","question":"Is it unbroken?","followUps":["Why ground?"],"code":null}')
assert.equal(clean?.text, 'Check the ground wire.')
assert.equal(clean?.followUps.length, 1)
assert.equal(clean?.code, undefined)

const NL = String.fromCharCode(10)
const fenced = parseReply(['Here you go:', '```json', '{"text":"Use millis().","question":"Why?","followUps":[]}', '```'].join(NL))
assert.equal(fenced?.text, 'Use millis().', 'a fenced or prefaced reply is still read')

const partial = parseReply('{"text":"Only this."}')
assert.equal(partial?.question, '', 'a missing question does not throw')
assert.equal(partial?.followUps.length, 0)

assert.equal(parseReply('sorry, I cannot do that'), null, 'prose with no JSON falls back')
assert.equal(parseReply('{"question":"no text"}'), null, 'an answer with no text falls back')
assert.equal(parseReply('{"text":"x","code":{"source":"   "}}')?.code, undefined, 'a blank snippet is dropped')

console.log('✓ empty install, registration, progress chain, code check, levels, mentor lessons and the model parser all behave')
