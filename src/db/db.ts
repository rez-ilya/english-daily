// Локальная база в IndexedDB. Всё хранится только в этом браузере.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface DayRecord {
  date: string
  steps: Record<string, boolean>
  /** «как шла речь», 1–5 */
  fluency?: number
  extraMinutes?: number
  note?: string
  /** самооценка недели по критериям IELTS, 1–5 */
  ielts?: Record<string, number>
  updatedAt: number
}
export interface RecordingRecord {
  id: string
  date: string
  createdAt: number
  blob: Blob
  mimeType: string
  durationSec: number
  control: boolean
}
export interface TextRecord {
  date: string
  text: string
  updatedAt: number
}
export interface MistakeRecord {
  id: string
  wrong: string
  right: string
  rule: string
  date: string
  createdAt: number
}
export interface PhraseRecord {
  id: string
  phrase: string
  translation: string
  example: string
  /** коробка Лейтнера 0..4 */
  box: number
  /** дата следующего повторения */
  due: string
  createdAt: number
  reviewedAt?: number
}

/** Прогресс карточки встроенной колоды (сама колода лежит в decks/*.json). */
export interface DeckProgressRecord {
  /** `${noteId}:rec` или `${noteId}:prod` */
  id: string
  box: number
  due: string
  reviewedAt?: number
  /** день, когда карточка показана впервые */
  introducedAt: string
}

interface Schema extends DBSchema {
  days: { key: string; value: DayRecord }
  recordings: { key: string; value: RecordingRecord; indexes: { date: string } }
  texts: { key: string; value: TextRecord }
  mistakes: { key: string; value: MistakeRecord }
  phrases: { key: string; value: PhraseRecord }
  deckProgress: { key: string; value: DeckProgressRecord }
}

export interface StoreValues {
  days: DayRecord
  recordings: RecordingRecord
  texts: TextRecord
  mistakes: MistakeRecord
  phrases: PhraseRecord
  deckProgress: DeckProgressRecord
}
export type StoreName = keyof StoreValues
export const STORES: StoreName[] = ['days', 'recordings', 'texts', 'mistakes', 'phrases', 'deckProgress']

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null

export function db() {
  dbPromise ??= openDB<Schema>('english-daily', 2, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        d.createObjectStore('days', { keyPath: 'date' })
        d.createObjectStore('recordings', { keyPath: 'id' }).createIndex('date', 'date')
        d.createObjectStore('texts', { keyPath: 'date' })
        d.createObjectStore('mistakes', { keyPath: 'id' })
        d.createObjectStore('phrases', { keyPath: 'id' })
      }
      if (oldVersion < 2) d.createObjectStore('deckProgress', { keyPath: 'id' })
    },
  })
  return dbPromise
}

// Простое оповещение об изменениях: экраны перечитывают данные после любой записи.
const listeners = new Set<() => void>()
export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
export const notify = () => listeners.forEach((fn) => fn())

export const newId = () => crypto.randomUUID()

export async function getAll<S extends StoreName>(store: S): Promise<StoreValues[S][]> {
  return (await db()).getAll(store) as Promise<StoreValues[S][]>
}

export async function put<S extends StoreName>(store: S, value: StoreValues[S]) {
  await (await db()).put(store, value as never)
  notify()
}

export async function remove(store: StoreName, key: string) {
  await (await db()).delete(store, key)
  notify()
}

// ---- Дни ----

export const emptyDay = (date: string): DayRecord => ({ date, steps: {}, updatedAt: 0 })

export async function getDay(date: string): Promise<DayRecord> {
  return (await (await db()).get('days', date)) ?? emptyDay(date)
}

/** Чтение и запись в одной транзакции, чтобы быстрые клики не затирали друг друга. */
export async function updateDay(date: string, change: (d: DayRecord) => DayRecord) {
  const tx = (await db()).transaction('days', 'readwrite')
  const cur = (await tx.store.get(date)) ?? emptyDay(date)
  await tx.store.put({ ...change(cur), date, updatedAt: Date.now() })
  await tx.done
  notify()
}
