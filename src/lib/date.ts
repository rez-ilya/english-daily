// Все даты в приложении — строки 'YYYY-MM-DD' в локальном часовом поясе.

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = () => toISO(new Date())

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

const longFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
const dayMonthFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

/** «понедельник, 12 октября» */
export const formatLong = (iso: string) => longFmt.format(parseISO(iso))
/** «12 октября» */
export const formatDayMonth = (iso: string) => dayMonthFmt.format(parseISO(iso))
/** «12.10» */
export const formatShort = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`

/** plural(3, ['день', 'дня', 'дней']) → 'дня' */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}
