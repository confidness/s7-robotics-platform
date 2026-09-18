import { getLocale } from './index'
import { AI_RU } from './ai.ru'
import { AI_KK } from './ai.kk'

/**
 * Translatable half of an AI mentor answer. Code listings stay in the entry itself —
 * Arduino and Python are written in English everywhere, so only the caption is translated.
 */
export interface AiEntryText {
  text: string
  caption?: string
  question: string
  followUps: string[]
}

export type AiPack = Record<string, AiEntryText>

const PACKS: Partial<Record<string, AiPack>> = { ru: AI_RU, kk: AI_KK }

/** Pick the answer for the active language, falling back to the English canonical, then fill in {name}/{lesson}. */
export function localizeAi(id: string, en: AiEntryText, vars: Record<string, string>): AiEntryText {
  const entry = PACKS[getLocale()]?.[id] ?? en
  const fill = (s: string) => Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), s)
  return {
    text: fill(entry.text),
    caption: entry.caption,
    question: fill(entry.question),
    followUps: entry.followUps.map(fill),
  }
}
