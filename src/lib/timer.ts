// Таймеры шагов. Живут вне React, чтобы не сбрасываться при переходе между экранами
// (например, во время «Говорения» вы уходите в диктофон), и сохраняются в localStorage.
import { useSyncExternalStore } from 'react'
import { todayISO } from './date'

export interface TimerEntry {
  key: string
  date: string
  stepId: string
  label: string
  durationMs: number
  /** остаток, пока таймер на паузе */
  remainingMs: number
  /** момент окончания, пока таймер идёт */
  endAt: number | null
  finished: boolean
}
type Timers = Record<string, TimerEntry>
interface Snapshot {
  timers: Timers
  now: number
}

const LS_KEY = 'english-daily:timers'

function load(): Timers {
  try {
    const t = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Timers
    const today = todayISO()
    // старые завершённые таймеры не нужны
    return Object.fromEntries(Object.entries(t).filter(([, e]) => !e.finished || e.date === today))
  } catch {
    return {}
  }
}

let snap: Snapshot = { timers: load(), now: Date.now() }
const subs = new Set<() => void>()
let interval: number | undefined

function emit() {
  subs.forEach((f) => f())
}

function set(timers: Timers) {
  snap = { timers, now: Date.now() }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(timers))
  } catch {
    /* хранилище недоступно — таймер просто не переживёт перезагрузку */
  }
  emit()
  schedule()
}

function schedule() {
  const running = Object.values(snap.timers).some((t) => t.endAt)
  if (running && interval === undefined) interval = window.setInterval(tick, 250)
  if (!running && interval !== undefined) {
    clearInterval(interval)
    interval = undefined
  }
}

function tick() {
  const now = Date.now()
  const done = Object.values(snap.timers).filter((t) => t.endAt && now >= t.endAt)
  if (done.length) {
    const next = { ...snap.timers }
    for (const t of done) next[t.key] = { ...t, endAt: null, remainingMs: 0, finished: true }
    set(next)
    alarm()
  } else {
    snap = { ...snap, now }
    emit()
  }
}

// ---- Звук и вибрация по окончании ----
let audio: AudioContext | undefined
function unlockAudio() {
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    /* без звука */
  }
}
function alarm() {
  navigator.vibrate?.([300, 150, 300, 150, 300])
  if (!audio) return
  const t0 = audio.currentTime
  for (let i = 0; i < 3; i++) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, t0 + i * 0.4)
    gain.gain.exponentialRampToValueAtTime(0.3, t0 + i * 0.4 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.4 + 0.3)
    osc.connect(gain).connect(audio.destination)
    osc.start(t0 + i * 0.4)
    osc.stop(t0 + i * 0.4 + 0.32)
  }
}

// ---- Публичное API ----

export const timerKey = (date: string, stepId: string) => `${date}:${stepId}`

export const remainingMs = (t: TimerEntry, now: number) => (t.endAt ? Math.max(0, t.endAt - now) : t.remainingMs)

export function formatMs(ms: number) {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Запуск или продолжение. Одновременно идёт только один таймер — остальные ставятся на паузу. */
export function startTimer(date: string, stepId: string, label: string, minutes: number) {
  unlockAudio()
  const now = Date.now()
  const key = timerKey(date, stepId)
  const next: Timers = {}
  for (const t of Object.values(snap.timers))
    next[t.key] = t.endAt ? { ...t, endAt: null, remainingMs: remainingMs(t, now) } : t
  const cur = next[key]
  const base: TimerEntry =
    cur && !cur.finished
      ? cur
      : { key, date, stepId, label, durationMs: minutes * 60_000, remainingMs: minutes * 60_000, endAt: null, finished: false }
  next[key] = { ...base, endAt: now + base.remainingMs }
  set(next)
}

export function pauseTimer(key: string) {
  const t = snap.timers[key]
  if (!t?.endAt) return
  set({ ...snap.timers, [key]: { ...t, endAt: null, remainingMs: remainingMs(t, Date.now()) } })
}

export function resetTimer(key: string) {
  const next = { ...snap.timers }
  delete next[key]
  set(next)
}

const subscribeTimers = (f: () => void) => {
  subs.add(f)
  return () => void subs.delete(f)
}

export function useTimers(): Snapshot {
  return useSyncExternalStore(subscribeTimers, () => snap)
}

schedule()
