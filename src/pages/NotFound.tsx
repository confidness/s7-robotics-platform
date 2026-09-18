import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'
import { useApp } from '../lib/store'
import { btn } from '../components/ui'
import { t } from '../i18n'

export default function NotFound() {
  const { user } = useApp()
  const home = user ? (user.role === 'mentor' ? '/m' : '/') : '/login'

  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-b from-brand-400 to-accent-500 text-white shadow-[0_14px_30px_-14px_rgb(47_107_240/0.9)]">
          <Compass size={28} aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-[32px] font-bold tracking-[-0.03em] text-ink-900">{t('nothing_at_this_address')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          {t('the_page_you_asked_for_does_not_exist_or_the_ite')}
        </p>
        <Link to={home} className={btn('primary', 'lg', 'mt-6')}>
          <Home size={17} aria-hidden="true" />
          {t('back_to_dashboard')}
        </Link>
      </div>
    </div>
  )
}
