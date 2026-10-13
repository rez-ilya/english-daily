import type { DayRecord } from '../db/db'
import { plan, planDays } from '../plan/plan'

/** День засчитывается в серию, если выполнен хотя бы один шаг. */
export const STREAK_MIN_STEPS = 1

export const stepsDone = (r?: DayRecord) => (r ? plan.dailySteps.filter((s) => r.steps[s.id]).length : 0)

export interface WeekStat {
  week: number
  label: string
  theme: string
  stepsPct: number
  fluency: number | null
  ielts: Record<string, number | null>
}

export interface Stats {
  streak: number
  fullDays: number
  totalDays: number
  stepsPct: number
  passedDays: number
  extraMinutes: number
  weeks: WeekStat[]
}

export function computeStats(records: DayRecord[], today: string): Stats {
  const byDate = new Map(records.map((r) => [r.date, r]))
  const stepsCount = plan.dailySteps.length

  // Серия: идём назад по учебным дням (воскресений среди них нет, поэтому они не прерывают серию).
  // Сегодняшний день без отметок серию ещё не обрывает.
  const passed = planDays.filter((d) => d.date <= today)
  let streak = 0
  for (let i = passed.length - 1; i >= 0; i--) {
    const done = stepsDone(byDate.get(passed[i].date))
    if (done >= STREAK_MIN_STEPS) streak++
    else if (passed[i].date === today) continue
    else break
  }

  const passedDone = passed.reduce((sum, d) => sum + stepsDone(byDate.get(d.date)), 0)

  const weeks: WeekStat[] = plan.weeks.map((w) => {
    const recs = w.days.map((d) => byDate.get(d.date))
    const done = recs.reduce((s, r) => s + stepsDone(r), 0)
    const fl = recs.map((r) => r?.fluency).filter((v): v is number => !!v)
    const review = recs[recs.length - 1]?.ielts
    return {
      week: w.week,
      label: `Н${w.week}`,
      theme: w.theme,
      stepsPct: Math.round((done / (w.days.length * stepsCount)) * 100),
      fluency: fl.length ? Math.round((fl.reduce((a, b) => a + b, 0) / fl.length) * 10) / 10 : null,
      ielts: Object.fromEntries(plan.ieltsCriteria.map((c) => [c.id, review?.[c.id] ?? null])),
    }
  })

  return {
    streak,
    fullDays: planDays.filter((d) => stepsDone(byDate.get(d.date)) === stepsCount).length,
    totalDays: planDays.length,
    stepsPct: passed.length ? Math.round((passedDone / (passed.length * stepsCount)) * 100) : 0,
    passedDays: passed.length,
    extraMinutes: records.reduce((s, r) => s + (r.extraMinutes ?? 0), 0),
    weeks,
  }
}
