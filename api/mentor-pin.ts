/**
 * Checks the mentor PIN on the server, so the PIN itself never reaches the browser.
 *
 * The variable is MENTOR_PIN, deliberately without a VITE_ prefix: anything carrying one is
 * inlined into the client bundle at build time and readable in devtools, which is precisely
 * what a gate must not be. The browser posts what was typed and learns only yes or no.
 *
 * With no MENTOR_PIN set this answers 501 and the client falls back to its built-in development
 * PIN, so a local checkout still works without any environment at all.
 */

declare const process: { env: Record<string, string | undefined> }

/** Wrong guesses are cheap to make, so make them slow. Per-instance, which is enough of a brake. */
const RECENT = new Map<string, { count: number; until: number }>()
const WINDOW_MS = 60_000
const MAX_TRIES = 8

function tooMany(ip: string) {
  const now = Date.now()
  const seen = RECENT.get(ip)
  if (!seen || seen.until < now) {
    RECENT.set(ip, { count: 1, until: now + WINDOW_MS })
    return false
  }
  seen.count += 1
  return seen.count > MAX_TRIES
}

/** Compares without leaking where the mismatch was through timing. */
function sameSecret(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const expected = process.env.MENTOR_PIN
  // Not configured is a normal state: the client has a development fallback.
  if (!expected) return json({ error: 'not_configured' }, 501)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (tooMany(ip)) return json({ error: 'too_many_attempts' }, 429)

  let pin = ''
  try {
    pin = String(((await req.json()) as { pin?: unknown })?.pin ?? '')
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  return json({ ok: sameSecret(pin.trim(), expected.trim()) }, 200)
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export const config = { runtime: 'edge' }
