/**
 * The AI mentor, answered by a model instead of the local knowledge base.
 *
 * This runs on Vercel, not in the browser, for one reason: the API key. Anything the client
 * bundle can read, a student can read in devtools, so the key lives in the server's environment
 * and never leaves it. The browser sends a question and gets an answer — it never sees a key.
 *
 * If ANTHROPIC_API_KEY is not set, this returns 501 and the client quietly falls back to the
 * built-in knowledge base, so the mentor keeps working with no server at all.
 */

/* This file runs on the server, not in the browser, and the project has no Node types.
   Declaring just the one thing it reads keeps the dependency list unchanged. */
declare const process: { env: Record<string, string | undefined> }

const MODEL = 'claude-haiku-4-5-20251001'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

/** Long enough for an explanation and a short snippet, short enough to stay quick and cheap. */
const MAX_TOKENS = 700

const LANGUAGE = { kk: 'Kazakh', ru: 'Russian', en: 'English' } as const
type Locale = keyof typeof LANGUAGE

/**
 * The teaching rule is enforced here rather than asked for politely in passing: this mentor
 * exists to get a student unstuck, and handing over the finished project would defeat the
 * lesson it is attached to.
 */
function systemPrompt(locale: Locale, lessonTitle?: string, courseTitle?: string, code?: string) {
  return [
    'You are the robotics mentor inside S7 Robotics Platform, a learning platform for school students aged 7 to 18.',
    `Answer entirely in ${LANGUAGE[locale]}. Keep code listings and hardware identifiers (pin names, function names, Arduino constants) in English, because that is how they are written on the board and in the IDE.`,
    '',
    'HOW YOU TEACH — this is the rule, not a preference:',
    '- Hint, explain, and ask a question back. Never hand over the finished project or a complete solution to the task the student was set.',
    '- If asked to "write the whole thing", "do my homework" or "just give me the code", refuse plainly and offer to take the problem apart instead: wiring, reading, maths, or the decision that drives the output. Ask which one is actually stuck.',
    '- A short fragment that demonstrates a technique is fine. A working version of their assignment is not.',
    '- Prefer naming the cause over listing possibilities. If several causes are plausible, order them by how often they are the real one.',
    '',
    'STYLE:',
    '- Two or three short paragraphs at most. No headings, no bullet lists unless you are genuinely enumerating causes.',
    '- Talk to a teenager who is mid-build and slightly frustrated. Concrete, calm, no cheerleading.',
    '- Use **bold** for the one thing that matters most. Nothing else is formatted.',
    '',
    'CONTEXT:',
    lessonTitle ? `- The student is on the lesson "${lessonTitle}"${courseTitle ? ` in the course "${courseTitle}"` : ''}.` : '- The student is not inside a lesson right now.',
    code && code.trim() ? `- This is the code currently in their editor:\n\`\`\`\n${code.slice(0, 4000)}\n\`\`\`` : '- Their editor is empty or they have not shared code.',
    '',
    'OUTPUT — reply with JSON only, no prose around it, matching exactly:',
    '{"text": string, "question": string, "followUps": string[], "code": {"language": string, "source": string, "caption": string} | null}',
    '- "text": the answer itself. Use \\n\\n between paragraphs.',
    '- "question": one question back to the student that moves them forward. Never empty.',
    '- "followUps": two or three things they might ask next, each under 45 characters.',
    '- "code": a short illustrative fragment, or null when none is warranted. Never their finished task.',
  ].join('\n')
}

interface Body {
  question?: string
  locale?: string
  lessonTitle?: string
  courseTitle?: string
  code?: string
}

