import { useEffect, useRef } from 'react'

/** Откладывает сохранение на delay мс после последнего изменения; при уходе с экрана сохраняет сразу. */
export function useDebouncedSave<T>(save: (v: T) => void, delay = 500) {
  const timer = useRef<number>()
  const pending = useRef<{ v: T } | null>(null)
  const saveRef = useRef(save)
  saveRef.current = save

  const flush = () => {
    window.clearTimeout(timer.current)
    if (pending.current) {
      saveRef.current(pending.current.v)
      pending.current = null
    }
  }
  useEffect(() => flush, [])

  const schedule = (v: T) => {
    pending.current = { v }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, delay)
  }
  return { schedule, flush }
}
