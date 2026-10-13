import { Link } from 'react-router-dom'
import type { Step } from '../plan/plan'
import { stepMinutes } from '../plan/plan'
import { formatMs, pauseTimer, remainingMs, resetTimer, startTimer, timerKey, useTimers } from '../lib/timer'
import { Icon } from './Icon'

export function StepRow({
  step,
  date,
  done,
  onToggle,
  link,
}: {
  step: Step
  date: string
  done: boolean
  onToggle: () => void
  link?: { to: string; label: string }
}) {
  const { timers, now } = useTimers()
  const key = timerKey(date, step.id)
  const t = timers[key]
  const minutes = stepMinutes(step)
  const left = t ? remainingMs(t, now) : minutes * 60_000
  const running = !!t?.endAt
  const progress = t ? 1 - left / t.durationMs : 0

  return (
    <li className={`step ${done ? 'done' : ''}`}>
      <label className="step-check">
        <input type="checkbox" checked={done} onChange={onToggle} />
        <span className="box" aria-hidden="true">
          <Icon name="check" size={16} />
        </span>
        <span className="step-text">
          <span className="step-name">{step.name}</span>
          <span className="step-hint">{step.hint}</span>
        </span>
      </label>
      <div className="step-actions">
        {link && (
          <Link className="chip" to={link.to}>
            {link.label}
          </Link>
        )}
        <div className={`timer ${running ? 'running' : ''} ${t?.finished ? 'finished' : ''}`}>
          <button
            type="button"
            className="timer-main"
            style={{ '--p': progress } as React.CSSProperties}
            onClick={() => (running ? pauseTimer(key) : startTimer(date, step.id, step.name, minutes))}
            aria-label={running ? `Пауза: ${step.name}` : `Запустить таймер: ${step.name}`}
          >
            <Icon name={running ? 'pause' : 'play'} size={14} />
            <span>{t?.finished ? 'Время!' : formatMs(left)}</span>
          </button>
          {t && (
            <button type="button" className="icon-btn" onClick={() => resetTimer(key)} aria-label="Сбросить таймер">
              <Icon name="reset" size={16} />
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
