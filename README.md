# S7 Robotics Platform

One system for teaching robotics: courses, interactive lessons, project submission, mentor
review, progress, gamification, an AI mentor and competitions.

## First run

The platform ships with curriculum, not with people. There are no seeded accounts, no sample
students and no fake projects — the first person to open it registers the first account.

| Role | How you get it |
| --- | --- |
| Student | Register with name, email and password. You start on Arduino lesson one. |
| Mentor | Register and pick **Mentor** — the form then asks for the mentor PIN. |

The PIN comes from `VITE_MENTOR_PIN`, falling back to `4821` locally. Set your own in Vercel.

It is worth being plain about what that PIN is: Vite inlines every `VITE_*` variable into the
client bundle at build time, so the value ends up readable in devtools no matter where it is
configured. The PIN stops a curious student, not a determined one. Together with passwords held
in `localStorage`, this is a local-first prototype — gating that actually holds needs a server
to check it.

## The loop

1. **Dashboard** → *Continue lesson*.
2. Work through **Theory → Components → Wiring → Code → Task → Challenge**.
   In *Code*, **Run auto code check** grades the sketch against the lesson's rules; **Example**
   loads the worked version. Lessons with an ultrasonic sensor also get a *Virtual Lab*.
3. **Submit project** — the form opens with whatever is in the editor.
4. A mentor opens it from **Reviews**, which claims it (*Under review*), scores the rubric and
   writes feedback.
5. **Approve** pays the task XP plus a bonus, completes the lesson, unlocks the next one and
   notifies the student. **Request changes** sends it back instead.

## Languages

Kazakh, Russian and English, switchable from the header at any moment — nothing reloads and
nothing is lost. Both the interface and the curriculum translate: lesson theory, components,
wiring notes, tasks, challenges, achievements, the competition season and the AI mentor's
answers. Code listings stay in English, because Arduino and Python are written in English.

Dates and numbers follow the interface language rather than the operating system. Chrome
resolves `kk-KZ` but ships no Kazakh month or weekday names, so those are assembled in
`i18n/index.tsx` instead of being handed to `Intl`.

Text the app generates and stores — notifications, XP history, a new student's goal — is kept
as a dictionary key plus the ids it refers to, never as a finished sentence. A notification
written in Kazakh therefore reads in Russian the moment the language changes, instead of being
frozen in whatever language was active when it was written.

## Mentor-authored lessons

Beside the curriculum that ships in the code, a mentor can write their own: a PDF or Word file
of material, and up to ten questions of three kinds — multiple choice, write code, or a written
answer. The mentor sets how many and what each is worth.

These live beside the shipped courses rather than inside them, so one mentor's material never
renumbers another's course or disturbs the unlock chain. Students find them under **Mentor
assignments**.

Multiple-choice questions mark themselves, so a lesson made only of them settles the moment it
is handed in and pays out on the spot. Anything written by hand cannot be marked by a machine,
so it goes to the mentor and travels the same review loop projects do.

## Groups

A mentor's timetable: a named class with a room, a slot, a course and a roster drawn from the
registered students. A student sits in one group at a time, so adding them to a second removes
them from the first. Deleting a group never removes its students — they stay in the academy,
just ungrouped, and the mentor's roster still shows everyone.

## Competitions

Nothing is seeded. A mentor announces an event from inside the app — name, place, start and end
date and time, and a running order of slots each with its own day and clock time. Announcing
notifies every student once; editing afterwards does not nag them again.

Teams are created by the mentor and filled from the registered students, one team per student
per event. Points are only ever earned: a team claims a task, submits it, and the mentor scores
it. Un-scoring or deleting a scored task hands the points back, so a mistake is reversible and
nothing on the leaderboard was typed in by hand.

## Themes

The material is matte: panels are a near-uniform fill over a heavily blurred backdrop, with no
specular rim, no white inset lip and only a touch of added saturation. What reads as gloss is a
falling gradient plus a bright top edge, and neither is there.

Light, dark, or follow the system — the switch sits in the header (and in the account menu on
phones). The choice is stored per browser and applied before first paint, so there is no flash.
Every colour is a token in `src/index.css`: `[data-theme='dark']` swaps the ink ramp, thins the
glass and retints the pale surfaces. Components never hardcode a literal white.

