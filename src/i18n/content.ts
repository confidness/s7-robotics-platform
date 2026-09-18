import type { Achievement, Competition, CompetitionTask, Course, Lesson, Module } from '../lib/types'
import { getLocale } from './index'
import { RU } from './content.ru'
import { KK } from './content.kk'

/**
 * Курс мазмұнының аудармасы / переводы учебного контента.
 *
 * English lives in `lib/curriculum.ts` and stays the source of truth: ids, order, code samples
 * and check rules never move. A pack only replaces the words a learner reads.
 * Code listings themselves are deliberately not translated — Arduino is written in English.
 */

export interface LessonPack {
  title?: string
  summary?: string
  objectives?: string[]
  theory?: Record<string, { title?: string; body?: string; callout?: string; formula?: string }>
  components?: Record<string, { name?: string; role?: string; description?: string }>
  wiring?: { description?: string; notes?: string[] }
  explain?: string[]
  task?: { title?: string; brief?: string; requirements?: string[] }
  challenge?: { title?: string; brief?: string; hints?: string[] }
}

export interface ContentPack {
  courses: Record<string, { title?: string; tagline?: string; description?: string; ageRange?: string; outcomes?: string[]; tags?: string[] }>
  modules: Record<string, { title?: string; summary?: string }>
  lessons: Record<string, LessonPack>
  achievements: Record<string, { name?: string; description?: string; hint?: string }>
  levels: Record<string, { name?: string; blurb?: string }>
  difficulty: Record<string, string>
  /** Component names shared by many lessons, keyed by component id. */
  parts: Record<string, { name?: string; role?: string; description?: string }>
  /** Wiring terminals and wire colours shared by every lesson, looked up by their English text.
   *  Pure identifiers (`Arduino D6 (~)`, `Port A`) need no entry — they pass through unchanged. */
  terminals: Record<string, string>
  wireColors: Record<string, string>
  competitions: Record<string, { name?: string; season?: string; location?: string; description?: string; schedule?: { title?: string; detail?: string }[] }>
  competitionTasks: Record<string, { title?: string; description?: string }>
}

const PACKS: Record<string, ContentPack | undefined> = { ru: RU, kk: KK, en: undefined }

const pack = () => PACKS[getLocale()]

export function localizeCourse(course: Course): Course {
  const p = pack()?.courses[course.id]
  return p ? { ...course, ...p } : course
}

export function localizeModule(module: Module): Module {
  const p = pack()?.modules[module.id]
  return p ? { ...module, ...p } : module
}

export function localizeAchievement(achievement: Achievement): Achievement {
  const p = pack()?.achievements[achievement.id]
  return p ? { ...achievement, ...p } : achievement
}

/** Level names come from gamification.ts and are matched by their English name. */
export function localizeLevelName(name: string): string {
  return pack()?.levels[name]?.name ?? name
}

export function localizeLevelBlurb(name: string, blurb: string): string {
  return pack()?.levels[name]?.blurb ?? blurb
}

export function localizeDifficulty(value: string): string {
  return pack()?.difficulty[value] ?? value
}

export function localizeCompetition(competition: Competition): Competition {
  const p = pack()?.competitions[competition.id]
  if (!p) return competition
  // Times are clock strings on the day — only the titles and details are words.
  const schedule = p.schedule ? competition.schedule.map((row, i) => ({ ...row, ...p.schedule![i] })) : competition.schedule
  return { ...competition, ...p, schedule }
}

export function localizeCompetitionTask(task: CompetitionTask): CompetitionTask {
  const p = pack()?.competitionTasks[task.id]
  return p ? { ...task, ...p } : task
}

export function localizeLesson(lesson: Lesson): Lesson {
  const current = pack()
  if (!current) return lesson
  const p = current.lessons[lesson.id]
  if (!p) return lesson

  return {
    ...lesson,
    title: p.title ?? lesson.title,
    summary: p.summary ?? lesson.summary,
    objectives: p.objectives ?? lesson.objectives,
    theory: lesson.theory.map((block) => {
      const tb = p.theory?.[block.id]
      if (!tb) return block
      return {
        ...block,
        title: tb.title ?? block.title,
        body: tb.body ?? block.body,
        formula: tb.formula ?? block.formula,
        callout: block.callout && tb.callout ? { ...block.callout, text: tb.callout } : block.callout,
      }
    }),
    components: lesson.components.map((component) => {
      const cp = p.components?.[component.id] ?? current.parts[component.id]
      return cp ? { ...component, ...cp } : component
    }),
    wiring: {
      description: p.wiring?.description ?? lesson.wiring.description,
      rows: lesson.wiring.rows.map((row, i) => ({
        ...row,
        from: current.terminals[row.from] ?? row.from,
        to: current.terminals[row.to] ?? row.to,
        color: current.wireColors[row.color] ?? row.color,
        note: p.wiring?.notes?.[i] ?? row.note,
      })),
    },
    code: { ...lesson.code, explain: p.explain ?? lesson.code.explain },
    task: {
      ...lesson.task,
      title: p.task?.title ?? lesson.task.title,
      brief: p.task?.brief ?? lesson.task.brief,
      requirements: p.task?.requirements ?? lesson.task.requirements,
    },
    challenge: {
      ...lesson.challenge,
      title: p.challenge?.title ?? lesson.challenge.title,
      brief: p.challenge?.brief ?? lesson.challenge.brief,
      hints: p.challenge?.hints ?? lesson.challenge.hints,
    },
  }
}
