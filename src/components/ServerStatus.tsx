import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, PlugZap, RefreshCw, ServerCog } from 'lucide-react'
import { Button, SectionHeading } from './ui'
import { t } from '../i18n'

/**
 * Says why the AI mentor is answering offline, which is otherwise invisible from the outside.
 *
 * The endpoints answer a GET with their configuration state and never with a secret. Anything
 * that is not JSON means the function is not deployed at all — usually a rewrite swallowing
 * /api/, which returns the HTML page instead.
 */
type Health = 'checking' | 'ready' | 'no-key' | 'not-deployed' | 'error'

async function probe(path: string): Promise<Health> {
  try {
    const res = await fetch(path, { method: 'GET' })
    const body = await res.text()
    // A serverless function answers JSON. HTML means the SPA fallback answered instead.
    if (!body.trim().startsWith('{')) return 'not-deployed'
    const data = JSON.parse(body) as { configured?: boolean }
    return data.configured ? 'ready' : 'no-key'
  } catch {
    return 'error'
  }
}

const TONE: Record<Health, string> = {
  checking: 'text-ink-500',
  ready: 'text-emerald-700',
  'no-key': 'text-amber-800',
  'not-deployed': 'text-rose-700',
  error: 'text-rose-700',
}

function Row({ label, state, keyName }: { label: string; state: Health; keyName: string }) {
  const Icon = state === 'ready' ? CheckCircle2 : state === 'checking' ? RefreshCw : AlertTriangle
  const explain =
    state === 'ready'
      ? t('configured_and_answering')
      : state === 'no-key'
        ? t('set_key_in_vercel_then_redeploy', { key: keyName })
        : state === 'not-deployed'
          ? t('the_function_is_not_deployed_check_api_routes')
          : state === 'error'
            ? t('could_not_reach_it_at_all')
            : t('checking')

  return (
    <li className="rounded-[16px] border edge fill-soft p-4">
      <p className={`flex items-center gap-2 text-sm font-bold ${TONE[state]}`}>
        <Icon size={15} className={state === 'checking' ? 'animate-spin' : ''} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-sm text-ink-600">{explain}</p>
    </li>
  )
}

/**
 * Asks the mentor a real question and reports what came back.
 *
 * The health check cannot tell a good key from a bad one — a revoked or mistyped key is still a
 * key, and reads as configured. Only a real round trip separates "the AI works" from "the AI is
 * about to fall back silently in front of the judges", so this spends one small request to say so.
 */
async function liveTest(): Promise<string> {
  try {
    const res = await fetch('/api/mentor', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'Say OK.', locale: 'en' }),
    })
    const body = await res.text()
    if (!body.trim().startsWith('{')) return t('the_function_is_not_deployed_check_api_routes')
    const data = JSON.parse(body) as { text?: string; error?: string; status?: number; detail?: string }
    if (res.ok && data.text) return t('live_ok', { text: data.text.slice(0, 90) })
    if (res.status === 501) return t('set_key_in_vercel_then_redeploy', { key: 'ANTHROPIC_API_KEY' })
    // A 400 covers both an empty wallet and a malformed request, so the message decides, not the code.
    if (/credit balance/i.test(data.detail ?? '')) return t('live_no_credit')
    if (data.status === 401 || data.status === 403) return t('live_key_rejected')
    if (data.status === 429) return t('live_rate_limited')
    const code = String(data.status ?? data.error ?? res.status)
    return data.detail ? t('live_failed_detail', { code, detail: data.detail }) : t('live_failed', { code })
  } catch {
    return t('could_not_reach_it_at_all')
  }
}

export default function ServerStatus() {
  const [mentor, setMentor] = useState<Health>('checking')
  const [pin, setPin] = useState<Health>('checking')
  const [round, setRound] = useState(0)
  const [live, setLive] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    let alive = true
    setMentor('checking')
    setPin('checking')
    void probe('/api/mentor').then((h) => alive && setMentor(h))
    void probe('/api/mentor-pin').then((h) => alive && setPin(h))
    return () => {
      alive = false
    }
  }, [round])

  return (
    <>
      <SectionHeading title={t('server_features')} subtitle={t('what_needs_a_key_and_whether_it_has_one')} icon={ServerCog} />
      <ul className="mt-4 space-y-3">
        <Row label={t('ai_robotics_mentor')} state={mentor} keyName="ANTHROPIC_API_KEY" />
        <Row label={t('mentor_pin')} state={pin} keyName="MENTOR_PIN" />
      </ul>
      <p className="mt-3 text-xs text-ink-500">{t('both_fall_back_safely_the_app_works_without_them')}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => setRound((n) => n + 1)}>
          {t('check_again')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={PlugZap}
          disabled={testing}
          onClick={() => {
            setTesting(true)
            setLive('')
            void liveTest()
              .then(setLive)
              .finally(() => setTesting(false))
          }}
        >
          {testing ? t('checking') : t('send_a_test_question')}
        </Button>
      </div>
      {live && <p className="mt-3 rounded-[14px] border edge fill-soft p-3 text-sm text-ink-700">{live}</p>}
    </>
  )
}
