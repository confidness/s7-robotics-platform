import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { useApp, useToast } from '../lib/store'
import { LESSONS } from '../lib/curriculum'
import { Button, Field, inputClass } from '../components/ui'
import { Logo } from '../components/Layout'
import ThemeToggle from '../components/ThemeToggle'
import LocaleToggle from '../components/LocaleToggle'
import { t } from '../i18n'
import { Mark } from '../components/Mark'

/** Set VITE_MENTOR_PIN in the deployment environment; the fallback only covers local runs. */
const MENTOR_PIN = import.meta.env.VITE_MENTOR_PIN ?? '48213705'
const PIN_LENGTH = 8

export default function Login({ register: startOnRegister }: { register?: boolean }) {
  const { login, register, state } = useApp()
  const toast = useToast()
  const navigate = useNavigate()

  const firstRun = state.users.length === 0
  const [mode, setMode] = useState<'login' | 'register'>(startOnRegister || firstRun ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'student' | 'mentor'>('student')
  const [pin, setPin] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = t('enter_a_valid_email_address')
    if (password.length < 6) next.password = t('use_at_least_6_characters')
    if (mode === 'register') {
      if (name.trim().length < 2) next.name = t('tell_us_your_name')
      if (role === 'mentor') {
        const entered = pin.trim()
        if (entered.length !== PIN_LENGTH) next.pin = t('the_mentor_pin_is_n_digits', { n: PIN_LENGTH })
        else if (entered !== MENTOR_PIN) next.pin = t('that_mentor_pin_is_not_right_ask_the_academy_lea')
      }
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    const result = mode === 'login' ? login(email, password) : register({ name, email, password, role })
    setBusy(false)

    if (!result.ok || !result.user) {
      setErrors({ form: result.error ?? t('something_went_wrong_try_again') })
      return
    }

    const user = result.user
    toast({
      title: t(mode === 'login' ? 'welcome_back_name' : 'account_created_name', { name: user.name.split(' ')[0] }),
      body: user.role === 'mentor' ? t('your_mentor_workspace_is_ready') : t('start_with_lesson_one_of_arduino_electronics_cod'),
      tone: 'success',
    })
    navigate(user.role === 'mentor' ? '/m' : '/', { replace: true })
  }

  const facts = [
    { value: state.courses.length, label: t('courses') },
    { value: LESSONS.length, label: t('lessons') },
    { value: state.achievements.length, label: t('achievements') },
  ]

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1fr_minmax(26rem,32rem)]">
      {/* story side — one claim, three numbers, nothing else */}
      <section className="relative hidden flex-col justify-center px-12 py-16 lg:flex xl:px-20">
        <Logo />
        <h1 className="mt-14 flex min-h-[19rem] max-w-xl flex-col justify-start text-[46px] leading-[1.05] font-bold tracking-[-0.035em] text-ink-900 xl:text-[58px]">{t('one_platform_from_first_led')}<span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">{t('to_national_final')}</span>
        </h1>
        <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-600">
          {t('lessons_projects_mentor_review_and_progress_in_o')}
        </p>

        <dl className="mt-12 flex gap-10">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="sr-only">{fact.label}</dt>
              <dd>
                <span className="block text-[32px] leading-none font-bold tracking-[-0.03em] text-ink-900 tabular-nums">{fact.value}</span>
                <span className="mt-1.5 block text-sm text-ink-500">{fact.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* form side */}
      <section className="flex min-h-screen flex-col px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex shrink-0 items-center justify-end gap-2">
          <LocaleToggle compact />
          <ThemeToggle compact />
        </div>

        <div className="flex flex-1 items-center justify-center py-6">
        <div className="card specular relative w-full max-w-md p-6 sm:p-8">
          <div className="relative mb-7 lg:hidden">
            <span className="inline-flex items-center gap-2.5">
              <Mark size={40} className="rounded-full" />
              <span className="text-lg font-bold tracking-[-0.02em] text-ink-900">{t('s7_robotics')}</span>
            </span>
          </div>

          <h2 className="relative text-[26px] font-bold tracking-[-0.03em] text-ink-900">
            {mode === 'login' ? t('sign_in') : firstRun ? t('create_the_first_account') : t('create_your_account')}
          </h2>
          <p className="relative mt-1.5 text-sm text-ink-500">
            {mode === 'login'
              ? t('use_the_email_and_password_you_registered_with')
              : firstRun
                ? t('nobody_has_signed_up_yet_whoever_registers_first')
                : t('students_begin_with_arduino_electronics_code')}
          </p>

          <div className="chrome relative mt-6 mb-6 inline-flex w-full rounded-full p-1" role="tablist">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m)
                  setErrors({})
                }}
                className={`relative flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === m ? 'fill-strong text-ink-900 shadow-[0_1px_2px_rgb(11_18_32/0.12)]' : 'text-ink-600'
                }`}
              >
                {m === 'login' ? t('sign_in') : t('register')}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} noValidate className="relative space-y-4">
            {mode === 'register' && (
              <Field label={t('full_name')} required error={errors.name}>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('alikhan_sultanov')} autoComplete="name" />
              </Field>
            )}

            <Field label={t('email')} required error={errors.email}>
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('you_school_kz')} autoComplete="email" />
            </Field>

            <Field label={t('password')} required error={errors.password} hint={mode === 'register' ? t('at_least_6_characters') : undefined}>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Field>

            {mode === 'register' && (
              <>
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-ink-800">{t('i_am_joining_as')}</legend>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['student', 'mentor'] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => {
                          setRole(r)
                          setErrors((e) => ({ ...e, pin: '' }))
                        }}
                        aria-pressed={role === r}
                        className={`rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                          role === r ? 'bg-brand-100/80 text-brand-700 ring-2 ring-brand-400' : 'fill text-ink-600 ring-1 rim hover:fill-strong'
                        }`}
                      >
                        {t(r)}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {role === 'mentor' && (
                  <div className="animate-rise">
                    <Field label={t('mentor_pin')} required error={errors.pin} hint={t('mentor_accounts_are_gated_the_academy_lead_issue')}>
                      <span className="relative block">
                        <KeyRound size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                        <input
                          className={`${inputClass} pl-10 font-mono tracking-[0.22em]`}
                          type="password"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={PIN_LENGTH}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
                          placeholder={'•'.repeat(PIN_LENGTH)}
                        />
                      </span>
                    </Field>
                  </div>
                )}
              </>
            )}

            {errors.form && (
              <p role="alert" className="rounded-[14px] border border-rose-300/60 bg-rose-100/60 px-3.5 py-2.5 text-sm font-medium text-rose-700">
                {errors.form}
              </p>
            )}

            <Button type="submit" size="lg" loading={busy} iconRight={ArrowRight} className="w-full">
              {mode === 'login' ? t('sign_in') : t('create_account')}
            </Button>
          </form>

          <p className="relative mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <ShieldCheck size={13} aria-hidden="true" />
            {t('your_account_and_progress_stay_in_this_browser')}
          </p>
        </div>
        </div>
      </section>
    </div>
  )
}
