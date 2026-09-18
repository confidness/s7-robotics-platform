import { Bot, Bug, CircuitBoard, Code2, GraduationCap, Radar } from 'lucide-react'
import { useApp } from '../../lib/store'
import { currentLesson, profileOf } from '../../lib/selectors'
import AiMentorPanel from '../../components/AiMentorPanel'
import { Card, SectionHeading } from '../../components/ui'
import { t } from '../../i18n'

const TOPICS = [
  { icon: Code2, title: 'code', text: 'syntax_structure_why_a_compiler_error_points_at_' },
  { icon: CircuitBoard, title: 'electronics', text: 'voltage_current_pull_ups_grounds_and_what_shares' },
  { icon: Radar, title: 'sensors', text: 'how_a_reading_is_produced_where_it_fails_and_how' },
  { icon: Bug, title: 'debugging', text: 'a_method_for_isolating_the_fault_instead_of_chan' },
]

export default function AIMentor() {
  const { state, user } = useApp()
  if (!user) return null
  const profile = profileOf(state, user.id)!
  const lesson = currentLesson(state, user.id, profile.currentCourseId)
  const course = state.courses.find((c) => c.id === profile.currentCourseId)

  return (
    <div className="animate-rise space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[28px] font-bold tracking-[-0.03em] text-ink-900">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 text-white">
              <Bot size={20} aria-hidden="true" />
            </span>
            {t('ai_robotics_mentor')}
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">{t('available_whenever_your_mentor_is_not_it_explain')}</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <AiMentorPanel context={{ lessonTitle: lesson?.title, courseTitle: course?.title, studentName: user.name }} height="h-[30rem]" />

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHeading title={t('what_it_helps_with')} icon={GraduationCap} />
            <ul className="space-y-3.5">
              {TOPICS.map((topic) => (
                <li key={topic.title} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl fill text-ink-600">
                    <topic.icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">{t(topic.title)}</span>
                    <span className="block text-xs leading-relaxed text-ink-500">{t(topic.text)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-amber-200 bg-amber-50/60 p-5">
            <h3 className="text-sm font-bold text-amber-900">{t('what_it_will_not_do')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-800">
              {t('it_will_not_write_your_project_for_you_ask_for_t')}
            </p>
          </Card>

          {lesson && (
            <Card className="p-5">
              <SectionHeading title={t('current_context')} icon={Radar} />
              <p className="text-sm font-bold text-ink-900">{lesson.title}</p>
              <p className="mt-0.5 text-xs text-ink-500">{course?.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">{lesson.summary}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
