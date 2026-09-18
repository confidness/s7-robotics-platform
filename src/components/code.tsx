import { useMemo, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { t } from '../i18n'

/* Tiny highlighter for the two languages this platform teaches. A full grammar library
   would be ~40× the size for no visible gain at this scale. */

const KEYWORDS =
  /\b(?:const|int|long|float|double|char|bool|void|unsigned|static|if|else|for|while|switch|case|break|continue|return|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|enum|struct|class|def|import|from|in|not|and|or|None|True|False|global|while|elif|pass|self)\b/
const BUILTINS =
  /\b(?:setup|loop|pinMode|digitalWrite|digitalRead|analogRead|analogWrite|delay|delayMicroseconds|pulseIn|millis|micros|map|abs|max|min|isnan|attach|write|print|println|begin|range|len|sorted|int|str|float)\b/

const TOKEN = new RegExp(
  [
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/.source, // 1 comment
    /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/.source, // 2 string
    /(\b\d+\.?\d*(?:UL|L|f)?\b)/.source, // 3 number
    `(${KEYWORDS.source})`, // 4 keyword
    `(${BUILTINS.source})`, // 5 builtin
    /([A-Za-z_]\w*)(?=\s*\()/.source, // 6 call
  ].join('|'),
  'g',
)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const CLASS = ['text-[#64748b] italic', 'text-emerald-300', 'text-amber-300', 'text-sky-300 font-medium', 'text-violet-300', 'text-brand-300']

export function highlight(code: string): string {
  let out = ''
  let last = 0
  TOKEN.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN.exec(code))) {
    out += esc(code.slice(last, m.index))
    const groupIndex = m.slice(1).findIndex((g) => g !== undefined)
    out += `<span class="${CLASS[groupIndex] ?? ''}">${esc(m[0])}</span>`
    last = m.index + m[0].length
  }
  return out + esc(code.slice(last))
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          /* clipboard blocked — the code is still selectable on screen */
        }
        setDone(true)
        setTimeout(() => setDone(false), 1600)
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
      aria-label={done ? t('copied') : (label ?? t('copy'))}
    >
      {done ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      {done ? t('copied') : (label ?? t('copy'))}
    </button>
  )
}

export function CodeBlock({ source, filename, actions }: { source: string; filename?: string; actions?: React.ReactNode }) {
  const html = useMemo(() => highlight(source), [source])
  const lines = source.split('\n').length
  return (
    <div className="overflow-hidden rounded-2xl border code-chrome code-surface">
      <div className="flex items-center justify-between gap-2 border-b code-chrome px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-xs text-[#94a3b8]">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </span>
          {filename ?? 'sketch.ino'}
        </span>
        <span className="flex items-center gap-1">
          {actions}
          <CopyButton text={source} />
        </span>
      </div>
      <div className="flex max-h-[26rem] overflow-auto text-[13px] leading-[1.65]">
        <pre aria-hidden="true" className="sticky left-0 shrink-0 code-surface px-3 py-4 text-right font-mono text-[#64748b] select-none">
          {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
        </pre>
        <pre className="min-w-0 flex-1 py-4 pr-4 font-mono text-[#e2e8f0]">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  )
}

/** Editable version: same rendering, with a transparent textarea on top holding the caret. */
export function CodeEditor({ value, onChange, filename, actions, minRows = 14 }: { value: string; onChange: (v: string) => void; filename?: string; actions?: React.ReactNode; minRows?: number }) {
  const html = useMemo(() => highlight(value), [value])
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLPreElement>(null)
  const lines = Math.max(value.split('\n').length, minRows)

  return (
    <div className="overflow-hidden rounded-2xl border code-chrome code-surface">
      <div className="flex items-center justify-between gap-2 border-b code-chrome px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-xs text-[#94a3b8]">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </span>
          {filename ?? 'sketch.ino'}
        </span>
        <span className="flex flex-wrap items-center justify-end gap-1">
          {actions}
          <CopyButton text={value} />
        </span>
      </div>

      <div className="relative flex max-h-[30rem] overflow-auto text-[13px] leading-[1.65]">
        <pre ref={gutterRef} aria-hidden="true" className="sticky left-0 z-10 shrink-0 code-surface px-3 py-4 text-right font-mono text-[#64748b] select-none">
          {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
        </pre>
        <div className="relative min-w-0 flex-1">
          <pre ref={preRef} aria-hidden="true" className="pointer-events-none px-1 py-4 pr-4 font-mono break-words whitespace-pre-wrap text-[#e2e8f0]">
            <code dangerouslySetInnerHTML={{ __html: html + '\n' }} />
          </pre>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault()
                const el = e.currentTarget
                const start = el.selectionStart
                const next = value.slice(0, start) + '  ' + value.slice(el.selectionEnd)
                onChange(next)
                requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2))
              }
            }}
            spellCheck={false}
            aria-label={t('code_editor')}
            className="absolute inset-0 resize-none border-0 bg-transparent px-1 py-4 pr-4 font-mono break-words whitespace-pre-wrap text-transparent caret-white outline-none selection:bg-brand-500/40"
          />
        </div>
      </div>
    </div>
  )
}
