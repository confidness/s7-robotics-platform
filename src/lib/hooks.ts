import { useEffect, useState } from 'react'
import { formatDate as i18nDate, t } from '../i18n'

/**
 * Stands in for the latency of the data layer. When these screens are wired to a real API
 * this becomes the query's own `isLoading`, and the skeletons below it stay exactly as they are.
 */
export function useLoaded(delay = 240) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return ready
}

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return t('just_now')
  if (mins < 60) return t('minutes_ago', { n: mins })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('hours_ago', { n: hours })
  const days = Math.round(hours / 24)
  if (days === 1) return t('yesterday')
  if (days < 30) return t('days_ago', { n: days })
  return i18nDate(iso)
}

export const formatDate = (iso: string) => i18nDate(iso)

/** Counted nouns: the dictionary holds the phrase, the number is interpolated. */
export const plural = (count: number, key: string) => t(count === 1 ? `${key}_one` : `${key}_many`, { n: count })
