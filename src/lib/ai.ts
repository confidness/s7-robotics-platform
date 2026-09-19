import { localizeAi, type AiEntryText } from '../i18n/ai'
import { getLocale } from '../i18n'

/**
 * AI Robotics Mentor — reply layer.
 *
 * `askMentor` is the only thing the UI knows about. Today it is answered by the local
 * knowledge base below; pointing it at a real model means replacing the body of this one
 * function with a fetch and keeping the same signature.
 *
 * Teaching rule baked into every answer: hint, explain, ask back. Never hand over the
 * finished project — the student has to build it.
 *
 * Every entry carries an id. The English text below is canonical; `localizeAi` swaps in the
 * Russian or Kazakh wording for the same id. Each `match` also accepts Russian and Kazakh
 * keywords, so a student gets the right answer whichever language they ask in.
 */

export interface AskContext {
  lessonTitle?: string
  courseTitle?: string
  studentName?: string
  code?: string
}

export interface AiReply {
  id: string
  text: string
  code?: { language: string; source: string; caption: string }
  question?: string
  followUps: string[]
  /** Whether a model answered, or the offline knowledge base did. Shown next to the reply. */
  fromModel?: boolean
}

interface Entry {
  id: string
  match: RegExp
  en: AiEntryText
  code?: { language: string; source: string }
}

