import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, LogOut, RefreshCw, Shield, User as UserIcon } from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { profileOf } from '../../lib/selectors'
import { Button, Card, Field, Modal, SectionHeading, inputClass } from '../../components/ui'
import { t, formatNumber } from '../../i18n'

export default function Settings() {
  const { state, user, setCurrentCourse, resetDemo, logout } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  if (!user) return null

  const profile = profileOf(state, user.id)!

  return (
    <div className="animate-rise max-w-3xl space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('settings')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('your_account_the_track_you_are_following_and_you')}</p>
      </header>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('account')} icon={UserIcon} />
        <dl className="space-y-3 text-sm">
          {[
            { label: t('name'), value: user.name },
            { label: t('email'), value: user.email },
            { label: t('role'), value: t(user.role) },
            { label: t('level_xp'), value: formatNumber(profile.xp) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 border-b edge pb-3">
              <dt className="text-ink-500">{row.label}</dt>
              <dd className="truncate font-semibold text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/profile')}>
          {t('edit_profile_details')}
        </Button>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('current_track')} subtitle={t('the_course_your_dashboard_follows')} icon={BookOpen} />
        <Field label={t('active_course')}>
          <select
            className={inputClass}
            value={profile.currentCourseId}
            onChange={(e) => {
              setCurrentCourse(e.target.value)
              toast({ title: t('track_changed'), body: state.courses.find((c) => c.id === e.target.value)?.title, tone: 'success' })
            }}
          >
            {state.courses
              .filter((c) => profile.enrolledCourseIds.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        </Field>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('your_data')} subtitle={t('everything_you_do_is_stored_in_this_browser_only')} icon={Shield} />
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" icon={RefreshCw} onClick={() => setConfirmReset(true)}>
            {t('erase_my_data')}
          </Button>
          <Button
            variant="danger"
            icon={LogOut}
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            {t('sign_out')}
          </Button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-500">
          {t('erasing_removes_every_account_project_and_xp_rec')}
        </p>
      </Card>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t('erase_everything_in_this_browser')}
        subtitle={t('accounts_projects_and_progress_stored_here_will_')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              {t('keep_my_data')}
            </Button>
            <Button
              variant="danger"
              icon={RefreshCw}
              onClick={() => {
                resetDemo()
                setConfirmReset(false)
                navigate('/login')
                toast({ title: t('data_erased'), body: t('the_platform_is_back_to_a_clean_install'), tone: 'info' })
              }}
            >
              {t('erase_everything')}
            </Button>
          </>
        }
      >
        <p className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('this_cannot_be_undone_and_it_affects_every_accou')}
        </p>
      </Modal>
    </div>
  )
}
