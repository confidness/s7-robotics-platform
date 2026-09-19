/**
 * End-to-end check of the AI mentor path, with Anthropic stubbed out.
 *
 * The question this answers is narrow and was worth asking: does what the browser sends actually
 * arrive at Anthropic in the shape the API expects, and does the answer make it all the way back
 * without the offline fallback stepping on it. A key is never needed to prove that — only a stub
 * standing where the real endpoint does, recording exactly what it was handed.
 */

import handler, { parseReply } from '../api/mentor.ts'

declare const process: { env: Record<string, string | undefined>; exitCode?: number }

const NL = String.fromCharCode(10)
let failures = 0

function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) return
  failures++
  console.error(`  FAIL  ${name}${detail === undefined ? '' : `${NL}        ${JSON.stringify(detail)}`}`)
}

interface Captured {
  url: string
  method?: string
  headers: Record<string, string>
  body: Record<string, unknown>
}

let captured: Captured | null = null

/** Stands in for api.anthropic.com and records the call verbatim. */
function stubAnthropic(reply: { status?: number; text?: string; raw?: unknown }) {
  captured = null
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    captured = {
      url: String(url),
      method: init.method,
      headers: init.headers as Record<string, string>,
      body: JSON.parse(String(init.body)) as Record<string, unknown>,
    }
    const status = reply.status ?? 200
    const payload = reply.raw ?? { content: [{ type: 'text', text: reply.text ?? '' }] }
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    }
  }) as unknown as typeof fetch
}

