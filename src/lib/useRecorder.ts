import { useEffect, useRef, useState } from 'react'

export interface RecordingResult {
  blob: Blob
  mimeType: string
  durationSec: number
}

/** Подходящий формат: Chrome/Firefox пишут webm/opus, Safari — mp4. */
function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) ?? ''
}

export const recorderSupported = () =>
  typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

/** Запись с микрофона через MediaRecorder. */
export function useRecorder(onDone: (r: RecordingResult) => void) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const rec = useRef<MediaRecorder | null>(null)
  const startedAt = useRef(0)
  const ticker = useRef<number>()
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  async function start() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      const mimeType = pickMimeType()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: Blob[] = []
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        window.clearInterval(ticker.current)
        setRecording(false)
        const type = mr.mimeType || mimeType || 'audio/webm'
        const durationSec = Math.round((Date.now() - startedAt.current) / 1000)
        if (chunks.length) onDoneRef.current({ blob: new Blob(chunks, { type }), mimeType: type, durationSec })
      }
      rec.current = mr
      startedAt.current = Date.now()
      setElapsed(0)
      ticker.current = window.setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 200)
      mr.start(1000)
      setRecording(true)
    } catch (e) {
      const name = (e as DOMException).name
      setError(
        name === 'NotAllowedError'
          ? 'Нет доступа к микрофону. Разрешите его в настройках браузера для этого сайта.'
          : name === 'NotFoundError'
            ? 'Микрофон не найден.'
            : `Не удалось начать запись: ${(e as Error).message}`,
      )
    }
  }

  function stop() {
    if (rec.current?.state === 'recording') rec.current.stop()
  }

  // Если уйти с экрана во время записи — остановить и сохранить.
  useEffect(() => () => stop(), [])

  return { recording, elapsed, error, start, stop }
}
