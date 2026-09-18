import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { UI } from './ui'

export type Locale = 'kk' | 'ru' | 'en'

export const LOCALES: { value: Locale; label: string; short: string }[] = [
  { value: 'kk', label: 'Қазақша', short: 'ҚАЗ' },
  { value: 'ru', label: 'Русский', short: 'РУС' },
  { value: 'en', label: 'English', short: 'ENG' },
]

const KEY = 's7-locale'
const TAGS: Record<Locale, string> = { kk: 'kk-KZ', ru: 'ru-RU', en: 'en-GB' }

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'kk' || saved === 'ru' || saved === 'en') return saved
  } catch {
    /* storage blocked — fall through to the browser language */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'ru'
  if (nav.startsWith('kk')) return 'kk'
  if (nav.startsWith('ru') || nav.startsWith('uk') || nav.startsWith('be')) return 'ru'
  return 'en'
}

/**
 * The active locale lives in a module variable so `t()` can be called from anywhere —
 * plain functions, class-free helpers, deeply nested components — without threading a hook
 * through every file. The provider owns the state and re-renders the tree when it changes.
 */
let current: Locale = 'ru'

export const getLocale = () => current
export const localeTag = () => TAGS[current]

/** Translate. Unknown keys fall back to English, then to the key itself so gaps are visible. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const entry = UI[key]
  let text = entry ? (entry[current] ?? entry.en) : key
  if (vars) for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value))
  return text
}

/**
 * Chrome resolves `kk-KZ` but ships no Kazakh month or weekday names for it — it renders
 * "M09 19, Sat". So Kazakh dates are assembled here and only the other locales go to Intl.
 */
const KK_MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
const KK_MONTHS_SHORT = ['қаң.', 'ақп.', 'нау.', 'сәу.', 'мам.', 'мау.', 'шіл.', 'там.', 'қыр.', 'қаз.', 'қар.', 'жел.']
const KK_WEEKDAYS = ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі']

function formatKazakh(date: Date, options: Intl.DateTimeFormatOptions): string {
  const parts: string[] = []
  if (options.day) parts.push(String(date.getDate()))
  if (options.month === 'long') parts.push(KK_MONTHS[date.getMonth()])
  else if (options.month) parts.push(KK_MONTHS_SHORT[date.getMonth()])
  if (options.year) parts.push(`${date.getFullYear()} ж.`)
  let out = parts.join(' ')
  if (options.weekday) out = out ? `${KK_WEEKDAYS[date.getDay()]}, ${out}` : KK_WEEKDAYS[date.getDay()]
  if (options.hour) out = `${out}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return out
}

/** Dates and numbers follow the interface language, not the operating system. */
export const formatDate = (iso: string | Date, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const date = iso instanceof Date ? iso : new Date(iso)
  if (current === 'kk') return formatKazakh(date, options)
  return options.hour ? date.toLocaleString(TAGS[current], options) : date.toLocaleDateString(TAGS[current], options)
}

export const formatNumber = (value: number) => (current === 'kk' ? value.toLocaleString('ru-RU') : value.toLocaleString(TAGS[current]))

interface Ctx {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleCtx = createContext<Ctx>({ locale: 'ru', setLocale: () => {} })

export const useLocale = () => useContext(LocaleCtx)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = detectLocale()
    current = initial
    return initial
  })

  useEffect(() => {
    current = locale
    document.documentElement.lang = locale
    try {
      localStorage.setItem(KEY, locale)
    } catch {
      /* storage blocked — the choice still applies for this session */
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    current = next
    setLocaleState(next)
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>
}