const post = (body: unknown) =>
  handler(new Request('https://example.test/api/mentor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }))

const ASK = { question: 'My HC-SR04 reads 0 every time', locale: 'ru', lessonTitle: 'Ultrasonic distance', courseTitle: 'Arduino', code: 'int t = 9;' }

const GOOD = JSON.stringify({
  text: `Сначала проверь питание.${NL}${NL}Потом TRIG.`,
  question: 'Какое напряжение на VCC?',
  followUps: ['Как читать echo', 'Что такое pulseIn'],
  code: { language: 'cpp', source: 'pinMode(9, OUTPUT);', caption: 'Пин на выход' },
})

async function run() {
  console.log('AI mentor delivery')

  // --- the request actually leaves, addressed correctly -------------------------------------
  process.env.ANTHROPIC_API_KEY = 'test-key-not-a-real-one'
  stubAnthropic({ text: GOOD })
  let res = await post(ASK)
  let out = (await res.json()) as Record<string, unknown>
  const c = captured as Captured | null

  check('upstream was called at all', c !== null)
  check('endpoint is the Messages API', c?.url === 'https://api.anthropic.com/v1/messages', c?.url)
  check('method is POST', c?.method === 'POST')
  check('key travels in x-api-key', c?.headers['x-api-key'] === 'test-key-not-a-real-one', c?.headers)
  check('api version pinned', c?.headers['anthropic-version'] === '2023-06-01')
  check('no workspace header when none is configured', c?.headers['anthropic-workspace-id'] === undefined, c?.headers)
  check('model is Haiku 4.5', c?.body.model === 'claude-haiku-4-5-20251001', c?.body.model)
  check('max_tokens is set', typeof c?.body.max_tokens === 'number')

  const messages = c?.body.messages as { role: string; content: string }[]
  check('the student question is the user turn', messages?.[0]?.role === 'user' && messages[0].content === ASK.question, messages?.[0])

  const system = String(c?.body.system ?? '')
  check('locale reaches the prompt', system.includes('Russian'), system.slice(0, 120))
  check('lesson reaches the prompt', system.includes('Ultrasonic distance'))
  check('course reaches the prompt', system.includes('Arduino'))
  check('editor code reaches the prompt', system.includes('int t = 9;'))
  check('teaching rule is in the prompt', system.includes('Never hand over the finished project'))

  // --- and the answer arrives back intact ----------------------------------------------------
  check('status is 200', res.status === 200, res.status)
  check('text survives the round trip', out.text === `Сначала проверь питание.${NL}${NL}Потом TRIG.`, out.text)
  check('question survives', out.question === 'Какое напряжение на VCC?', out.question)
  check('followUps survive', Array.isArray(out.followUps) && out.followUps.length === 2, out.followUps)
  check('code survives', (out.code as { source?: string })?.source === 'pinMode(9, OUTPUT);', out.code)

  // An organisation-level key is refused until a workspace is named, so the header must go out.
  process.env.ANTHROPIC_WORKSPACE_ID = '  wrkspc_test123' + NL
  stubAnthropic({ text: GOOD })
  await post(ASK)
  check('workspace header is sent when configured', (captured as Captured | null)?.headers['anthropic-workspace-id'] === 'wrkspc_test123', (captured as Captured | null)?.headers)

  // A key pasted into a dashboard field arrives with whitespace; a header holding it is rejected.
  process.env.ANTHROPIC_API_KEY = ' test-key-not-a-real-one' + NL
  stubAnthropic({ text: GOOD })
  await post(ASK)
  check('pasted whitespace is trimmed off the key', (captured as Captured | null)?.headers['x-api-key'] === 'test-key-not-a-real-one', (captured as Captured | null)?.headers)
  process.env.ANTHROPIC_API_KEY = 'test-key-not-a-real-one'
  delete process.env.ANTHROPIC_WORKSPACE_ID

  // --- shapes the model really produces ------------------------------------------------------
  stubAnthropic({ text: '```json' + NL + GOOD + NL + '```' })
  out = (await (await post(ASK)).json()) as Record<string, unknown>
  check('fenced JSON still parses', typeof out.text === 'string' && String(out.text).includes('питание'), out)

  stubAnthropic({ text: 'Вот ответ:' + NL + GOOD })
  out = (await (await post(ASK)).json()) as Record<string, unknown>
  check('prefaced JSON still parses', typeof out.text === 'string' && String(out.text).includes('питание'), out)

  // A prefilled '{' comes back as a continuation, without the brace the model was handed.
  stubAnthropic({ text: GOOD.slice(1) })
  res = await post(ASK)
  out = (await res.json()) as Record<string, unknown>
  check('continuation of a prefilled brace parses', res.status === 200 && String(out.text).includes('питание'), out)

  // Plain prose is still a real answer and must not be thrown away.
  stubAnthropic({ text: 'Проверь питание датчика, затем пин TRIG.' })
  res = await post(ASK)
  out = (await res.json()) as Record<string, unknown>
  check('prose answer is kept, not discarded', res.status === 200 && String(out.text).includes('Проверь питание'), { status: res.status, out })

  // --- failures must be quiet, and must not be mistaken for success ---------------------------
  stubAnthropic({ status: 401 })
  res = await post(ASK)
  check('bad key is 502, not 200', res.status === 502, res.status)

  // A bare status cannot separate an empty wallet from a malformed request; the message can.
  stubAnthropic({ status: 400, raw: { error: { message: 'Your credit balance is too low to access the Anthropic API.' } } })
  res = await post(ASK)
  out = (await res.json()) as Record<string, unknown>
  check('upstream status is reported', out.status === 400, out)
  check('upstream reason is carried through', String(out.detail).includes('credit balance'), out)
  check('the reason never carries the key', !JSON.stringify(out).includes('test-key-not-a-real-one'), out)

  stubAnthropic({ status: 429 })
  check('rate limit is 502', (await post(ASK)).status === 502)

  stubAnthropic({ raw: { content: [] } })
  check('empty content is 502', (await post(ASK)).status === 502)

  globalThis.fetch = (async () => {
    throw new Error('network down')
  }) as unknown as typeof fetch
  check('network failure is 502', (await post(ASK)).status === 502)

  // --- the unconfigured deployment, which is the state that matters right now ------------------
  delete process.env.ANTHROPIC_API_KEY
  captured = null
  res = await post(ASK)
  check('no key is 501', res.status === 501, res.status)
  check('no key spends no upstream call', captured === null)

  const health = await handler(new Request('https://example.test/api/mentor', { method: 'GET' }))
  const hb = (await health.json()) as Record<string, unknown>
  check('health reports missing key', hb.configured === false, hb)
  check('health never returns a key', !JSON.stringify(hb).includes('test-key'), hb)

  process.env.ANTHROPIC_API_KEY = 'test-key-not-a-real-one'
  const health2 = (await (await handler(new Request('https://example.test/api/mentor', { method: 'GET' }))).json()) as Record<string, unknown>
  check('health reports a configured key', health2.configured === true, health2)
  check('health reports no workspace id when unset', health2.workspace === false, health2)

  process.env.ANTHROPIC_WORKSPACE_ID = 'wrkspc_test123'
  const health3 = (await (await handler(new Request('https://example.test/api/mentor', { method: 'GET' }))).json()) as Record<string, unknown>
  check('health reports a configured workspace id', health3.workspace === true, health3)
  check('health never returns the workspace id itself', !JSON.stringify(health3).includes('wrkspc_test123'), health3)
  delete process.env.ANTHROPIC_WORKSPACE_ID
  check('health still never returns the key', !JSON.stringify(health2).includes('test-key-not-a-real-one'), health2)

  // --- parseReply guards -----------------------------------------------------------------------
  check('empty text is rejected', parseReply('{"text":"   "}') === null)
  check('missing text is rejected', parseReply('{"question":"x"}') === null)
  check('junk is rejected', parseReply('not json at all') === null)

  console.log(failures === 0 ? '✓ request and reply travel end to end; no key, no upstream call' : `${failures} failed`)
}

/**
 * The client half of the same question: when the model answers, nothing may replace it.
 *
 * The two brains produce the same shape on purpose, so a mix-up would be invisible in the UI.
 * `fromModel` is the only thing separating them, and it is what the panel prints under the reply.
 */
async function clientSide() {
  const g = globalThis as unknown as { localStorage?: unknown }
  if (!g.localStorage) {
    const mem = new Map<string, string>()
    g.localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
  }
  const { askMentor } = (await import('../src/lib/ai.ts')) as typeof import('../src/lib/ai.ts')

  const modelReply = { text: 'Ответ от модели', question: 'И что дальше?', followUps: ['раз', 'два'] }
  let seen: { url: string; body: Record<string, unknown> } | null = null
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen = { url: String(url), body: JSON.parse(String(init.body)) as Record<string, unknown> }
    return { ok: true, status: 200, json: async () => modelReply }
  }) as unknown as typeof fetch

  let r = await askMentor('почему датчик врёт', { lessonTitle: 'Ultrasonic distance', code: 'int t=9;' })
  const sent = seen as { url: string; body: Record<string, unknown> } | null
  check('client posts to /api/mentor', sent?.url === '/api/mentor', sent?.url)
  check('client sends the question', sent?.body.question === 'почему датчик врёт', sent?.body)
  check('client sends lesson context', sent?.body.lessonTitle === 'Ultrasonic distance')
  check('client sends the editor code', sent?.body.code === 'int t=9;')
  check('model text is what the UI gets', r.text === 'Ответ от модели', r.text)
  check('reply is flagged as the model', r.fromModel === true, r)
  check('offline text did not leak in', !r.text.includes('narrow it down') && !r.text.includes('Hardware'), r.text)

  // A question the local base has a canned answer for must still come back from the model.
  r = await askMentor('explain how the ultrasonic sensor works', {})
  check('model wins over a local keyword match', r.text === 'Ответ от модели' && r.fromModel === true, r)

  // Only when the model produces nothing does the local base speak — and it says so.
  globalThis.fetch = (async () => ({ ok: false, status: 502, json: async () => ({}) })) as unknown as typeof fetch
  r = await askMentor('explain how the ultrasonic sensor works', {})
  check('fallback answers when the model fails', r.text.length > 0)
  check('fallback is not mislabelled as the model', r.fromModel !== true, r)

  // An empty model reply is not an answer, so the fallback takes over rather than showing blank.
  globalThis.fetch = (async () => ({ ok: true, status: 200, json: async () => ({ text: '' }) })) as unknown as typeof fetch
  r = await askMentor('anything', {})
  check('empty model text falls back instead of showing blank', r.text.length > 0 && r.fromModel !== true, r)

  await knowledgeBase()

  console.log(failures === 0 ? '✓ the model always wins; the offline base only fills a silence' : `${failures} failed`)
  if (failures) process.exitCode = 1
}

