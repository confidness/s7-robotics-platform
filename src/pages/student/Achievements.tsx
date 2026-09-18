import { BadgeCheck, Bot, Code2, Flame, Layers, Lock, MessageSquareHeart, Radar, Rocket, Target, Trophy, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Achievement } from '../../lib/types'
import { useApp } from '../../lib/store'
import { profileOf, resolveVars } from '../../lib/selectors'
import { LEVELS, levelFor } from '../../lib/gamification'
import { Badge, Card, EmptyState, ProgressBar, Ring, SectionHeading, Tooltip } from '../../components/ui'
import { relativeTime } from '../../lib/hooks'
import { t, formatNumber } from '../../i18n'
import { localizeLevelBlurb, localizeLevelName } from '../../i18n/content'

const ICONS: Record<string, LucideIcon> = { Bot, Rocket, Radar, Code2, Flame, BadgeCheck, Target, Layers, Trophy, MessageSquareHeart }

const TIER_RING: Record<Achievement['tier'], string> = {
  bronze: 'from-amber-500 to-orange-600',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-400 to-amber-600',
}

export function AchievementBadge({ achievement, unlocked, compact }: { achievement: Achievement; unlocked: boolean; compact?: boolean }) {
  const Icon = ICONS[achievement.icon] ?? Trophy
  const body = (
    <div className={`flex flex-col items-center rounded-[18px] p-3 text-center transition ${unlocked ? 'fill ring-1 rim' : 'opacity-55 grayscale'}`}>
      <span className={`grid place-items-center rounded-[16px] bg-gradient-to-b text-white shadow-[0_8px_18px_-10px_rgb(11_18_32/0.8)] ${TIER_RING[achievement.tier]} ${compact ? 'h-11 w-11' : 'h-14 w-14'}`}>
        {unlocked ? <Icon size={compact ? 18 : 24} aria-hidden="true" /> : <Lock size={compact ? 16 : 20} aria-hidden="true" />}
      </span>
      <span className={`mt-2 font-bold text-ink-900 ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{achievement.name}</span>
      {!compact && <span className="mt-1 text-xs leading-relaxed text-ink-500">{unlocked ? achievement.description : achievement.hint}</span>}
      {!compact && (
        <span className="mt-2">
          <Badge tone={unlocked ? 'success' : 'neutral'}>+{achievement.xp} XP</Badge>
        </span>
      )}
    </div>
  )
  return compact ? <Tooltip label={t('achievement_tooltip', { name: achievement.name, text: unlocked ? achievement.description : achievement.hint })}>{body}</Tooltip> : body
}

export default function Achievements() {
  const { state, user } = useApp()
  if (!user) return null
  const profile = profileOf(state, user.id)!
  const lv = levelFor(profile.xp)
  const unlockedIds = new Set(profile.unlockedAchievementIds)
  const history = state.xp.filter((t) => t.userId === user.id).slice(0, 12)

  return (
    <div className="animate-rise space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink-900">{t('achievements_progress')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('experience_is_awarded_for_finished_lessons_compl')}</p>
      </header>

      <Card className="overflow-hidden">
        <div className="tint-violet specular relative flex flex-wrap items-center gap-6 p-6">
          <Ring value={lv.percent} size={96}>
            <span className="text-center">
              <span className="block text-xl leading-none font-bold text-ink-900">{lv.level.index}</span>
              <span className="block text-[11px] text-ink-500">{t('level')}</span>
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-500">{t('current_rank')}</p>
            <h2 className="text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink-900">{localizeLevelName(lv.level.name)}</h2>
            <p className="mt-1 text-sm text-ink-600">{localizeLevelBlurb(lv.level.name, lv.level.blurb)}</p>
            <div className="mt-4 max-w-md">
              <ProgressBar value={lv.percent} tone="amber" label={t('level_progress')} />
              <p className="mt-2 text-xs text-ink-600 tabular-nums">
                {lv.next ? t('xp_total_with_next', { xp: formatNumber(profile.xp), n: lv.xpToNext, level: localizeLevelName(lv.next.name) }) : t('xp_total', { xp: formatNumber(profile.xp) })}
              </p>
            </div>
          </div>
        </div>

        <ol className="grid gap-px fill-soft sm:grid-cols-3 lg:grid-cols-5">
          {LEVELS.map((l) => {
            const reached = profile.xp >= l.minXp
            return (
              <li key={l.index} className={`fill-strong p-4 ${reached ? '' : 'opacity-55'}`}>
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${reached ? 'bg-gradient-to-b from-brand-400 to-brand-600 text-white' : 'fill-strong text-ink-700 ring-1 rim'}`}>{l.index}</span>
                  <p className="text-sm font-bold text-ink-900">{localizeLevelName(l.name)}</p>
                </div>
                <p className="mt-1.5 text-xs text-ink-500">{formatNumber(l.minXp)} XP</p>
              </li>
            )
          })}
        </ol>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('badges')} subtitle={t('n_of_total_unlocked', { n: unlockedIds.size, total: state.achievements.length })} icon={Trophy} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {state.achievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} unlocked={unlockedIds.has(a.id)} />
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeading title={t('experience_history')} subtitle={t('where_your_xp_came_from')} icon={Zap} />
        {history.length === 0 ? (
          <EmptyState icon={Zap} title={t('no_experience_yet')} body={t('complete_a_lesson_or_a_challenge_and_the_first_e')} />
        ) : (
          <ul className="divide-y divider">
            {history.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200 ring-inset">
                  <Zap size={15} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{t(tx.reason, resolveVars(state, tx.vars))}</span>
                  <span className="block text-xs text-ink-500">{relativeTime(tx.createdAt)}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-emerald-600 tabular-nums">+{tx.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
