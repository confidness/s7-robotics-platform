import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Eraser, Play, Plug, PlugZap, Send, Square, Usb } from 'lucide-react'
import { BAUD_RATES, SerialSession, serialSupported } from '../lib/serial'
import { Button, controlClass } from './ui'
import { t } from '../i18n'

/** Enough scrollback to follow a run without letting the DOM grow without limit. */
const MAX_LINES = 400

/**
 * A serial monitor in the page. `canRun` turns on the MicroPython button — only boards running
 * MicroPython (ESP32, Pico) can be handed code over the wire; an Arduino sketch needs compiling.
 */
export default function SerialTerminal({ code, canRun = false }: { code?: string; canRun?: boolean }) {
  const supported = serialSupported()
  const session = useRef<SerialSession | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const tail = useRef('')

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [baud, setBaud] = useState(115200)
  const [lines, setLines] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [lines])

  // A board left connected when the page closes keeps the port locked, so always let go.
  useEffect(() => {
    return () => {
      void session.current?.disconnect()
    }
  }, [])

  /** The board sends bytes, not lines; hold the unfinished tail until its newline arrives. */
  function absorb(chunk: string) {
    tail.current += chunk
    const parts = tail.current.split(/\r?\n/)
    tail.current = parts.pop() ?? ''
    if (parts.length) setLines((all) => [...all, ...parts].slice(-MAX_LINES))
  }

  async function connect() {
    setError('')
    setBusy(true)
    const s = new SerialSession()
    try {
      await s.connect(baud, absorb, () => {
        setOpen(false)
        setError(t('the_board_was_disconnected'))
      })
      session.current = s
      setOpen(true)
      setLines((all) => [...all, t('connected_at_n_baud', { n: baud })])
    } catch (e) {
      // Cancelling the browser's port dialog throws too, and that is not an error worth shouting about.
      const name = (e as { name?: string })?.name
      if (name !== 'NotFoundError' && name !== 'AbortError') setError(t('could_not_open_the_port_close_other_serial_apps'))
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    await session.current?.disconnect()
    session.current = null
    setOpen(false)
    setLines((all) => [...all, t('disconnected')])
  }

  if (!supported) {
    return (
      <div className="rounded-[18px] border border-amber-200 bg-amber-50/60 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
          <AlertTriangle size={15} aria-hidden="true" />
          {t('this_browser_cannot_talk_to_a_board')}
        </p>
        <p className="mt-1.5 text-sm text-amber-900">{t('web_serial_needs_chrome_or_edge_on_a_computer')}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[18px] border edge">
      <div className="flex flex-wrap items-center gap-2 border-b edge fill-soft px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <Usb size={15} className={open ? 'text-emerald-600' : 'text-ink-500'} aria-hidden="true" />
          {t('board_terminal')}
        </span>

        <select
          className={`${controlClass} w-auto`}
          value={baud}
          onChange={(e) => setBaud(Number(e.target.value))}
          disabled={open}
          aria-label={t('baud_rate')}
        >
          {BAUD_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate}
            </option>
          ))}
        </select>

        <span className="ml-auto flex flex-wrap gap-2">
          {canRun && open && code && (
            <Button
              size="sm"
              variant="success"
              icon={Play}
              onClick={async () => {
                setLines((all) => [...all, t('sending_to_the_board')])
                await session.current?.runMicroPython(code)
              }}
            >
              {t('run_on_board')}
            </Button>
          )}
          {open && (
            <Button size="sm" variant="secondary" icon={Square} onClick={() => session.current?.interrupt()}>
              {t('stop')}
            </Button>
          )}
          <Button size="sm" variant="ghost" icon={Eraser} onClick={() => setLines([])}>
            {t('clear_output')}
          </Button>
          {open ? (
            <Button size="sm" variant="secondary" icon={PlugZap} onClick={disconnect}>
              {t('disconnect')}
            </Button>
          ) : (
            <Button size="sm" icon={Plug} loading={busy} onClick={connect}>
              {t('connect_board')}
            </Button>
          )}
        </span>
      </div>

      <div ref={scroller} className="code-surface h-56 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed text-[#e2e8f0]">
        {lines.length === 0 ? (
          <p className="text-[#7b8a9e]">{t('plug_the_board_in_then_press_connect')}</p>
        ) : (
          lines.map((line, i) => (
            <p key={i} className="break-words whitespace-pre-wrap">
              {line}
            </p>
          ))
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t edge p-3"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!input.trim() || !open) return
          setLines((all) => [...all, `> ${input}`].slice(-MAX_LINES))
          await session.current?.sendLine(input)
          setInput('')
        }}
      >
        <input
          className={`${controlClass} flex-1 font-mono`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={open ? t('type_a_line_and_press_enter') : t('connect_first')}
          disabled={!open}
          aria-label={t('send_to_the_board')}
        />
        <Button type="submit" size="sm" icon={Send} disabled={!open || !input.trim()} aria-label={t('send_to_the_board')}>
          <span className="hidden sm:inline">{t('send')}</span>
        </Button>
      </form>

      {error && (
        <p role="alert" className="border-t edge bg-rose-100/60 px-4 py-2.5 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}
