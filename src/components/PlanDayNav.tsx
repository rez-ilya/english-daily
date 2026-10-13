import { useNavigate } from 'react-router-dom'
import { formatLong } from '../lib/date'
import { planDays, type DayInfo } from '../plan/plan'
import { Icon } from './Icon'

/** Переключатель учебных дней для экранов «Диктофон» и «Письмо». */
export function PlanDayNav({ day, basePath }: { day: DayInfo; basePath: string }) {
  const navigate = useNavigate()
  const prev = planDays[day.index - 1]
  const next = planDays[day.index + 1]
  return (
    <div className="day-nav">
      <button className="icon-btn" disabled={!prev} onClick={() => navigate(`${basePath}/${prev.date}`)} aria-label="Предыдущий день">
        <Icon name="left" />
      </button>
      <div className="day-nav-date">
        <span>{formatLong(day.date)}</span>
        <span className="muted small">
          Неделя {day.week.week} · {day.week.theme}
        </span>
      </div>
      <button className="icon-btn" disabled={!next} onClick={() => navigate(`${basePath}/${next.date}`)} aria-label="Следующий день">
        <Icon name="right" />
      </button>
    </div>
  )
}
