import { useEffect, useRef, useState } from 'react'
import { Bot, HelpCircle, Send, Sparkles, User as UserIcon } from 'lucide-react'
import { askMentor, STARTER_PROMPTS, type AiReply, type AskContext } from '../lib/ai'
import { CodeBlock } from './code'
import { Button, inputClass } from './ui'
import { t } from '../i18n'

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  reply?: AiReply
}

/** Renders **bold** and paragraph breaks — the only formatting the mentor replies use. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) =>
        line.trim() === '' ? (
          <span key={i} className="block h-2" />
        ) : (
          <p key={i} className="text-sm leading-relaxed text-ink-700">
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith('**') ? (
                <strong key={j} className="font-bold text-ink-900">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        ),
      )}
    </>
  )
}

export default function AiMentorPanel({ context, height = 'h-[32rem]' }: { context: AskContext; height?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  async function ask(question: string) {
    const q = question.trim()
    if (!q || pending) return
    setInput('')
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: q }])
    setPending(true)
    const reply = await askMentor(q, context)
    setPending(false)
    setMessages((m) => [...m, { id: reply.id, role: 'ai', text: reply.text, reply }])
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border edge fill-strong">
      <div className="flex items-center gap-3 border-b edge fill-soft px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 text-white">
          <Bot size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-900">{t('ai_robotics_mentor')}</p>
          <p className="truncate text-xs text-ink-500">{context.lessonTitle ? t('context_lesson', { title: context.lessonTitle }) : t('hints_explanations_and_debugging_never_the_finis')}</p>
        </div>
      </div>

      <div ref={scroller} className={`flex-1 space-y-4 overflow-y-auto p-4 ${height}`}>
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl fill text-ink-400">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-ink-900">{t('ask_anything_about_your_build')}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{t('wiring_code_an_error_you_do_not_recognise_or_a_r')}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((p) => (
                <button key={p} onClick={() => ask(t(p))} className="rounded-full border edge fill-strong px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50">
                  {t(p)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end gap-2.5">
              <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">{m.text}</p>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ink-200 text-ink-600">
                <UserIcon size={15} aria-hidden="true" />
              </span>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 text-white">
                <Bot size={15} aria-hidden="true" />
              </span>
              <div className="min-w-0 max-w-[85%] space-y-3">
                <div className="rounded-2xl rounded-tl-sm fill px-3.5 py-3">
                  <RichText text={m.text} />
                  {/* Which brain answered. Useful when the key is missing and the offline base steps in. */}
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-ink-500">
                    <Sparkles size={10} aria-hidden="true" />
                    {m.reply?.fromModel ? t('answered_by_the_model') : t('answered_offline')}
                  </p>
                </div>
                {m.reply?.code && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-ink-500">{m.reply.code.caption}</p>
                    <CodeBlock source={m.reply.code.source} filename="hint.ino" />
                  </div>
                )}
                {m.reply?.question && (
                  <p className="flex items-start gap-2 rounded-xl border border-brand-200/70 bg-brand-100/50 px-3.5 py-2.5 text-sm font-medium text-brand-800">
                    <HelpCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {m.reply.question}
                  </p>
                )}
                {m.reply?.followUps && m.reply.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {m.reply.followUps.map((f) => (
                      <button key={f} onClick={() => ask(f)} className="rounded-full border edge fill-strong px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50">
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {pending && (
          <div className="flex gap-2.5" aria-live="polite">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 text-white">
              <Bot size={15} aria-hidden="true" />
            </span>
            <span className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm fill px-4 py-3.5">
              <span className="sr-only">{t('mentor_is_typing')}</span>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      <form
        className="flex items-end gap-2 border-t edge p-3"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ask(input)
            }
          }}
          rows={1}
          placeholder={t('ask_about_wiring_code_or_an_error')}
          aria-label={t('message_the_ai_mentor')}
          className={`${inputClass} max-h-32 min-h-11 flex-1 resize-none py-3`}
        />
        <Button type="submit" icon={Send} disabled={!input.trim() || pending} aria-label={t('send_message')}>
          <span className="hidden sm:inline">{t('ask')}</span>
        </Button>
      </form>
    </div>
  )
}