The palette is white, the logo's blue and a deep green: `brand` is the blue ramp built around
the mark's own `#1560ec`, `accent` is the green that ends every gradient, and the five courses
sit at five points along the run between them. Amber, rose and emerald survive only as status —
a warning has to look like a warning — and never as decoration.

## Architecture

```
src/
  lib/
    types.ts        every entity: User, Course, Module, Lesson, Project, Feedback,
                    Achievement, XPTransaction, Group, Team, Competition, Notification,
                    CustomLesson, CustomTask, LessonSubmission
    curriculum.ts   5 courses, 12 modules, 18 lessons, hardware platform registry
    seed.ts         the content a fresh install ships with — courses and the season, no people
    logic.ts        ALL business rules as pure functions (state) => state
    selectors.ts    derived reads: progress, unlock chain, review queue, leaderboard
    gamification.ts levels, XP rules, achievement predicates
    codecheck.ts    static Arduino/Python checker behind Lesson.checks
    ai.ts           AI mentor reply layer — one function to swap for a real model
    theme.ts        light / dark / system, persisted per browser
    store.tsx       React context: session, persistence, toasts. Thin — it calls logic.ts
  i18n/
    index.tsx       t(), LocaleProvider, locale-aware date and number formatting
    ui.ts           ~650 interface strings, each { en, ru, kk }
    content.ts      merges a translation pack over the English canonical curriculum
    content.ru.ts   courses, modules, parts, wiring terminals, competitions
    content.kk.ts   the same, in Kazakh
    lessons.ru.ts   all 18 lessons — theory, components, wiring, task, challenge
    lessons.kk.ts   the same, in Kazakh
    ai.ru.ts        AI mentor answers; ai.kk.ts is its Kazakh twin
  components/       design system (ui.tsx), layout chrome, code editor, lesson parts, cards
    Mark.tsx        the S7 mark, drawn as two arcs so it stays crisp at 20px
  pages/            student/* and mentor/* screens, one file per screen
```

English lives in `lib/curriculum.ts` and stays the source of truth: ids, order, code samples
and check rules never move. A pack only replaces the words a learner reads, so adding a
language is one more file per pack and a row in `LOCALES` — no screen changes.

**Business logic never lives in a component.** Every state change goes through a pure function
in `logic.ts`, so the progress chain is one readable path:

```
lesson task → project submitted → mentor approves
  → XP awarded → lesson completed → next lesson unlocked → notification → achievements re-evaluated
```

### Data layer

There is no backend yet. State lives in one object persisted to `localStorage`, with course
content always re-read from code so editing the curriculum never strands a returning user.
Moving to an API means rewriting the bodies of `store.tsx`'s actions to call endpoints;
`logic.ts` becomes the server's rules and no screen changes.

Two consequences worth knowing before a demo: accounts are per browser, and passwords are
stored in plain text in that browser. This is a local-first prototype, not an auth system.

### Hardware platforms

`PLATFORMS` in `curriculum.ts` carries Arduino, ESP32, Raspberry Pi Pico, LEGO WeDo 2.0,
LEGO SPIKE Prime and plain Python. Adding one is a row in that array plus a `PlatformId`
member; catalog filters, gallery filters and course cards pick it up with no further changes.

### AI mentor

`askMentor(question, context)` in `ai.ts` is the only thing the UI knows about. A local
knowledge base answers it today with hints, explanations, a guiding question and small code
fragments — and it refuses to write the student's project. Pointing it at a real model is
replacing that function body with a `fetch`; the signature and the UI stay as they are.

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel. The framework preset is **Vite**; `vercel.json` already routes every
   path back to `index.html` so deep links like `/learn/arduino/ar-l4` work.
3. Add the environment variable `VITE_MENTOR_PIN` (Production and Preview).
4. Deploy. Build command `npm run build`, output `dist`.

## Stack

React 18, TypeScript, Vite, Tailwind CSS v4, React Router, lucide-react. No state library, no
chart library, no syntax-highlighting library — the charts are hand-drawn SVG and the editor is
a textarea with a highlighted overlay, which keeps the bundle around 150 kB gzipped.
