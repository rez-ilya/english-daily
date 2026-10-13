// Резервная копия: все хранилища в один JSON. Аудио сохраняется как data:URL (base64).
import { db, notify, STORES, type RecordingRecord, type StoreName, type StoreValues } from './db'

const APP = 'english-daily'
const VERSION = 1

type SerializedRecording = Omit<RecordingRecord, 'blob'> & { blob: string }
type Data = { [S in StoreName]: S extends 'recordings' ? SerializedRecording[] : StoreValues[S][] }

export interface Backup {
  app: string
  version: number
  exportedAt: string
  data: Data
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

export async function exportBackup(): Promise<Backup> {
  const d = await db()
  const recordings = await d.getAll('recordings')
  return {
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      days: await d.getAll('days'),
      recordings: await Promise.all(recordings.map(async (r) => ({ ...r, blob: await blobToDataUrl(r.blob) }))),
      texts: await d.getAll('texts'),
      mistakes: await d.getAll('mistakes'),
      phrases: await d.getAll('phrases'),
      deckProgress: await d.getAll('deckProgress'),
    },
  }
}

export function downloadFile(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Полностью заменяет данные содержимым файла. Возвращает число записей по хранилищам. */
export async function importBackup(json: string): Promise<Record<StoreName, number>> {
  const b = JSON.parse(json) as Backup
  if (b?.app !== APP || !b.data) throw new Error('Это не резервная копия English Daily')

  // Аудио декодируем заранее: внутри транзакции IndexedDB нельзя ждать посторонние промисы.
  const recordings: RecordingRecord[] = await Promise.all(
    (b.data.recordings ?? []).map(async (r) => ({ ...r, blob: await (await fetch(r.blob)).blob() })),
  )
  const values: { [S in StoreName]: StoreValues[S][] } = {
    days: b.data.days ?? [],
    recordings,
    texts: b.data.texts ?? [],
    mistakes: b.data.mistakes ?? [],
    phrases: b.data.phrases ?? [],
    deckProgress: b.data.deckProgress ?? [],
  }

  const tx = (await db()).transaction(STORES, 'readwrite')
  for (const s of STORES) {
    const store = tx.objectStore(s)
    await store.clear()
    for (const v of values[s]) await store.put(v as never)
  }
  await tx.done
  notify()
  return Object.fromEntries(STORES.map((s) => [s, values[s].length])) as Record<StoreName, number>
}
