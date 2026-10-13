import { useEffect, useState } from 'react'
import { subscribe } from './db'

/** Загружает данные из базы и перезагружает их после любого изменения. */
export function useQuery<T>(load: () => Promise<T>, deps: unknown[]): T | undefined {
  const [value, setValue] = useState<T>()
  useEffect(() => {
    let alive = true
    const run = () => load().then((v) => alive && setValue(v))
    run()
    const unsubscribe = subscribe(run)
    return () => {
      alive = false
      unsubscribe()
    }
  }, deps)
  return value
}
