import { useEffect, useState, type ReactNode } from 'react'
import { Activity, Lightbulb, Radio } from 'lucide-react'
import type { Component, WiringRow } from '../lib/types'
import { Badge, Card } from './ui'
import { t } from '../i18n'

/* ------------------------------------------------------------------ component icons */

const ICONS: Record<Component['icon'], ReactNode> = {
  board: (
    <>
      <rect x="6" y="10" width="36" height="28" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="12" y="17" width="14" height="10" rx="1.5" fill="currentColor" opacity="0.55" />
      <path d="M10 14h28M10 34h28" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3" />
      <circle cx="33" cy="30" r="2.5" fill="currentColor" />
    </>
  ),
  sensor: (
    <>
      <rect x="7" y="14" width="34" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
      <circle cx="17" cy="24" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="31" cy="24" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="17" cy="24" r="2" fill="currentColor" />
      <circle cx="31" cy="24" r="2" fill="currentColor" />
    </>
  ),
  led: (
    <>
      <path d="M17 26v-4a7 7 0 0 1 14 0v4z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
      <path d="M17 26h14v3H17z" fill="currentColor" opacity="0.5" />
      <path d="M21 29v10M27 29v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 6v4M14 10l2.5 3M34 10l-2.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  wire: (
    <>
      <path d="M8 34c6-14 12 6 18-8s8 6 14-4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="34" r="3" fill="currentColor" />
      <circle cx="40" cy="22" r="3" fill="currentColor" />
    </>
  ),
  breadboard: (
    <>
      <rect x="6" y="9" width="36" height="30" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M6 24h36" stroke="currentColor" strokeWidth="1.5" />
      {[12, 18, 24, 30, 36].map((x) => (
        <g key={x}>
          <circle cx={x} cy="15" r="1.4" fill="currentColor" />
          <circle cx={x} cy="19" r="1.4" fill="currentColor" />
          <circle cx={x} cy="29" r="1.4" fill="currentColor" />
          <circle cx={x} cy="33" r="1.4" fill="currentColor" />
        </g>
      ))}
    </>
  ),
  resistor: (
    <>
      <path d="M4 24h9l3-8 5 16 5-16 3 8h9" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  motor: (
    <>
      <circle cx="22" cy="24" r="13" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
      <path d="M35 20h6v8h-6" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M22 16v16M16 24h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  battery: (
    <>
      <rect x="6" y="15" width="32" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
      <path d="M38 21h4v6h-4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M12 21v6M18 21v6M24 21v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
}

export function PartIcon({ kind, className = '' }: { kind: Component['icon']; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={t('part_illustration', { kind })}>
      {ICONS[kind]}
    </svg>
  )
}

export function ComponentCard({ component }: { component: Component }) {
  return (
    <Card className="card-hover flex gap-4 p-4">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 text-accent-400">
        <PartIcon kind={component.icon} className="h-10 w-10" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-bold text-ink-900">{component.name}</h4>
          <Badge tone="neutral">×{component.qty}</Badge>
        </div>
        <p className="mt-0.5 text-xs font-semibold text-brand-600">{component.role}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{component.description}</p>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ wiring diagram */

const WIRE_COLORS: Record<string, string> = {
  red: '#ef4444',
  black: '#0f172a',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  grey: '#94a3b8',
  gray: '#94a3b8',
}
const wireColor = (name: string) => WIRE_COLORS[name.trim().toLowerCase().split(/[\s/]/)[0]] ?? '#64748b'

/** Built from the lesson's wiring rows — every lesson gets a diagram without bespoke artwork. */
export function WiringDiagram({ rows, boardLabel = 'Arduino Uno' }: { rows: WiringRow[]; boardLabel?: string }) {
  if (rows.length === 0) return null
  const height = Math.max(240, rows.length * 46 + 70)
  const boardTop = 30
  const boardHeight = height - 60

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 760 ${height}`} className="mx-auto w-full min-w-[620px] max-w-[760px]" role="img" aria-label={t('wiring_diagram_label', { rows: rows.map((r) => t('from_to_pair', { from: r.from, to: r.to })).join('; ') })}>
        <rect x="0" y="0" width="760" height={height} rx="16" fill="#0B1120" />
        <g opacity="0.3">
          {Array.from({ length: 26 }, (_, i) => (
            <line key={i} x1={i * 30} y1="0" x2={i * 30} y2={height} stroke="#1e293b" strokeWidth="1" />
          ))}
        </g>

        {/* board */}
        <rect x="40" y={boardTop} width="150" height={boardHeight} rx="10" fill="#0e7490" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="1.5" />
        <text x="115" y={boardTop + 24} textAnchor="middle" fill="#67e8f9" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif">
          {boardLabel}
        </text>
        <rect x="70" y={boardTop + 40} width="90" height="34" rx="4" fill="#155e75" />
        <text x="115" y={boardTop + 62} textAnchor="middle" fill="#a5f3fc" fontSize="11" fontFamily="JetBrains Mono, monospace">
          {t('mcu')}
        </text>

        {rows.map((row, i) => {
          const y = 60 + i * 46
          const color = wireColor(row.color)
          return (
            <g key={`${row.from}-${row.to}-${i}`}>
              <circle cx="190" cy={y} r="4.5" fill={color} />
              <path d={`M190 ${y} C 280 ${y}, 320 ${y}, 420 ${y}`} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="420" cy={y} r="4.5" fill={color} />
              <text x="205" y={y - 9} fill="#e2e8f0" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">
                {row.to}
              </text>
              <rect x="432" y={y - 17} width="290" height="34" rx="8" fill="#1e293b" stroke={color} strokeOpacity="0.5" />
              <text x="446" y={y + 5} fill="#f1f5f9" fontSize="12.5" fontWeight="600" fontFamily="Inter, sans-serif">
                {row.from.length > 32 ? `${row.from.slice(0, 31)}…` : row.from}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function WiringTable({ rows }: { rows: WiringRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b edge text-xs font-semibold text-ink-500">
            <th scope="col" className="py-2.5 pr-3 font-semibold">
              {t('from')}
            </th>
            <th scope="col" className="py-2.5 pr-3 font-semibold">
              {t('to')}
            </th>
            <th scope="col" className="py-2.5 pr-3 font-semibold">
              {t('wire')}
            </th>
            <th scope="col" className="py-2.5 font-semibold">
              {t('why')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divider">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              <td className="py-2.5 pr-3 font-semibold text-ink-900">{row.from}</td>
              <td className="py-2.5 pr-3 font-mono text-xs text-ink-700">{row.to}</td>
              <td className="py-2.5 pr-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                  <span className="h-3 w-3 rounded-full ring-1 ring-ink-300" style={{ background: wireColor(row.color) }} aria-hidden="true" />
                  {row.color}
                </span>
              </td>
              <td className="py-2.5 text-ink-600">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ virtual lab */

type Zone = 'DANGER' | 'WARNING' | 'CLEAR'
/** The zone is a value the logic compares against; only its label is translated. */
const zoneFor = (cm: number): Zone => (cm < 10 ? 'DANGER' : cm < 20 ? 'WARNING' : 'CLEAR')
const ZONE_LABEL: Record<Zone, string> = { DANGER: 'zone_danger', WARNING: 'zone_warning', CLEAR: 'zone_clear' }

/** Simplified simulation: move the object, watch the sensor reading, the LED and the serial output. */
export function VirtualLab() {
  const [distance, setDistance] = useState(45)
  const [log, setLog] = useState<string[]>([])
  const zone = zoneFor(distance)
  const duration = Math.round((distance * 2) / 0.0343)

  useEffect(() => {
    const line = `Distance: ${distance.toFixed(1)} cm${zone !== 'CLEAR' ? `  → ${zone}` : ''}`
    setLog((l) => [...l.slice(-7), line])
  }, [distance, zone])

  const ledOn = zone !== 'CLEAR'
  const objectX = 120 + (Math.min(distance, 120) / 120) * 300

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b edge px-5 py-3.5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <Activity size={16} className="text-brand-600" aria-hidden="true" /> {t('virtual_lab_ultrasonic_rig')}
        </h3>
        <Badge tone={zone === 'CLEAR' ? 'success' : zone === 'WARNING' ? 'warning' : 'danger'}>{t(ZONE_LABEL[zone])}</Badge>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <svg viewBox="0 0 480 220" className="code-surface w-full rounded-[16px]" role="img" aria-label={t('simulation_label', { distance, state: ledOn ? t('on_state') : t('off_state') })}>
            <g opacity="0.35">
              {Array.from({ length: 16 }, (_, i) => (
                <line key={i} x1={i * 30} y1="0" x2={i * 30} y2="220" stroke="#1e293b" />
              ))}
            </g>
            {/* board + sensor */}
            <rect x="20" y="70" width="80" height="90" rx="8" fill="#0e7490" fillOpacity="0.3" stroke="#22d3ee" />
            <text x="60" y="98" textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">
              UNO
            </text>
            <rect x="100" y="95" width="26" height="40" rx="4" fill="#1e293b" stroke="#64748b" />
            <circle cx="113" cy="107" r="6" fill="#0f172a" stroke="#94a3b8" />
            <circle cx="113" cy="123" r="6" fill="#0f172a" stroke="#94a3b8" />

            {/* sound waves */}
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${132 + i * 16} 95 q 10 20 0 40`} stroke="#22d3ee" strokeOpacity={0.75 - i * 0.22} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            ))}

            {/* object */}
            <rect x={objectX} y="55" width="18" height="110" rx="4" fill="#475569" stroke="#cbd5e1" />
            <line x1="132" y1="180" x2={objectX} y2="180" stroke="#94a3b8" strokeDasharray="4 4" />
            <text x={(132 + objectX) / 2} y="196" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontFamily="JetBrains Mono,monospace">
              {distance.toFixed(0)} cm
            </text>

            {/* LED */}
            <circle cx="60" cy="42" r="13" fill={ledOn ? (zone === 'DANGER' ? '#ef4444' : '#f59e0b') : '#334155'} stroke="#cbd5e1" strokeWidth="1.5">
              {ledOn && zone === 'WARNING' && <animate attributeName="opacity" values="1;0.25;1" dur="0.7s" repeatCount="indefinite" />}
            </circle>
            <text x="82" y="47" fill="#cbd5e1" fontSize="12" fontFamily="Inter,sans-serif">
              LED D6 · {ledOn ? 'HIGH' : 'LOW'}
            </text>
          </svg>

          <label className="mt-4 block">
            <span className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-800">{t('object_distance')}<span className="font-mono text-xs text-ink-500">{distance} cm</span>
            </span>
            <input
              type="range"
              min={2}
              max={120}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
              aria-label={t('object_distance_in_centimetres')}
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="code-surface rounded-[16px] p-3.5 font-mono text-xs leading-relaxed text-emerald-300">
            <p className="mb-2 flex items-center gap-1.5 text-[#94a3b8]">
              <Radio size={12} aria-hidden="true" /> {t('serial_monitor_baud')}
            </p>
            {log.map((line, i) => (
              <p key={i} className={i === log.length - 1 ? 'text-emerald-200' : 'opacity-60'}>
                {line}
              </p>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl fill p-3">
              <dt className="text-xs font-semibold text-ink-500">{t('echo_duration')}</dt>
              <dd className="mt-1 font-mono font-bold text-ink-900">{duration} µs</dd>
            </div>
            <div className="rounded-xl fill p-3">
              <dt className="text-xs font-semibold text-ink-500">{t('led_state')}</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-bold text-ink-900">
                <Lightbulb size={14} className={ledOn ? 'text-amber-500' : 'text-ink-400'} aria-hidden="true" />
                {ledOn ? 'HIGH' : 'LOW'}
              </dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-ink-500">
            {t('the_rig_runs_the_lesson_thresholds_clear_above_2')}
          </p>
        </div>
      </div>
    </Card>
  )
}
