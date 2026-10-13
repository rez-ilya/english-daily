// Простое интервальное повторение по системе Лейтнера: 5 коробок.
// «Помню» — фраза переходит в следующую коробку и вернётся через 1/2/4/8/16 дней.
// «Не помню» — фраза возвращается в первую коробку и снова показывается сегодня, в конце очереди.
import type { PhraseRecord } from '../db/db'
import { addDays } from './date'

export const BOXES = 5
export const INTERVAL_DAYS = [1, 2, 4, 8, 16]

/** Состояние повторения — общее для своих фраз и карточек встроенной колоды. */
export interface SrsState {
  box: number
  due: string
  reviewedAt?: number
}

export function review<T extends SrsState>(p: T, remembered: boolean, today: string): T {
  const now = Date.now()
  if (!remembered) return { ...p, box: 0, due: today, reviewedAt: now }
  return { ...p, box: Math.min(p.box + 1, BOXES - 1), due: addDays(today, INTERVAL_DAYS[p.box]), reviewedAt: now }
}

/** Фразы на сегодня: сначала давно не повторявшиеся. */
export const dueToday = (all: PhraseRecord[], today: string) =>
  all.filter((p) => p.due <= today).sort((a, b) => (a.reviewedAt ?? 0) - (b.reviewedAt ?? 0) || a.createdAt - b.createdAt)

const csvCell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)

/** CSV для импорта в Anki: фраза, перевод, пример. Строки с # Anki понимает как настройки импорта. */
export function toAnkiCsv(items: PhraseRecord[]): string {
  const lines = ['#separator:comma', '#html:false', ...items.map((p) => [p.phrase, p.translation, p.example].map(csvCell).join(','))]
  return lines.join('\n') + '\n'
}
