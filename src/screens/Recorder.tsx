import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAll, newId, put, remove, type RecordingRecord } from '../db/db'
import { useQuery } from '../db/useQuery'
import { formatDayMonth, formatShort, todayISO } from '../lib/date'
import { recorderSupported, useRecorder } from '../lib/useRecorder'
import { getPlanDay, isControlDate, nearestPlanDay, plan, type DayInfo } from '../plan/plan'
import { AudioPlayer, formatDuration } from '../components/AudioPlayer'
import { Icon } from '../components/Icon'
import { PlanDayNav } from '../components/PlanDayNav'

/** «1,5 мин» → 90 секунд; «пробный экзамен» → null */
function targetSeconds(s: string): number | null {
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*мин/)
  return m ? Math.round(Number(m[1].replace(',', '.')) * 60) : null
}

const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export default function Recorder() {
  const { date } = useParams()
  const day = (date && getPlanDay(date)) || nearestPlanDay(todayISO())
  const all = useQuery(() => getAll('recordings'), [])
  return (
    <div className="screen">
      <header className="day-head">
        <h1>Диктофон</h1>
      </header>
      <PlanDayNav day={day} basePath="/recorder" />
      <RecordCard key={day.date} day={day} />
      <DayRecordings day={day} items={(all ?? []).filter((r) => r.date === day.date)} />
      <ControlCompare items={(all ?? []).filter((r) => r.control)} />
    </div>
  )
}

function RecordCard({ day }: { day: DayInfo }) {
  const control = isControlDate(day.date)
  const target = targetSeconds(day.week.speakingLength)
  const { recording, elapsed, error, start, stop } = useRecorder((r) =>
    put('recordings', { id: newId(), date: day.date, createdAt: Date.now(), control, ...r }),
  )

  if (!recorderSupported())
    return <section className="card">Этот браузер не поддерживает запись звука. Попробуйте Chrome, Safari или Firefox.</section>

  return (
    <section className="card record-card">
      <div className="topic-label">
        Говорение <span className="meta">· {day.week.speakingLength}</span>
      </div>
      <p className="record-topic" lang="en">{day.speaking}</p>
      {control && (
        <p className="banner small">
          Сегодня день <b>контрольной записи</b>: она попадёт в сравнение ниже. Запишите ответ на тему дня без подготовки.
        </p>
      )}
      <button
        type="button"
        className={`rec-btn ${recording ? 'on' : ''}`}
        onClick={recording ? stop : start}
        aria-label={recording ? 'Остановить запись' : 'Начать запись'}
      >
        <Icon name={recording ? 'stop' : 'mic'} size={32} />
      </button>
      <div className="rec-time">
        {recording ? formatDuration(elapsed) : 'Нажмите, чтобы записать'}
        {recording && target && <span className="muted"> / {formatDuration(target)}</span>}
      </div>
      {recording && target && (
        <div className="progress rec-progress" aria-hidden="true">
          <div style={{ width: `${Math.min(100, (elapsed / target) * 100)}%` }} className={elapsed > target ? 'over' : ''} />
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  )
}

function DayRecordings({ day, items }: { day: DayInfo; items: RecordingRecord[] }) {
  const control = isControlDate(day.date)
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt)
  return (
    <section className="card">
      <div className="section-head">
        <h2>Записи дня</h2>
        <span className="count">{items.length}</span>
      </div>
      {!sorted.length && <p className="muted small">Пока нет записей. Совет: запишите ответ, послушайте, отметьте ошибки и запишите второй раз.</p>}
      <ul className="rec-list">
        {sorted.map((r, i) => (
          <li key={r.id}>
            <div className="rec-meta">
              <span>
                Попытка {sorted.length - i} · {timeFmt.format(r.createdAt)} · {formatDuration(r.durationSec)}
              </span>
              {r.control && <span className="badge">контрольная</span>}
              <span className="spacer" />
              {control && (
                <button className="chip" onClick={() => put('recordings', { ...r, control: !r.control })}>
                  {r.control ? 'Убрать из контрольных' : 'Сделать контрольной'}
                </button>
              )}
              <button
                className="icon-btn"
                aria-label="Удалить запись"
                onClick={() => confirm('Удалить эту запись?') && remove('recordings', r.id)}
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
            <AudioPlayer blob={r.blob} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Контрольные записи рядом: по последней на каждую контрольную дату + проигрывание по очереди. */
function ControlCompare({ items }: { items: RecordingRecord[] }) {
  const players = useRef<(HTMLAudioElement | null)[]>([])
  const [queue, setQueue] = useState<number | null>(null)

  const slots = plan.controlRecordings.map((date) => {
    const recs = items.filter((r) => r.date === date).sort((a, b) => b.createdAt - a.createdAt)
    return { date, rec: recs[0], count: recs.length, topic: getPlanDay(date)?.speaking }
  })
  const playable = slots.map((s, i) => (s.rec ? i : -1)).filter((i) => i >= 0)

  function playFrom(pos: number) {
    players.current.forEach((p) => p?.pause())
    if (pos >= playable.length) return setQueue(null)
    const el = players.current[playable[pos]]
    if (!el) return setQueue(null)
    setQueue(pos)
    el.currentTime = 0
    void el.play()
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2>Контрольные записи</h2>
        <span className="count">
          {playable.length} / {slots.length}
        </span>
      </div>
      <p className="muted small">
        Четыре точки за курс: {plan.controlRecordings.map(formatShort).join(', ')}. Слушайте их рядом и замечайте, как
        меняются беглость, словарь и произношение.
      </p>
      <div className="row">
        {queue === null ? (
          <button className="btn" disabled={playable.length < 2} onClick={() => playFrom(0)}>
            <Icon name="play" size={16} /> Прослушать по очереди
          </button>
        ) : (
          <button className="btn" onClick={() => playFrom(playable.length)}>
            <Icon name="stop" size={16} /> Остановить
          </button>
        )}
      </div>
      <div className="control-grid">
        {slots.map((s, i) => (
          <div key={s.date} className={`control-slot ${queue !== null && playable[queue] === i ? 'playing' : ''}`}>
            <div className="control-date">
              <Link to={`/recorder/${s.date}`}>{formatDayMonth(s.date)}</Link>
              {s.count > 1 && <span className="muted small"> · {s.count} шт., показана последняя</span>}
            </div>
            {s.topic && <div className="muted small" lang="en">{s.topic}</div>}
            {s.rec ? (
              <>
                <div className="small">{formatDuration(s.rec.durationSec)}</div>
                <AudioPlayer
                  blob={s.rec.blob}
                  ref={(el) => (players.current[i] = el)}
                  onEnded={() => queue !== null && playable[queue] === i && playFrom(queue + 1)}
                />
              </>
            ) : (
              <div className="muted small empty-slot">{s.date < todayISO() ? 'Записи нет' : 'Ещё впереди'}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
