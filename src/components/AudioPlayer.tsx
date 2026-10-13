import { forwardRef, useEffect, useState } from 'react'

/** <audio> для Blob из базы: создаёт временный URL и освобождает его. */
export const AudioPlayer = forwardRef<HTMLAudioElement, { blob: Blob; onEnded?: () => void }>(function AudioPlayer(
  { blob, onEnded },
  ref,
) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return <audio ref={ref} className="audio" controls preload="metadata" src={url} onEnded={onEnded} />
})

export const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, '0')}`