/**
 * The offline base is what answers whenever the model cannot, so it is not a decoration.
 *
 * Two things rot quietly here. A new entry added above an older one can swallow its questions,
 * because the first matching pattern wins and nothing complains. And an entry added to the English
 * canonical without its Russian and Kazakh wording falls back to English silently — which on a
 * trilingual platform is exactly the kind of bug a judge finds before anyone else does.
 */
async function knowledgeBase() {
  const { KB } = (await import('../src/lib/ai.ts')) as unknown as { KB: { id: string; match: RegExp }[] }
  const { AI_RU } = (await import('../src/i18n/ai.ru.ts')) as typeof import('../src/i18n/ai.ru.ts')
  const { AI_KK } = (await import('../src/i18n/ai.kk.ts')) as typeof import('../src/i18n/ai.kk.ts')

  for (const entry of KB) {
    check(`${entry.id} has Russian wording`, entry.id in AI_RU, entry.id)
    check(`${entry.id} has Kazakh wording`, entry.id in AI_KK, entry.id)
  }
  // 'fallback' and the '_plain' variants answer when there is no entry or no lesson, so they are
  // packaged wording without a KB row of their own. Everything else must belong to one.
  const known = (id: string) => KB.some((e) => e.id === id) || id === 'fallback' || id.endsWith('_plain')
  for (const id of Object.keys(AI_RU)) check(`ru pack has no orphan: ${id}`, known(id), id)
  for (const id of Object.keys(AI_KK)) check(`kk pack has no orphan: ${id}`, known(id), id)

  // A question a student would really type, and the entry it has to reach — in all three languages.
  const ROUTES: [string, string][] = [
    ['avrdude: stk500_getsync() not responding', 'upload'],
    ['плата не прошивается, порт не появляется', 'upload'],
    ['тақша жүктелмейді', 'upload'],
    ['what does analogRead return?', 'analog'],
    ['как работает потенциометр', 'analog'],
    ['my DHT11 humidity is wrong', 'dht11'],
    ['датчик влажности врёт', 'dht11'],
    ['my robot wobbles following the line', 'line-following'],
    ['робот виляет по линии', 'line-following'],
    ['how do I calibrate the infrared sensor', 'line-sensor'],
    ['калибровка датчика линии', 'line-sensor'],
    ['how do I use the REPL on a Pico', 'board-repl'],
    ['esp32 micropython не отвечает', 'board-repl'],
    // The entries these were inserted above must keep their own questions.
    ['my HC-SR04 reads zero', 'ultrasonic'],
    ['the motor driver does nothing', 'motor'],
    ['error: was not declared in this scope', 'compile-error'],
    ['write my whole project for me', 'do-my-homework'],
  ]
  for (const [question, expected] of ROUTES) {
    const hit = KB.find((e) => e.match.test(question))
    check(`"${question.slice(0, 34)}" reaches ${expected}`, hit?.id === expected, { got: hit?.id })
  }

  console.log(`  ${KB.length} knowledge base topics, all three languages`)
}

void run().then(clientSide)
