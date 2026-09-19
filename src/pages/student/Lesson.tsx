import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, ChevronRight, CircuitBoard, Code2, Cpu, FlaskConical, Info, Lightbulb, ListChecks, Lock, PlayCircle,
  RotateCcw, Send, Sparkles, Target, Trophy, Wand2, Zap,
} from 'lucide-react'
import { useApp, useToast } from '../../lib/store'
import { isLessonUnlocked, nextLessonAfter, profileOf } from '../../lib/selectors'
import { lessonsForCourse, modulesForCourse } from '../../lib/curriculum'
import { runChecks, type CheckReport } from '../../lib/codecheck'
import { Badge, Button, Card, EmptyState, Modal, ProgressBar, SectionHeading, Tabs, btn, STATUS_LABEL, STATUS_TONE } from '../../components/ui'
import { CodeBlock, CodeEditor } from '../../components/code'
import { ComponentCard, VirtualLab, WiringDiagram, WiringTable } from '../../components/lesson-parts'
import ProjectSubmitModal from '../../components/ProjectSubmitModal'
import AiMentorPanel from '../../components/AiMentorPanel'
import NotFound from '../NotFound'
import { t } from '../../i18n'
import { localizeDifficulty } from '../../i18n/content'

type Section = 'theory' | 'components' | 'wiring' | 'code' | 'task' | 'challenge'
const ORDER: Section[] = ['theory', 'components', 'wiring', 'code', 'task', 'challenge']

