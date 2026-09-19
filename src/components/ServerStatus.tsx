import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, ServerCog } from 'lucide-react'
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

export default function ServerStatus() {
  const [mentor, setMentor] = useState<Health>('checking')
  const [pin, setPin] = useState<Health>('checking')
  const [round, setRound] = useState(0)

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
      <Button variant="secondary" size="sm" icon={RefreshCw} className="mt-4" onClick={() => setRound((n) => n + 1)}>
        {t('check_again')}
      </Button>
    </>
  )
}
