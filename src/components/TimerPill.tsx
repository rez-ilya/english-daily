import { Link } from 'react-router-dom'
import { formatMs, pauseTimer, remainingMs, resetTimer, useTimers } from '../lib/timer'
import { todayISO } from '../lib/date'
import { Icon } from './Icon'

/** Плавающая плашка с идущим (или только что закончившимся) таймером — видна на всех экранах. */
export function TimerPill() {
  const { timers, now } = useTimers()
  const list = Object.values(timers)
  const t = list.find((x) => x.endAt) ?? list.find((x) => x.finished)
  if (!t) return null
  const to = t.date === todayISO() ? '/' : `/day/${t.date}`
  return (
    <div className={`timer-pill ${t.finished ? 'finished' : ''}`} role="status">
      <Link to={to} className="timer-pill-label">
        {t.finished ? `Время вышло: ${t.label}` : t.label}
      </Link>
      {!t.finished && <span className="timer-pill-time">{formatMs(remainingMs(t, now))}</span>}
      {t.finished ? (
        <button type="button" className="icon-btn" onClick={() => resetTimer(t.key)} aria-label="Закрыть">
          <Icon name="check" size={18} />
        </button>
      ) : (
        <button type="button" className="icon-btn" onClick={() => pauseTimer(t.key)} aria-label="Пауза">
          <Icon name="pause" size={18} />
        </button>
      )}
    </div>
  )
}
