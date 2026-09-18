/**
 * Theme: light, dark, or follow the system. The chosen mode is written to
 * `<html data-theme>`, which every colour token in index.css keys off.
 *
 * index.html applies the stored choice before first paint, so there is no flash.
 */
import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 's7-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export const resolveTheme = (choice: ThemeChoice): 'light' | 'dark' => (choice === 'system' ? (media().matches ? 'dark' : 'light') : choice)

export function readThemeChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    /* storage blocked — fall through to system */
  }
  return 'system'
}

export function applyTheme(choice: ThemeChoice) {
  document.documentElement.dataset.theme = resolveTheme(choice)
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    /* storage blocked — the theme still applies for this session */
  }
}

/** Single source of truth for the toggle; also follows the OS while set to `system`. */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(readThemeChoice)

  useEffect(() => {
    applyTheme(choice)
    if (choice !== 'system') return
    const mq = media()
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [choice])

  return { choice, resolved: resolveTheme(choice), setChoice }
}