const CALLOUT = {
  info: { icon: Info, class: 'border-brand-200/70 bg-brand-100/50 text-brand-800' },
  tip: { icon: Lightbulb, class: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  warning: { icon: AlertTriangle, class: 'border-amber-200 bg-amber-50 text-amber-900' },
}

/** Keyed on the lesson id so editor content, checks and section reset when the student moves on. */
export default function LessonRoute() {
  const { lessonId } = useParams()
  return <LessonPage key={lessonId} />
}

function LessonPage() {
  const { courseId, lessonId } = useParams()
  const { state, user, completeChallenge, completeLesson, codeCheckPassed } = useApp()
  const toast = useToast()
  const navigate = useNavigate()

  const [section, setSection] = useState<Section>('theory')
  const [checked, setChecked] = useState<string[]>([])
  const [report, setReport] = useState<CheckReport | null>(null)
  const [running, setRunning] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(0)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const lesson = state.lessons.find((l) => l.id === lessonId && l.courseId === courseId)
  const [code, setCode] = useState(lesson?.code.starter ?? lesson?.code.source ?? '')

  const course = state.courses.find((c) => c.id === courseId)
  const profile = user ? profileOf(state, user.id) : undefined
  const project = useMemo(() => state.projects.find((p) => p.lessonId === lessonId && p.authorId === user?.id), [state.projects, lessonId, user])

  if (!lesson || !course || !user || !profile) return <NotFound />

  if (!isLessonUnlocked(state, user.id, lesson.id)) {
    return (
      <div className="animate-rise mx-auto max-w-lg py-10">
        <EmptyState
          icon={Lock}
          title={t('this_lesson_is_still_locked')}
          body={t('finish_the_lessons_before_it_in_the_course_and_t')}
          action={
            <Link to={`/courses/${course.id}`} className={btn('primary')}>
              {t('back_to_the_course')}
            </Link>
          }
        />
      </div>
    )
  }

  const lessons = lessonsForCourse(course.id)
  const index = lessons.findIndex((l) => l.id === lesson.id)
  const module = modulesForCourse(course.id).find((m) => m.id === lesson.moduleId)
  const lessonDone = profile.completedLessonIds.includes(lesson.id)
  const challengeDone = profile.completedChallengeIds.includes(lesson.challenge.id)
  const next = nextLessonAfter(state, lesson.id)
  const sectionIndex = ORDER.indexOf(section)
  const allRequirementsChecked = checked.length === lesson.task.requirements.length

  function runCodeCheck() {
    setRunning(true)
    // The check is instant; the pause is the compile/upload beat the student expects to see.
    setTimeout(() => {
      const result = runChecks(code, lesson!.checks)
      setReport(result)
      setRunning(false)
      if (result.failed.length === 0) {
        codeCheckPassed()
        toast({ title: t('all_checks_passed'), body: t('requirements_met', { n: result.passed.length, total: result.passed.length }), tone: 'success' })
      } else {
        toast({ title: t('checks_passed_count', { n: result.passed.length, total: result.passed.length + result.failed.length }), body: t('open_the_report_below_to_see_what_is_missing'), tone: 'info' })
      }
    }, 700)
  }

  function finishLesson() {
    completeLesson(lesson!.id)
    toast({ title: t('lesson_complete'), body: next ? t('lesson_complete_body', { xp: lesson!.xp, title: next.title }) : t('lesson_complete_body_last', { xp: lesson!.xp }), tone: 'success' })
    if (next) navigate(`/learn/${course!.id}/${next.id}`)
    else navigate(`/courses/${course!.id}`)
  }

  /** One primary action per screen — what it is depends on where the student stands. */
  const primary = (() => {
    if (lessonDone) return next ? { label: t('next_lesson'), onClick: () => navigate(`/learn/${course.id}/${next.id}`), icon: ArrowRight } : { label: t('back_to_course'), onClick: () => navigate(`/courses/${course.id}`), icon: ArrowRight }
    if (lesson.requiresProject) {
      if (!project) return { label: t('submit_project'), onClick: () => setSubmitOpen(true), icon: Send }
      if (project.status === 'needs_changes') return { label: t('resubmit_project'), onClick: () => setSubmitOpen(true), icon: Send }
      if (project.status === 'draft') return { label: t('finish_and_submit'), onClick: () => setSubmitOpen(true), icon: Send }
      return { label: t('waiting_for_mentor_review'), onClick: () => navigate(`/projects/${project.id}`), icon: ChevronRight }
    }
    return { label: t('complete_lesson'), onClick: finishLesson, icon: CheckCircle2 }
  })()

  return (
    <div className="animate-rise space-y-5 pb-20 lg:pb-0">
      {/* breadcrumb */}
      <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
        <Link to="/courses" className="transition hover:text-ink-900">
          {t('courses')}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link to={`/courses/${course.id}`} className="transition hover:text-ink-900">
          {course.title}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span className="font-semibold text-ink-800">{lesson.title}</span>
      </nav>

      {/* lesson header */}
      <Card className="overflow-hidden">
        <div className="tint-blue specular relative p-5 sm:p-6">
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="cyan">
                  {t('lesson_n_of_total', { n: index + 1, total: lessons.length })}
                </Badge>
                <Badge tone="neutral">{module?.title}</Badge>
                <Badge tone={lesson.difficulty === 'Beginner' ? 'success' : lesson.difficulty === 'Intermediate' ? 'warning' : 'danger'}>{localizeDifficulty(lesson.difficulty)}</Badge>
                {lessonDone && (
                  <Badge tone="success" icon={CheckCircle2}>
                    {t('completed')}
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-[26px] leading-tight font-bold tracking-[-0.03em] text-ink-900 sm:text-[32px]">{lesson.title}</h1>
              <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink-600">{lesson.summary}</p>

              <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {lesson.objectives.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm text-ink-700">
                    <Target size={14} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            <dl className="grid shrink-0 grid-cols-3 gap-3 lg:grid-cols-1">
              {[
                { label: t('time'), value: t('minutes_short', { n: lesson.minutes }) },
                { label: t('lesson_xp'), value: lesson.xp },
                { label: t('project_xp'), value: lesson.task.xp },
              ].map((s) => (
                <div key={s.label} className="rounded-[14px] fill px-3.5 py-2.5 ring-1 rim">
                  <dt className="text-[11px] text-ink-500">{s.label}</dt>
                  <dd className="text-base font-bold text-ink-900 tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-500">
              <span>
                {t('section_n_of_total_name', { n: sectionIndex + 1, total: ORDER.length, name: t(section) })}
              </span>
              <span className="tabular-nums">{Math.round(((sectionIndex + 1) / ORDER.length) * 100)}%</span>
            </div>
            <ProgressBar value={((sectionIndex + 1) / ORDER.length) * 100} size="sm" tone="brand" label={t('lesson_section_progress')} />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={section}
          onChange={setSection}
          className="flex-1"
          tabs={[
            { id: 'theory', label: t('theory'), icon: Sparkles },
            { id: 'components', label: t('components'), icon: Cpu },
            { id: 'wiring', label: t('wiring'), icon: CircuitBoard },
            { id: 'code', label: t('code'), icon: Code2 },
            { id: 'task', label: t('task'), icon: ListChecks },
            { id: 'challenge', label: t('challenge'), icon: Trophy },
          ]}
        />
        <Button variant="secondary" icon={Bot} onClick={() => setAiOpen(true)} className="shrink-0">
          <span className="hidden sm:inline">{t('ask_ai_mentor')}</span>
        </Button>
      </div>

      {/* ------------------------------------------------------------ theory */}
      {section === 'theory' && (
        <div className="space-y-4">
          {lesson.theory.map((block, i) => {
            const callout = block.callout ? CALLOUT[block.callout.kind] : null
            return (
              <Card key={block.id} className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-gradient-to-b from-brand-400 to-accent-500 text-white text-sm font-bold">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-ink-900">{block.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{block.body}</p>

                    {block.formula && (
                      <p className="mt-4 code-surface rounded-[16px] px-4 py-3.5 text-center font-mono text-sm text-cyan-200">{block.formula}</p>
                    )}

                    {block.callout && callout && (
                      <p className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${callout.class}`}>
                        <callout.icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {block.callout.text}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ------------------------------------------------------------ components */}
      {section === 'components' && (
        <Card className="p-5 sm:p-6">
          <SectionHeading title={t('what_you_need')} subtitle={t('parts_for_this_build', { n: lesson.components.length })} icon={Cpu} />
          {lesson.components.length === 0 ? (
            <EmptyState icon={Cpu} title={t('no_hardware_for_this_lesson')} body={t('this_one_runs_entirely_in_code_no_parts_to_colle')} />
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2">
              {lesson.components.map((c) => (
                <ComponentCard key={c.id} component={c} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ------------------------------------------------------------ wiring */}
      {section === 'wiring' && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b edge px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
                <CircuitBoard size={17} className="text-brand-600" aria-hidden="true" />{t('wiring_scheme')}</h3>
              <p className="mt-1 text-sm text-ink-600">{lesson.wiring.description}</p>
            </div>
            <div className="p-3 sm:p-5">
              <WiringDiagram rows={lesson.wiring.rows} />
            </div>
          </Card>

          {lesson.wiring.rows.length > 0 && (
            <Card className="p-5 sm:p-6">
              <SectionHeading title={t('connection_list')} subtitle={t('check_each_one_off_as_you_build')} icon={ListChecks} />
              <WiringTable rows={lesson.wiring.rows} />
            </Card>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ code */}
      {section === 'code' && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('code_editor')} subtitle={t('write_your_sketch_then_run_the_automatic_check')} icon={Code2} />
            <CodeEditor
              value={code}
              onChange={setCode}
              filename={lesson.code.filename}
              actions={
                <>
                  <button
                    onClick={() => {
                      setCode(lesson.code.source)
                      setReport(null)
                      toast({ title: t('worked_example_loaded'), body: t('read_it_then_make_it_yours_the_mentor_will_ask_h'), tone: 'info' })
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Wand2 size={13} aria-hidden="true" />{t('example')}</button>
                  <button
                    onClick={() => {
                      setCode(lesson.code.starter ?? lesson.code.source)
                      setReport(null)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw size={13} aria-hidden="true" /> {t('reset')}
                  </button>
                </>
              }
            />

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Button icon={PlayCircle} onClick={runCodeCheck} loading={running}>
                {t('run_auto_code_check')}
              </Button>
              <Button variant="secondary" icon={Bot} onClick={() => setAiOpen(true)}>
                {t('explain_this_to_me')}
              </Button>
              {report && (
                <span className="ml-auto text-sm font-semibold text-ink-600 tabular-nums">{t('score')}<span className={report.score === 100 ? 'text-emerald-600' : 'text-amber-600'}>{report.score}%</span>
                </span>
              )}
            </div>

            {report && (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
                      <CheckCircle2 size={15} aria-hidden="true" /> {t('passed_n', { n: report.passed.length })}
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {report.passed.map((c) => (
                        <li key={c.id} className="flex items-start gap-2 text-sm text-emerald-900">
                          <Check size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                          {t(c.label)}
                        </li>
                      ))}
                      {report.passed.length === 0 && <li className="text-sm text-emerald-900/70">{t('nothing_yet_start_with_serial_begin')}</li>}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-rose-800">
                      <AlertTriangle size={15} aria-hidden="true" /> {t('checks_missing_n', { n: report.failed.length })}
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {report.failed.map((c) => (
                        <li key={c.id} className="text-sm text-rose-900">
                          <span className="font-semibold">{t(c.label)}</span> — {t(c.detail)}
                        </li>
                      ))}
                      {report.failed.length === 0 && <li className="text-sm text-rose-900/70">{t('nothing_missing_well_done')}</li>}
                    </ul>
                  </div>
                </div>

                {report.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
                      <AlertTriangle size={15} aria-hidden="true" /> {t('warnings_n', { n: report.warnings.length })}
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {report.warnings.map((w) => (
                        <li key={w.label} className="text-sm text-amber-900">
                          <span className="font-semibold">{t(w.label)}</span> — {t(w.detail)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.suggestions.length > 0 && (
                  <div className="rounded-xl border border-brand-200/70 bg-brand-100/50/60 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-brand-800">
                      <Lightbulb size={15} aria-hidden="true" />{t('suggestions')}</p>
                    <ul className="mt-2.5 list-inside list-disc space-y-1 text-sm text-brand-800">
                      {report.suggestions.map((s) => (
                        <li key={s}>{s.includes('|') ? `${t(s.split('|')[0])}: ${t(s.split('|')[1])}` : t(s)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title={t('reference_sketch')} subtitle={t('how_the_worked_example_is_put_together')} icon={Sparkles} />
            <CodeBlock source={lesson.code.source} filename={lesson.code.filename} />
            <ul className="mt-4 space-y-2">
              {lesson.code.explain.map((e) => (
                <li key={e} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <ChevronRight size={15} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
                  {e}
                </li>
              ))}
            </ul>
          </Card>

          {lesson.components.some((c) => c.id === 'hc-sr04') && (
            <div>
              <SectionHeading title={t('virtual_lab')} subtitle={t('try_the_behaviour_before_you_have_the_hardware_i')} icon={FlaskConical} />
              <VirtualLab />
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ task */}
      {section === 'task' && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent" icon={ListChecks}>
                {t('task')}
              </Badge>
              <Badge tone="warning" icon={Zap}>
                {t('xp_on_approval', { n: lesson.task.xp })}
              </Badge>
            </div>
            <h3 className="mt-3 text-[22px] font-bold tracking-[-0.025em] text-ink-900">{lesson.task.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{lesson.task.brief}</p>

            <h4 className="mt-6 text-sm font-bold text-ink-900">{t('requirements')}</h4>
            <ul className="mt-2.5 space-y-2">
              {lesson.task.requirements.map((r) => {
                const on = checked.includes(r)
                return (
                  <li key={r}>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${on ? 'border-emerald-200 bg-emerald-50/60' : 'edge fill-strong hover:border-ink-300'}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setChecked((c) => (on ? c.filter((x) => x !== r) : [...c, r]))}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 accent-emerald-600"
                      />
                      <span className={`text-sm ${on ? 'text-emerald-900 line-through decoration-emerald-400' : 'text-ink-700'}`}>{r}</span>
                    </label>
                  </li>
                )
              })}
            </ul>

            <div className="mt-5">
              <ProgressBar value={(checked.length / lesson.task.requirements.length) * 100} tone="success" label={t('requirements_checked')} />
              <p className="mt-2 text-xs text-ink-500 tabular-nums">
                {t('n_of_total_requirements_ready', { n: checked.length, total: lesson.task.requirements.length })}
              </p>
            </div>
          </Card>

          <Card className="flex flex-col p-5 sm:p-6">
            <SectionHeading title={t('submit_your_project')} subtitle={t('a_mentor_reviews_it_and_awards_the_xp')} icon={Send} />
            {project ? (
              <div className="space-y-3">
                <div className="rounded-xl border edge fill p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-ink-900">{project.title}</p>
                    <Badge tone={STATUS_TONE[project.status]}>{t(STATUS_LABEL[project.status])}</Badge>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-600">{project.description}</p>
                </div>
                {project.feedback.length > 0 && (
                  <div className="rounded-xl border border-brand-200/70 bg-brand-100/50 p-4">
                    <p className="text-xs font-bold text-brand-800">{t('mentor_feedback')}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-800">{project.feedback[project.feedback.length - 1].message}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link to={`/projects/${project.id}`} className={btn('secondary', 'sm')}>
                    {t('open_project')}
                  </Link>
                  {(project.status === 'needs_changes' || project.status === 'draft') && (
                    <Button size="sm" icon={Send} onClick={() => setSubmitOpen(true)}>
                      {project.status === 'draft' ? t('finish_and_submit') : t('resubmit')}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="flex-1 text-sm leading-relaxed text-ink-600">
                  {t('upload_a_photo_of_your_build_paste_the_code_you_')}
                </p>
                <Button size="lg" icon={Send} className="mt-4 w-full" onClick={() => setSubmitOpen(true)}>
                  {t('submit_project')}
                </Button>
                <p className="mt-2 text-center text-xs text-ink-500">
                  {allRequirementsChecked ? t('every_requirement_is_ticked_you_are_ready') : t('n_requirements_unticked', { n: lesson.task.requirements.length - checked.length })}
                </p>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------ challenge */}
      {section === 'challenge' && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-accent-600 to-brand-700 p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
                <Trophy size={12} aria-hidden="true" />{t('challenge')}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
                <Zap size={12} aria-hidden="true" /> +{lesson.challenge.xp} XP
              </span>
              {challengeDone && (
                <span className="inline-flex items-center gap-1.5 rounded-full fill-strong px-2.5 py-1 text-xs font-bold text-accent-700">
                  <CheckCircle2 size={12} aria-hidden="true" />{t('completed')}</span>
              )}
            </div>
            <h3 className="mt-3 text-xl font-bold tracking-[-0.03em] sm:text-2xl">{lesson.challenge.title}</h3>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/90">{lesson.challenge.brief}</p>
          </div>

          <div className="p-5 sm:p-6">
            <SectionHeading title={t('hints')} subtitle={t('reveal_them_one_at_a_time_try_first')} icon={Lightbulb} />
            <ul className="space-y-2.5">
              {lesson.challenge.hints.map((hint, i) => (
                <li key={hint}>
                  {i < hintsOpen ? (
                    <p className="animate-rise rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{hint}</p>
                  ) : i === hintsOpen ? (
                    <button onClick={() => setHintsOpen(i + 1)} className="w-full rounded-xl border border-dashed edge px-4 py-3 text-sm font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-700">
                      {t('reveal_hint_n', { n: i + 1, total: lesson.challenge.hints.length })}
                    </button>
                  ) : (
                    <p className="rounded-xl border border-dashed edge px-4 py-3 text-sm text-ink-400">{t('hint_n_locked', { n: i + 1 })}</p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t edge pt-5">
              <Button
                icon={CheckCircle2}
                variant={challengeDone ? 'secondary' : 'success'}
                disabled={challengeDone}
                onClick={() => {
                  completeChallenge(lesson.id)
                  toast({ title: t('challenge_complete'), body: t('xp_added_to_your_total', { n: lesson.challenge.xp }), tone: 'success' })
                }}
              >
                {challengeDone ? t('challenge_completed') : t('mark_challenge_as_complete')}
              </Button>
              <Button variant="ghost" icon={Bot} onClick={() => setAiOpen(true)}>
                {t('ask_for_a_hint')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------ footer nav */}
      <div className="chrome specular sticky bottom-24 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[22px] p-3 lg:bottom-4">
        <div className="relative flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={ArrowLeft} disabled={sectionIndex === 0} onClick={() => setSection(ORDER[sectionIndex - 1])}>
            <span className="hidden sm:inline">{t('back')}</span>
          </Button>
          <Button variant="secondary" size="sm" iconRight={ArrowRight} disabled={sectionIndex === ORDER.length - 1} onClick={() => setSection(ORDER[sectionIndex + 1])}>
            {t('next_section')}
          </Button>
        </div>

        <Button size="md" icon={primary.icon} onClick={primary.onClick} disabled={lesson.requiresProject && !!project && ['submitted', 'under_review'].includes(project.status)}>
          {primary.label}
        </Button>
      </div>

      {/* mounted on demand so the form always opens with the current editor contents */}
      {submitOpen && <ProjectSubmitModal open onClose={() => setSubmitOpen(false)} lesson={lesson} existing={project} initialCode={code} onSubmitted={() => setSection('task')} />}

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} wide title={t('ai_robotics_mentor')} subtitle={t('context_lesson', { title: lesson.title })}>
        <AiMentorPanel context={{ lessonTitle: lesson.title, courseTitle: course.title, studentName: user.name, code }} height="h-[24rem]" />
      </Modal>
    </div>
  )
}
