import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { t } from '../i18n'

/* ------------------------------------------------------------------ buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'glow-cta bg-gradient-to-b from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500 active:from-brand-600 active:to-brand-700',
  secondary: 'glass-dim text-ink-800 hover:fill',
  ghost: 'text-ink-600 hover:fill hover:text-ink-900',
  danger: 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_10px_24px_-10px_rgb(244_63_94/0.7)] hover:from-rose-400 hover:to-rose-500',
  success: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_10px_24px_-10px_rgb(16_185_129/0.7)] hover:from-emerald-400 hover:to-emerald-500',
  dark: 'bg-ink-800 text-ink-50 hover:bg-ink-700',
}
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-full',
  md: 'h-11 px-5 text-sm gap-2 rounded-full',
  lg: 'h-13 px-7 text-[15px] gap-2.5 rounded-full',
}

export const btn = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 select-none ${VARIANTS[variant]} ${SIZES[size]} ${extra}`

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: Right, loading, className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={btn(variant, size, className)} disabled={rest.disabled || loading} {...rest}>
      {loading ? <Spinner /> : Icon ? <Icon size={size === 'lg' ? 19 : 17} aria-hidden="true" /> : null}
      {children}
      {Right && !loading && <Right size={size === 'lg' ? 19 : 17} aria-hidden="true" />}
    </button>
  )
}

export const Spinner = ({ className = '' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" fill="none" />
    <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
)

/* ------------------------------------------------------------------ surfaces */

export const Card = ({ className = '', children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`card ${className}`} {...rest}>
    {children}
  </div>
)

export function SectionHeading({ title, subtitle, action, icon: Icon }: { title: string; subtitle?: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.02em] text-ink-900">
          {Icon && <Icon size={17} className="text-brand-500" aria-hidden="true" />}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ badges */

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'cyan'

const TONES: Record<Tone, string> = {
  neutral: 'fill text-ink-600 rim',
  brand: 'bg-brand-100/80 text-brand-800 rim',
  success: 'bg-emerald-100/80 text-emerald-800 rim',
  warning: 'bg-amber-100/85 text-amber-800 rim',
  danger: 'bg-rose-100/80 text-rose-800 rim',
  accent: 'bg-accent-100/80 text-accent-800 rim',
  cyan: 'bg-cyan-100/80 text-cyan-800 rim',
}

export function Badge({ tone = 'neutral', icon: Icon, children, className = '' }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur-sm ${TONES[tone]} ${className}`}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  )
}

export const STATUS_TONE = {
  draft: 'neutral',
  submitted: 'warning',
  under_review: 'brand',
  approved: 'success',
  needs_changes: 'danger',
} as const

/** Keys, not words: the label is translated where it is rendered. */
export const STATUS_LABEL = {
  draft: 'status_draft',
  submitted: 'status_submitted',
  under_review: 'status_under_review',
  approved: 'status_approved',
  needs_changes: 'status_needs_changes',
} as const

/* ------------------------------------------------------------------ progress */

export function ProgressBar({ value, tone = 'brand', size = 'md', label }: { value: number; tone?: 'brand' | 'success' | 'amber' | 'accent'; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const fills = {
    brand: 'bg-gradient-to-r from-brand-400 to-accent-500',
    success: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
    accent: 'bg-gradient-to-r from-accent-400 to-accent-700',
  }
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-ink-400/25 shadow-[0_1px_2px_rgb(11_18_32/0.06)_inset] ${heights[size]}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? t('progress')}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${fills[tone]}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function Ring({ value, size = 84, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-200)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, value)) / 100) * c}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-500)" />
            <stop offset="100%" stopColor="var(--color-brand-600)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ data display */

export function StatTile({ label, value, sub, icon: Icon, tone = 'brand' }: { label: string; value: ReactNode; sub?: string; icon?: LucideIcon; tone?: Tone }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-500">{label}</p>
          <p className="mt-1.5 text-[26px] leading-none font-bold tracking-[-0.03em] text-ink-900 tabular-nums sm:text-[30px]">{value}</p>
          {sub && <p className="mt-2 truncate text-xs text-ink-500">{sub}</p>}
        </div>
        {Icon && (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ring-1 ring-inset ${TONES[tone]}`}>
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
      </div>
    </Card>
  )
}

export function Avatar({ name, initials, size = 40, tone }: { name: string; initials?: string; size?: number; tone?: string }) {
  const text =
    initials ??
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.36, background: tone ?? `linear-gradient(135deg, hsl(${hue} 65% 52%), hsl(${(hue + 40) % 360} 70% 42%))` }}
      aria-hidden="true"
      title={name}
    >
      {text}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-[18px] fill-strong text-brand-500 shadow-[var(--shadow-soft)]">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className="text-base font-bold tracking-[-0.02em] text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} />

export function SkeletonCard() {
  return (
    <Card className="space-y-3 p-5">
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-2 w-4/5" />
    </Card>
  )
}

/* ------------------------------------------------------------------ overlays */

export function Modal({ open, onClose, title, subtitle, children, footer, wide }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={`chrome specular m-auto w-[calc(100vw-1.5rem)] rounded-[28px] p-0 backdrop:bg-ink-950/30 backdrop:backdrop-blur-md ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
      aria-label={title}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="relative flex items-start justify-between gap-4 border-b edge px-6 py-5">
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full fill text-ink-500 transition hover:bg-white hover:text-ink-900" aria-label={t('close_dialog')}>
              <svg width="15" height="15" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </header>
          <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <footer className="relative flex flex-wrap justify-end gap-2 border-t edge px-6 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}

/* ------------------------------------------------------------------ tabs */

export function Tabs<T extends string>({ tabs, value, onChange, className = '' }: { tabs: { id: T; label: string; icon?: LucideIcon; count?: number }[]; value: T; onChange: (id: T) => void; className?: string }) {
  return (
    <div className={`-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`}>
      <div role="tablist" className="chrome inline-flex min-w-full gap-1 rounded-full p-1 sm:min-w-0">
        {tabs.map((t) => {
          const active = t.id === value
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.id)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition ${
                active ? 'fill-strong text-ink-900 shadow-[0_1px_2px_rgb(11_18_32/0.12),0_4px_10px_-4px_rgb(11_18_32/0.25)]' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              {t.icon && <t.icon size={15} aria-hidden="true" />}
              {t.label}
              {t.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${active ? 'bg-brand-100 text-brand-700' : 'fill text-ink-500'}`}>{t.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ inputs */

export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-sm font-semibold text-ink-800">
        {label}
        {required && (
          <span className="text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-ink-500">{hint}</span> : null}
    </label>
  )
}

/** Same visual control without a width, for selects that should size to their content. */
export const controlClass =
  'rounded-[14px] border edge fill px-4 py-2.5 text-sm text-ink-900 backdrop-blur-sm placeholder:text-ink-400 transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/15 focus:outline-none'

export const inputClass = `w-full ${controlClass}`

export const Tooltip = ({ label, children }: { label: string; children: ReactNode }) => (
  <span className="group/tt relative inline-flex">
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 rounded-xl bg-[#0f1724]/92 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/tt:block group-hover/tt:opacity-100 sm:block"
    >
      {label}
    </span>
  </span>
)