const KB: Entry[] = [
  {
    id: 'ultrasonic',
    match: /\b(hc-?sr-?04|ultrasonic|distance sensor)\b|ультразвук|датчик расстояния|ультрадыбыс|қашықтық сенсор/i,
    en: {
      text: 'The HC-SR04 never reports a distance — it reports a duration. You pulse TRIG high for 10 µs, the sensor fires eight bursts at 40 kHz, and ECHO then stays high for exactly as long as the sound took to travel out and back.\n\nSo the whole conversion is: take the microseconds, multiply by the speed of sound in cm/µs, and halve it because the sound made the trip twice.',
      caption: 'The conversion, not the whole sketch',
      question: 'Before you write the rest — what should your code do when `pulseIn` returns 0?',
      followUps: ['Why does pulseIn need a timeout?', 'My readings jump around', 'How do I light an LED under 20 cm?'],
    },
    code: {
      language: 'cpp',
      source: `long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
float distanceCm = (duration * 0.0343) / 2.0;`,
    },
  },
  {
    id: 'pulsein',
    match: /\b(pulsein|timeout|freeze|hang|blocks?)\b|таймаут|зависа|подвисает|қатып қал|кідіріс/i,
    en: {
      text: 'pulseIn waits for the pin to go high and then times how long it stays there. If nothing ever comes back — soft surface, steep angle, nothing in range — it waits for its default timeout of one full second, and your loop stops dead for that whole time.\n\nThe third argument caps that wait. 30000UL is about five metres of range, far more than the sensor can actually see.',
      caption: 'Bounded wait, with a sentinel for "no echo"',
      question: 'A returned -1 is not a distance. Where in your loop should that be handled so it never gets printed as a measurement?',
      followUps: ['What else makes a reading fail?', 'How fast can I poll the sensor?'],
    },
    code: {
      language: 'cpp',
      source: `long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
if (duration == 0) return -1;   // nothing came back`,
    },
  },
  {
    id: 'noisy',
    match: /\b(jump|noisy|unstable|jitter|fluctuat|inconsistent|random numbers)\b|скач|шум|нестабиль|прыга|тұрақсыз|секір/i,
    en: {
      text: 'Three usual causes, in the order worth checking:\n\n1. **Polling too fast.** Fire the sensor again before the previous echo has died away and you read the old burst. Leave at least 60 ms between measurements.\n2. **Surface.** Fabric, foam and anything at an angle scatter the burst. A flat board at 90° is your test target.\n3. **Power.** A servo or motor on the same supply drops the rail while it moves, and the sensor misfires.\n\nIf the readings are stable but wrong, that is a different problem — that is calibration, not noise.',
      question: 'Are your bad readings random spikes, or consistently off by the same amount?',
      followUps: ['How do I smooth the readings?', 'Why would readings be consistently wrong?'],
    },
  },
  {
    id: 'smooth',
    match: /\b(smooth|average|median|filter)\b|сглаж|средне|медиан|фильтр|тегісте|орташа/i,
    en: {
      text: 'Averaging the last few readings is the standard first move, but a median is usually better here: one wild spike drags an average sideways, while a median simply ignores it.\n\nTake three readings, sort them, keep the middle one. Three is enough for an ultrasonic sensor and costs you almost no time.',
      question: 'What does averaging cost you if the object is moving quickly?',
      followUps: ['Show me the median idea in code', 'How fast can I poll the sensor?'],
    },
  },
  {
    id: 'led-threshold',
    match: /\b(led|threshold|light up|turn on|blink).*(distance|close|near|cm)|(distance|close|near).*(led|light)|светодиод|порог|жарықдиод|шекті мән/i,
    en: {
      text: 'Keep the two jobs apart: one piece of code measures, another decides. That separation is what lets you change the rule later without touching the sensor logic.\n\nName your limits as constants — `NEAR_CM`, `WARN_CM` — instead of leaving bare numbers in the middle of an `if`. When you re-tune on a different table, you change one line.',
      caption: 'The shape, not your answer',
      question: 'The challenge asks for three zones, not two. What is the cleanest way to express "between 10 and 20"?',
      followUps: ['How do I blink without delay()?', 'How do I only print when the state changes?'],
    },
    code: {
      language: 'cpp',
      source: `const int NEAR_CM = 20;

// ... after you have a valid distance:
digitalWrite(LED_PIN, distance < NEAR_CM ? HIGH : LOW);`,
    },
  },
  {
    id: 'millis',
    match: /\b(millis|without delay|non-?blocking|blink.*delay)\b|без delay|миллис|мига|жыпылық|бөгетсіз/i,
    en: {
      text: 'delay() stops everything — the sensor cannot be read while the LED is waiting. millis() gives you the number of milliseconds since the board started, and you compare it against the last time you acted.\n\nThe pattern is always the same: remember `lastToggle`, and when `millis() - lastToggle >= interval`, do the thing and update `lastToggle`.',
      caption: 'The pattern',
      question: 'Why is `millis() - lastToggle >= INTERVAL` safer than `millis() >= lastToggle + INTERVAL`?',
      followUps: ['What is unsigned long for?', 'How do I structure a state machine?'],
    },
    code: {
      language: 'cpp',
      source: `unsigned long lastToggle = 0;
const unsigned long INTERVAL = 250;

if (millis() - lastToggle >= INTERVAL) {
  lastToggle = millis();
  // toggle here
}`,
    },
  },
  {
    id: 'state-machine',
    match: /\b(state machine|states|driving|backing|turning)\b|конечн\w* автомат|состояни|күй машина|күйлер/i,
    en: {
      text: 'A state machine is three things written down: the list of states, what each one does, and exactly what moves you out of it. Write those sentences before any code.\n\n"DRIVING → BACKING when distance is under 20 cm. BACKING → TURNING after 500 ms. TURNING → DRIVING after 400 ms."\n\nIf your code does not read like those sentences, the structure is wrong, not the values.',
      question: 'What should happen if the robot enters BACKING three times in five seconds?',
      followUps: ['How do I log state changes?', 'Should I use enum or int?'],
    },
  },
  {
    id: 'compile-error',
    match: /\b(not declared|was not declared|undefined reference|expected|error:|compil|won'?t upload|does not name a type)\b|ошибк\w* компил|не компилируется|не загружается|компиляц|қате шығ/i,
    en: {
      text: 'Arduino compiler errors point at the first line that stopped making sense, which is often one line *after* the real mistake. Three that cover most cases:\n\n• **"was not declared in this scope"** — a typo, or the variable was declared inside a different pair of braces.\n• **"expected \';\' before..."** — the missing semicolon is on the line above the one named.\n• **"does not name a type"** — usually a missing `#include`, or code sitting outside any function.\n\nAlways read the *first* error. The rest are frequently its echoes.',
      question: 'Paste the exact first error line and the five lines around it — what does the line above the arrow end with?',
      followUps: ['My board will not upload', 'Serial Monitor shows nothing'],
    },
  },
  {
    id: 'serial-monitor',
    match: /\b(serial monitor|nothing prints|no output|garbage|question marks|baud)\b|монитор порта|ничего не выводит|нет вывода|порт монитор|ештеңе шықпа/i,
    en: {
      text: 'Two causes, and they look identical from the outside.\n\nIf the monitor is **empty**: `Serial.begin(9600)` is missing from setup(), or you are printing inside a branch that never runs.\n\nIf the monitor shows **garbage characters**: the baud rate selector at the bottom right of the Serial Monitor does not match the number in your `Serial.begin()`. They have to be the same.',
      question: 'Empty, or garbled? The two point at completely different lines.',
      followUps: ['How do I print a float with one decimal?', 'Can I plot the values?'],
    },
  },
  {
    id: 'servo',
    match: /\b(servo|sg90|angle|pwm pulse)\b|серво|сервопривод|угол|бұрыш/i,
    en: {
      text: 'A servo reads the width of a pulse arriving every 20 ms: 1.0 ms means 0°, 2.0 ms means 180°. The Servo library writes those pulses for you.\n\nIf it twitches, resets the board, or hums without holding position, suspect power before code. A stalled SG90 pulls more current than the Uno regulator will give. Separate supply, grounds joined.',
      question: 'Does the twitching get worse when the servo is under load?',
      followUps: ['How do I mount the sensor on the servo?', 'Why join the grounds?'],
    },
  },
  {
    id: 'motor',
    match: /\b(motor|l298|h-?bridge|driver|wheels? (do not|don't) (turn|move))\b|мотор|двигател|колёс|колес|драйвер|қозғалтқыш|дөңгелек/i,
    en: {
      text: 'An H-bridge has four switches around the motor. One diagonal pair gives you forward, the other reverse — and a vertical pair shorts the supply, which is why IN1 and IN2 must never both be HIGH.\n\nIf the motor hums but does not turn, your PWM value is below its stall threshold. Most small geared motors need 60 or more out of 255 before they actually move. Measure yours once, keep it as a constant.',
      question: 'Does the motor turn if you set ENA to 255 directly?',
      followUps: ['How do I make both wheels the same speed?', 'Why does the board reset when the motor starts?'],
    },
  },
  {
    id: 'python',
    match: /\b(python|spike|micropython|def |indent)\b|питон|пайтон|отступ|шегініс/i,
    en: {
      text: 'Python for robots is the same three tools as any other language — a value, a decision, a repeat — with indentation doing what braces do in C++.\n\nOne habit worth forming early: put each behaviour in its own function with a name that says what it does. `drive_cm(40)` reads as intent; forty lines in a row reads as a puzzle.',
      question: 'What would the inputs and outputs of your function be, in one sentence each?',
      followUps: ['How do I convert cm to motor degrees?', 'What is a state machine in Python?'],
    },
  },
  {
    id: 'wiring',
    match: /\b(wiring|wire|connect|pins?|breadboard|ground|gnd)\b|провод|подключ|пин|макетн|земл|сым|қосылым|жалға/i,
    en: {
      text: 'Check in this order, it finds most faults in under a minute:\n\n1. **Ground.** Every part must share a ground with the Arduino. Missing ground is the single most common fault, and it produces the weirdest symptoms.\n2. **Power.** Sensors on 5 V, motors on their own supply.\n3. **Signal.** Does the pin number in your code match the hole the wire is actually in?\n4. **Breadboard rows.** The rows are horizontal, the rails are vertical, and the centre channel separates the two halves.',
      question: 'Trace the ground wire with a finger from the sensor back to the Arduino GND pin — is it unbroken?',
      followUps: ['Why does ground matter so much?', 'Can I power the sensor from a digital pin?'],
    },
  },
  {
    id: 'do-my-homework',
    match: /\b(write (the|my) (whole|entire|full)|do (my|the) (project|homework|task)|give me the (full|complete) (code|answer)|solve it for me)\b|напиши (весь|целиком|полностью)|сделай (за меня|проект|задание)|реши за меня|дай весь код|толық код|бәрін жаз|орныма жаса/i,
    en: {
      text: 'Not that one — the project is the part that teaches you, and a mentor reviewing it will ask you how it works.\n\nWhat I will do is take it apart with you. Tell me which piece is stuck: the wiring, the reading, the maths, or the decision that drives the output. We solve that one piece, you write it, and we move to the next.',
      question: 'Which of those four is the one that is actually blocking you right now?',
      followUps: ['I am stuck on the wiring', 'I am stuck on the distance maths', 'My code compiles but does nothing'],
    },
  },
  {
    id: 'hello',
    match: /\b(hi|hello|hey|salam)\b|привет|здравствуй|сәлем|салам/i,
    en: {
      text: 'Hello, {name}. You are on **{lesson}** right now. Ask me about the wiring, the code, an error message you do not recognise, or why a reading looks wrong.',
      question: 'What are you working on at this moment?',
      followUps: ['Explain how the ultrasonic sensor works', 'My readings jump around', 'I have a compiler error'],
    },
  },
]

/** Greeting and fallback each have a second wording for when we do not know the lesson. */
const NO_LESSON: Record<string, AiEntryText> = {
  hello: {
    text: 'Hello, {name}. Ask me about the wiring, the code, an error message you do not recognise, or why a reading looks wrong.',
    question: 'What are you working on at this moment?',
    followUps: ['Explain how the ultrasonic sensor works', 'My readings jump around', 'I have a compiler error'],
  },
  fallback: {
    text: 'I can help with that best if we narrow it down.\n\nTell me which layer the problem sits in:\n\n• **Hardware** — a wire, a pin, power\n• **Reading** — the sensor value itself looks wrong\n• **Logic** — the value is right but the robot decides badly\n• **Language** — the compiler is refusing the code\n\nIf you paste the exact error text or the numbers you are seeing, I can be much more specific.',
    question: 'Which of those four layers is it?',
    followUps: ['Explain how the ultrasonic sensor works', 'Help me debug a compiler error', 'How do I structure a state machine?'],
  },
}

const FALLBACK: AiEntryText = {
  text: 'I can help with that best if we narrow it down. You are in **{lesson}**, so I will assume that is the context.\n\nTell me which layer the problem sits in:\n\n• **Hardware** — a wire, a pin, power\n• **Reading** — the sensor value itself looks wrong\n• **Logic** — the value is right but the robot decides badly\n• **Language** — the compiler is refusing the code\n\nIf you paste the exact error text or the numbers you are seeing, I can be much more specific.',
  question: 'Which of those four layers is it?',
  followUps: ['Explain how the ultrasonic sensor works', 'Help me debug a compiler error', 'How do I structure a state machine?'],
}

let counter = 0

/** How long to wait for the model before falling back — a stuck student will not sit through more. */
const MODEL_TIMEOUT_MS = 12_000

/**
 * When a 501 said no key was configured, so an unconfigured deployment stops asking every time.
 *
 * It expires rather than latching for good: a key added in the dashboard would otherwise leave
 * every tab opened beforehand permanently offline, with nothing on screen to explain why.
 */
let offlineUntil = 0
const OFFLINE_RETRY_MS = 60_000

/**
 * Asks the server-side model. Returns null on anything at all — no key configured, rate limit,
 * offline, slow — and the caller falls back to the local knowledge base. The student should never
 * see an error where a hint belongs.
 */
async function askModel(question: string, ctx: AskContext): Promise<Omit<AiReply, 'id'> | null> {
  if (Date.now() < offlineUntil) return null
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), MODEL_TIMEOUT_MS)
  try {
    const res = await fetch('/api/mentor', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: abort.signal,
      body: JSON.stringify({
        question,
        locale: getLocale(),
        lessonTitle: ctx.lessonTitle,
        courseTitle: ctx.courseTitle,
        code: ctx.code,
      }),
    })
    if (res.status === 501) {
      offlineUntil = Date.now() + OFFLINE_RETRY_MS
      return null
    }
    if (!res.ok) return null
    const data = (await res.json()) as Omit<AiReply, 'id'>
    return data?.text ? data : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export function askMentorLocal(question: string, ctx: AskContext = {}): Promise<AiReply> {
  const entry = KB.find((e) => e.match.test(question))
  const lesson = ctx.lessonTitle ?? ''
  const vars = { name: ctx.studentName?.split(' ')[0] ?? '', lesson }

  // The greeting and the fallback read differently when there is no lesson to refer to.
  let id = entry?.id ?? 'fallback'
  let en = entry?.en ?? FALLBACK
  if (!lesson && NO_LESSON[id]) {
    id = `${id}_plain`
    en = NO_LESSON[entry?.id ?? 'fallback']
  }

  const body = localizeAi(id, en, vars)
  const reply: AiReply = {
    id: `ai-${++counter}-${Date.now()}`,
    text: body.text,
    question: body.question,
    followUps: body.followUps,
    code: entry?.code && body.caption ? { ...entry.code, caption: body.caption } : undefined,
  }
  // Latency is deliberate: the UI has to handle a pending state, exactly as it would with a real model.
  return new Promise((resolve) => setTimeout(() => resolve(reply), 620 + Math.random() * 520))
}

/**
 * What the UI calls. The model answers when one is configured and reachable; otherwise the local
 * base does, with the same shape and the same teaching rule. Neither path can fail visibly.
 */
export async function askMentor(question: string, ctx: AskContext = {}): Promise<AiReply> {
  const fromModel = await askModel(question, ctx)
  if (fromModel) return { ...fromModel, id: `ai-${++counter}-${Date.now()}`, fromModel: true }
  return askMentorLocal(question, ctx)
}

/** Keys into the UI dictionary — the prompts are translated at render time, like every other label. */
export const STARTER_PROMPTS = ['ai_starter_ultrasonic', 'ai_starter_noisy', 'ai_starter_blink', 'ai_starter_scope_error', 'ai_starter_structure']
