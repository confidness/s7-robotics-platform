/**
 * Static checker for lesson code. Labels, details and tips are dictionary keys, not sentences,
 * so a report renders in whatever language is active rather than the one it was produced in.
 * A suggestion built from a failed rule is `labelKey|detailKey`; the UI joins the two. It does not run the sketch — it reads it, the way a
 * mentor scans a submission before plugging the board in. Rules are per-lesson (`Lesson.checks`).
 */

export interface CheckResult {
  id: string
  label: string
  detail: string
  passed: boolean
}
export interface CheckReport {
  passed: CheckResult[]
  failed: CheckResult[]
  warnings: { label: string; detail: string }[]
  suggestions: string[]
  score: number
}

const strip = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

const RULES: Record<string, { label: string; detail: string; test: (code: string, raw: string) => boolean }> = {
  serial: {
    label: 'check_serial',
    detail: 'check_serial_detail',
    test: (c) => /Serial\s*\.\s*begin\s*\(/.test(c) && /Serial\s*\.\s*print(ln)?\s*\(/.test(c),
  },
  loop: {
    label: 'check_loop',
    detail: 'check_loop_detail',
    test: (c) => /void\s+loop\s*\(\s*\)\s*\{[\s\S]{20,}\}/.test(c) || /while\s+True\s*:/.test(c) || /for\s+\w+\s+in\s+/.test(c),
  },
  pinmode: {
    label: 'check_pinmode',
    detail: 'check_pinmode_detail',
    test: (c) => /pinMode\s*\(/.test(c),
  },
  analog: {
    label: 'check_analog',
    detail: 'check_analog_detail',
    test: (c) => /analogRead\s*\(/.test(c),
  },
  'trig-pin': {
    label: 'check_trig_pin',
    detail: 'check_trig_pin_detail',
    test: (c) => /TRIG\w*\s*(=|\s)\s*9\b/i.test(c) || /digitalWrite\s*\(\s*9\s*,/.test(c),
  },
  'echo-pin': {
    label: 'check_echo_pin',
    detail: 'check_echo_pin_detail',
    test: (c) => /ECHO\w*\s*(=|\s)\s*10\b/i.test(c) || /pulseIn\s*\(\s*10\s*,/.test(c),
  },
  pulsein: {
    label: 'check_pulsein',
    detail: 'check_pulsein_detail',
    test: (c) => /pulseIn\s*\(/.test(c),
  },
  'distance-math': {
    label: 'check_distance_math',
    detail: 'check_distance_math_detail',
    test: (c) => /(0\.034|0,034|343|29\.1|58(\.2)?)/.test(c) && /(\/\s*2|\*\s*0\.5|\/2)/.test(c),
  },
  threshold: {
    label: 'check_threshold',
    detail: 'check_threshold_detail',
    test: (c) => /(if\s*\([^)]*[<>]=?\s*\d+|[<>]=?\s*\d+\s*\?)/.test(c) && /(digitalWrite|analogWrite|tone)\s*\(/.test(c),
  },
}

export function runChecks(code: string, checkIds: string[]): CheckReport {
  const clean = strip(code)
  const results: CheckResult[] = checkIds
    .filter((id) => RULES[id])
    .map((id) => ({ id, label: RULES[id].label, detail: RULES[id].detail, passed: RULES[id].test(clean, code) }))

  const warnings: CheckReport['warnings'] = []
  if (/pulseIn\s*\([^)]*\)/.test(clean) && !/pulseIn\s*\([^)]*,[^)]*,[^)]*\)/.test(clean)) {
    warnings.push({ label: 'warn_pulsein_timeout', detail: 'warn_pulsein_timeout_detail' })
  }
  if (/delay\s*\(\s*([5-9]\d{2,}|\d{4,})\s*\)/.test(clean)) {
    warnings.push({ label: 'warn_long_delay', detail: 'warn_long_delay_detail' })
  }
  if (/Serial\s*\.\s*print/.test(clean) && !/Serial\s*\.\s*begin/.test(clean)) {
    warnings.push({ label: 'warn_serial_no_begin', detail: 'warn_serial_no_begin_detail' })
  }
  if (/analogWrite\s*\(\s*(2|4|7|8|12|13)\s*,/.test(clean)) {
    warnings.push({ label: 'warn_analogwrite_pin', detail: 'warn_analogwrite_pin_detail' })
  }
  if (clean.trim().length > 200 && !/\/\/|\/\*/.test(code)) {
    warnings.push({ label: 'warn_no_comments', detail: 'warn_no_comments_detail' })
  }

  const suggestions: string[] = []
  const failed = results.filter((r) => !r.passed)
  for (const f of failed) suggestions.push(`${f.label}|${f.detail}`)
  if (results.every((r) => r.passed)) {
    suggestions.push('tip_all_pass')
    if (!/float|double/.test(clean) && /distance/i.test(clean)) suggestions.push('tip_use_float')
    if (!/(const|#define)/.test(clean)) suggestions.push('tip_const_pins')
  }

  const score = results.length ? Math.round((results.filter((r) => r.passed).length / results.length) * 100) : 0
  return { passed: results.filter((r) => r.passed), failed, warnings, suggestions, score }
}
