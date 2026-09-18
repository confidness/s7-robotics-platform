import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeChoice } from '../lib/theme'
import { t } from '../i18n'

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'light', icon: Sun },
  { value: 'dark', label: 'dark', icon: Moon },
  { value: 'system', label: 'system', icon: Monitor },
]

/** Three-way switch: light, dark, or whatever the device is doing. */
export default function ThemeToggle({ compact }: { compact?: boolean }) {
  const { choice, setChoice } = useTheme()

  return (
    <div className="chrome inline-flex rounded-full p-0.5" role="radiogroup" aria-label={t('colour_theme')}>
      {OPTIONS.map((option) => {
        const active = choice === option.value
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            title={t(option.label)}
            onClick={() => setChoice(option.value)}
            className={`relative grid place-items-center rounded-full transition ${compact ? 'h-8 w-8' : 'h-9 w-9'} ${
              active ? 'fill-strong text-brand-600 shadow-[0_1px_2px_rgb(11_18_32/0.12)] dark:text-brand-300' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            <option.icon size={compact ? 15 : 16} aria-hidden="true" />
            <span className="sr-only">{t(option.label)}</span>
          </button>
        )
      })}
    </div>
  )
}