export default async function handler(req: Request): Promise<Response> {
  // A GET is a health check: it says whether a key is configured without spending one.
  // Anything other than JSON coming back here means the function itself is not deployed.
  if (req.method === 'GET') return json({ ok: true, configured: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL }, 200)
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  // Trimmed for the same reason as the workspace id: a value pasted into a dashboard field
  // routinely carries a trailing newline, and a header holding one is rejected before it is sent.
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  // No key configured is a normal state, not a failure — the client has a local fallback.
  if (!key) return json({ error: 'not_configured' }, 501)

  // Optional, and only an organisation-level key needs it. Trimmed because a value pasted into a
  // dashboard field picks up whitespace, and a header with a stray newline is rejected outright.
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID?.trim()

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  const question = (body.question ?? '').trim()
  if (!question) return json({ error: 'bad_request' }, 400)
  if (question.length > 2000) return json({ error: 'too_long' }, 413)

  const locale: Locale = body.locale === 'kk' || body.locale === 'ru' ? body.locale : 'en'

  try {
    const upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        // An organisation-level key belongs to no workspace, and Anthropic refuses it with a 400
        // until one is named. A key created inside a workspace carries that itself and needs no
        // header, so this is set only when there is something to set.
        ...(workspace ? { 'anthropic-workspace-id': workspace } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt(locale, body.lessonTitle, body.courseTitle, body.code),
        // The opening brace is put in the model's mouth: it continues the JSON instead of
        // deciding whether to write any. Asking nicely in the prompt is not the same guarantee.
        messages: [
          { role: 'user', content: question },
          { role: 'assistant', content: '{' },
        ],
      }),
    })

    if (!upstream.ok) {
      // Rate limit, bad key, upstream outage — all the same to the student: use the local base.
      // The reason is carried anyway, because the alternative is guessing at a status code from
      // the outside. It is an API error string and never contains the key.
      return json({ error: 'upstream', status: upstream.status, detail: await errorMessage(upstream) }, 502)
    }

    const data = (await upstream.json()) as { content?: { type: string; text?: string }[] }
    const raw = data.content?.find((c) => c.type === 'text')?.text ?? ''
    // The reply is a continuation of '{', so the brace has to be put back before parsing. Trying
    // the raw text first costs nothing and covers a model that repeated the brace anyway.
    const parsed = parseReply(raw) ?? parseReply('{' + raw) ?? asProse(raw)
    if (!parsed) return json({ error: 'unparseable' }, 502)

    return json(parsed, 200)
  } catch {
    return json({ error: 'upstream' }, 502)
  }
}

/**
 * Pulls Anthropic's own explanation out of a failed response.
 *
 * A bare status is not enough to act on: 400 alone covers a malformed request and an account with
 * no credit left, and those need opposite fixes. Reading the body costs nothing at this point,
 * since the response is being discarded either way.
 */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: unknown } }
    const msg = body?.error?.message
    return typeof msg === 'string' ? msg.slice(0, 300) : ''
  } catch {
    return ''
  }
}

/**
 * Last resort: a model that answered in prose still answered.
 *
 * Discarding that over a formatting rule is how a correctly configured deployment ends up looking
 * broken — the student sees the offline fallback and concludes the AI is down. Half-written JSON
 * is different; it would read as gibberish, so that is still refused.
 */
function asProse(raw: string) {
  const text = raw.trim()
  if (!text || text.startsWith('{') || text.startsWith('"')) return null
  return { text, question: '', followUps: [] as string[] }
}

/** The model is asked for bare JSON, but a stray fence or preamble should not cost us the answer. */
export function parseReply(raw: string) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(raw.slice(start, end + 1)) as {
      text?: unknown
      question?: unknown
      followUps?: unknown
      code?: { language?: unknown; source?: unknown; caption?: unknown } | null
    }
    if (typeof obj.text !== 'string' || !obj.text.trim()) return null
    return {
      text: obj.text,
      question: typeof obj.question === 'string' ? obj.question : '',
      followUps: Array.isArray(obj.followUps) ? obj.followUps.filter((f): f is string => typeof f === 'string').slice(0, 3) : [],
      code:
        obj.code && typeof obj.code.source === 'string' && obj.code.source.trim()
          ? {
              language: typeof obj.code.language === 'string' ? obj.code.language : 'cpp',
              source: obj.code.source,
              caption: typeof obj.code.caption === 'string' ? obj.code.caption : '',
            }
          : undefined,
    }
  } catch {
    return null
  }
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export const config = { runtime: 'edge' }
