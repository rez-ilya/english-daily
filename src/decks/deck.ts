// Встроенная колода «ML & AI English». Содержимое генерирует anki-deck/build.py из anki-deck/terms.py,
// в базе хранится только прогресс повторений (хранилище deckProgress).
import raw from '../../decks/ml-ai.json'
import type { DeckProgressRecord } from '../db/db'

export interface DeckNote {
  id: string
  term: string
  ipa: string
  pos: string
  ru: string
  definition: string
  /** термин выделен **звёздочками** */
  example: string
  colloc: string[]
  note: string
  /** имя файла в public/decks/ml-ai/ или "" */
  img: string
  emoji: string
  category: string
  /** «o__________» — подсказка по первым буквам */
  hint: string
}

export interface Deck {
  id: string
  title: string
  notes: DeckNote[]
}

/** rec — «English → смысл», prod — «смысл → English» */
export type CardKind = 'rec' | 'prod'

export interface DeckCard {
  id: string
  note: DeckNote
  kind: CardKind
}

export const deck = raw as Deck

export const imageUrl = (n: DeckNote) => (n.img ? `decks/${deck.id}/${n.img}` : '')

/** Порядок изучения: для каждой записи сначала «узнать», потом «вспомнить». */
export const cards: DeckCard[] = deck.notes.flatMap((note) =>
  (['rec', 'prod'] as const).map((kind) => ({ id: `${note.id}:${kind}`, note, kind })),
)

const NEW_PER_DAY_KEY = 'english-daily:deck-new-per-day'
export const NEW_PER_DAY_OPTIONS = [5, 10, 15, 20]

export function getNewPerDay(): number {
  try {
    const v = Number(localStorage.getItem(NEW_PER_DAY_KEY))
    return NEW_PER_DAY_OPTIONS.includes(v) ? v : 10
  } catch {
    return 10
  }
}

export function setNewPerDay(v: number) {
  try {
    localStorage.setItem(NEW_PER_DAY_KEY, String(v))
  } catch {
    /* настройка просто не сохранится */
  }
}

export interface DeckQueue {
  /** карточки к показу по порядку */
  queue: DeckCard[]
  due: number
  newToday: number
  started: number
  /** в коробках 4–5: интервал от 8 дней */
  strong: number
}

/**
 * Очередь на сегодня: сначала повторения, потом новые (не больше лимита в день),
 * в конце — карточки, на которые сегодня ответили «не помню».
 * Карточка «вспомнить» становится доступна на следующий день после «узнать», чтобы не шли подряд.
 */
export function deckQueue(progress: DeckProgressRecord[], today: string, newPerDay: number): DeckQueue {
  const byId = new Map(progress.map((p) => [p.id, p]))
  const startOfToday = new Date(today + 'T00:00').getTime()

  const due = cards
    .filter((c) => {
      const p = byId.get(c.id)
      return p && p.due <= today
    })
    .map((c) => ({ c, p: byId.get(c.id)! }))
  const relearn = due.filter(({ p }) => (p.reviewedAt ?? 0) >= startOfToday).sort((a, b) => a.p.reviewedAt! - b.p.reviewedAt!)
  const reviews = due.filter(({ p }) => (p.reviewedAt ?? 0) < startOfToday).sort((a, b) => (a.p.reviewedAt ?? 0) - (b.p.reviewedAt ?? 0))

  const introducedToday = progress.filter((p) => p.introducedAt === today).length
  const slots = Math.max(0, newPerDay - introducedToday)
  const fresh: DeckCard[] = []
  for (const c of cards) {
    if (fresh.length >= slots) break
    if (byId.has(c.id)) continue
    if (c.kind === 'prod') {
      const rec = byId.get(`${c.note.id}:rec`)
      if (!rec || rec.introducedAt >= today) continue
    }
    fresh.push(c)
  }

  return {
    queue: [...reviews.map((x) => x.c), ...fresh, ...relearn.map((x) => x.c)],
    due: due.length,
    newToday: fresh.length,
    started: progress.length,
    strong: progress.filter((p) => p.box >= 3).length,
  }
}
