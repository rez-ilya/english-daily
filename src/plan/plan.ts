// Единственный источник учебных данных — english-plan.json в корне проекта.
// Здесь только типы и вспомогательные функции поверх него.
import raw from '../../english-plan.json'
import { parseISO } from '../lib/date'

export interface Material {
  type: string
  title: string
  url: string
}
export interface PlanDay {
  date: string
  weekday: string
  grammar: string
  speaking: string
  writing: string
  materials: Material[]
}
export interface PlanWeek {
  week: number
  theme: string
  speakingLength: string
  writingLength: string
  days: PlanDay[]
}
export interface Step {
  id: string
  name: string
  hint: string
}
export interface Criterion {
  id: string
  name: string
}
export interface Plan {
  title: string
  startDate: string
  endDate: string
  restDay: string
  dailySteps: Step[]
  ieltsCriteria: Criterion[]
  controlRecordings: string[]
  weeks: PlanWeek[]
}

export const plan = raw as unknown as Plan

export interface DayInfo extends PlanDay {
  week: PlanWeek
  /** порядковый номер учебного дня, 0..N-1 */
  index: number
  /** последний день недели в плане — день самооценки IELTS */
  isWeekReview: boolean
}

export const planDays: DayInfo[] = plan.weeks.flatMap((week) =>
  week.days.map((d, i) => ({ ...d, week, index: 0, isWeekReview: i === week.days.length - 1 })),
)
planDays.forEach((d, i) => (d.index = i))

const byDate = new Map(planDays.map((d) => [d.date, d]))

export const getPlanDay = (iso: string) => byDate.get(iso)

/** Минуты таймера берутся из подсказки шага: «10 мин · …» → 10, «5–10 мин · …» → 5. */
export function stepMinutes(step: Step): number {
  const m = step.hint.match(/\d+/)
  return m ? Number(m[0]) : 10
}

/** «80–100 слов» → {min:80,max:100}; «эссе 200 слов» → {min:200,max:200}; «на время» → null */
export function wordTarget(s: string): { min: number; max: number } | null {
  const nums = s.match(/\d+/g)?.map(Number)
  if (!nums?.length) return null
  return { min: nums[0], max: nums[1] ?? nums[0] }
}

/** Цель по словам для дня: если в задании дня указано «N слов» — берём её, иначе недельную. */
export function dayWordTarget(day: DayInfo): { min: number; max: number } | null {
  const m = day.writing.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*слов/)
  if (m) return { min: Number(m[1]), max: Number(m[2] ?? m[1]) }
  return wordTarget(day.week.writingLength)
}

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}
export const isRestDay = (iso: string) => parseISO(iso).getDay() === WEEKDAY_INDEX[plan.restDay]

export const isControlDate = (iso: string) => plan.controlRecordings.includes(iso)

export type ResolvedDay =
  | { kind: 'plan'; day: DayInfo }
  | { kind: 'before'; day: DayInfo }
  | { kind: 'after'; day: DayInfo }
  | { kind: 'rest'; prev?: DayInfo; next?: DayInfo }

/** Что показать для произвольной даты: учебный день, день отдыха или границы плана. */
export function resolveDay(iso: string): ResolvedDay {
  const day = getPlanDay(iso)
  if (day) return { kind: 'plan', day }
  const first = planDays[0]
  const last = planDays[planDays.length - 1]
  if (iso < first.date) return { kind: 'before', day: first }
  if (iso > last.date) return { kind: 'after', day: last }
  return {
    kind: 'rest',
    prev: [...planDays].reverse().find((d) => d.date < iso),
    next: planDays.find((d) => d.date > iso),
  }
}

/** Ближайший учебный день к дате (для экранов, которым нужна «тема дня»). */
export function nearestPlanDay(iso: string): DayInfo {
  const r = resolveDay(iso)
  if (r.kind === 'rest') return (r.next ?? r.prev)!
  return r.day
}
