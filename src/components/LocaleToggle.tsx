import { LOCALES, useLocale, t } from '../i18n'

/** Three languages, three letters each — the switch never needs a dropdown. */
export default function LocaleToggle({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale()

  return (
    <div className="chrome inline-flex rounded-full p-0.5" role="radiogroup" aria-label={t('language')}>
      {LOCALES.map((option) => {
        const active = locale === option.value
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            title={option.label}
            onClick={() => setLocale(option.value)}
            className={`relative rounded-full px-2.5 text-[11px] font-bold tracking-[0.02em] transition ${compact ? 'h-8' : 'h-9'} ${
              active ? 'fill-strong text-brand-600 shadow-[0_1px_2px_rgb(11_18_32/0.12)] dark:text-brand-300' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {option.short}
            <span className="sr-only">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
