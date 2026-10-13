import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDay, updateDay, type DayRecord } from '../db/db'
import { useQuery } from '../db/useQuery'
import { formatDayMonth, formatLong, todayISO } from '../lib/date'
import { stepsDone } from '../lib/stats'
import { useDebouncedSave } from '../lib/useDebouncedSave'
import { plan, planDays, resolveDay, type DayInfo } from '../plan/plan'
import { Icon } from '../components/Icon'
import { Materials } from '../components/Materials'
import { Rating } from '../components/Rating'
import { StepRow } from '../components/StepRow'

/** Быстрые переходы из шагов на рабочие экраны. */
const STEP_LINKS: Record<string, (date: string) => { to: string; label: string }> = {
  speak: (date) => ({ to: `/recorder/${date}`, label: 'Диктофон' }),
  write: (date) => ({ to: `/writing/${date}`, label: 'Текст' }),
  phrases: () => ({ to: '/phrases', label: 'Карточки' }),
}

const dayPath = (date: string) => (date === todayISO() ? '/' : `/day/${date}`)

export default function Today() {
  const { date } = useParams()
  const today = todayISO()
  const target = date ?? today
  const r = resolveDay(target)
  const navigate = useNavigate()

  if (r.kind === 'rest') {
    return (
      <div className="screen">
        <DayNav date={target} prev={r.prev} next={r.next} />
        <section className="card rest">
          <h1>День отдыха</h1>
          <p className="muted">
            {formatLong(target)} — по плану день отдыха. Серия дней подряд не прервётся.
          </p>
          {r.next && (
            <button className="btn" onClick={() => navigate(dayPath(r.next!.date))}>
              Посмотреть следующий день — {formatDayMonth(r.next.date)}
            </button>
          )}
        </section>
      </div>
    )
  }

  const banner =
    r.kind === 'before'
      ? `План начинается ${formatDayMonth(r.day.date)}. Ниже — первый день, можно подготовиться.`
      : r.kind === 'after'
        ? 'План завершён! Ниже — последний учебный день.'
        : null

  return <DayView key={r.day.date} day={r.day} banner={banner} />
}

function DayNav({ date, prev, next }: { date: string; prev?: DayInfo; next?: DayInfo }) {
  const navigate = useNavigate()
  const onHome = !useParams().date
  return (
    <div className="day-nav">
      <button className="icon-btn" disabled={!prev} onClick={() => prev && navigate(dayPath(prev.date))} aria-label="Предыдущий день">
        <Icon name="left" />
      </button>
      <div className="day-nav-date">
        <span>{formatLong(date)}</span>
        {!onHome && (
          <Link to="/" className="link-small">
            к сегодняшнему дню
          </Link>
        )}
      </div>
      <button className="icon-btn" disabled={!next} onClick={() => next && navigate(dayPath(next.date))} aria-label="Следующий день">
        <Icon name="right" />
      </button>
    </div>
  )
}

function DayView({ day, banner }: { day: DayInfo; banner: string | null }) {
  const rec = useQuery(() => getDay(day.date), [day.date])
  const save = (change: (d: DayRecord) => DayRecord) => updateDay(day.date, change)
  const done = stepsDone(rec)
  const total = plan.dailySteps.length

  return (
    <div className="screen">
      <DayNav date={day.date} prev={planDays[day.index - 1]} next={planDays[day.index + 1]} />
      {banner && <div className="banner">{banner}</div>}

      <header className="day-head">
        <div className="eyebrow">
          Неделя {day.week.week} из {plan.weeks.length} · день {day.index + 1} из {planDays.length}
        </div>
        <h1>{day.week.theme}</h1>
      </header>

      <section className="topics">
        <div className="topic">
          <div className="topic-label">Грамматика</div>
          <div className="topic-text">{day.grammar}</div>
        </div>
        <div className="topic">
          <div className="topic-label">
            Говорение <span className="meta">· {day.week.speakingLength}</span>
          </div>
          <div className="topic-text" lang="en">{day.speaking}</div>
        </div>
        <div className="topic">
          <div className="topic-label">
            Письмо <span className="meta">· {day.week.writingLength}</span>
          </div>
          <div className="topic-text" lang="en">{day.writing}</div>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Шаги дня</h2>
          <span className="count">
            {done} / {total}
          </span>
        </div>
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <ul className="steps">
          {plan.dailySteps.map((s) => (
            <StepRow
              key={s.id}
              step={s}
              date={day.date}
              done={!!rec?.steps[s.id]}
              link={STEP_LINKS[s.id]?.(day.date)}
              onToggle={() => save((d) => ({ ...d, steps: { ...d.steps, [s.id]: !d.steps[s.id] } }))}
            />
          ))}
        </ul>
      </section>

      {rec && rec.date === day.date && (
        <section className="card form">
          <div className="field">
            <span className="field-label">Как шла речь</span>
            <Rating label="Как шла речь" value={rec.fluency} onChange={(v) => save((d) => ({ ...d, fluency: v }))} />
          </div>
          <label className="field">
            <span className="field-label">Доп. практика, минут</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={600}
              className="input narrow"
              value={rec.extraMinutes ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Math.max(0, Math.round(Number(e.target.value)))
                save((d) => ({ ...d, extraMinutes: v }))
              }}
            />
          </label>
          <NoteField initial={rec.note ?? ''} onSave={(note) => save((d) => ({ ...d, note }))} />
        </section>
      )}

      {day.isWeekReview && rec && rec.date === day.date && (
        <section className="card form">
          <h2>Итоги недели: самооценка IELTS</h2>
          <p className="muted small">Оцените, как вы чувствуете себя по каждому критерию, от 1 до 5.</p>
          {plan.ieltsCriteria.map((c) => (
            <div className="field" key={c.id}>
              <span className="field-label">{c.name}</span>
              <Rating
                label={c.name}
                value={rec.ielts?.[c.id]}
                onChange={(v) =>
                  save((d) => {
                    const ielts = { ...d.ielts }
                    if (v) ielts[c.id] = v
                    else delete ielts[c.id]
                    return { ...d, ielts }
                  })
                }
              />
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2>Материалы дня</h2>
        <Materials items={day.materials} />
      </section>
    </div>
  )
}

/** Заметка сохраняется с небольшой задержкой, чтобы не писать в базу на каждый символ. */
function NoteField({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial)
  const { schedule, flush } = useDebouncedSave(onSave)
  return (
    <label className="field column">
      <span className="field-label">Заметка</span>
      <textarea
        className="input"
        rows={3}
        value={value}
        placeholder="Что получилось, что было трудно, новые слова…"
        onChange={(e) => {
          setValue(e.target.value)
          schedule(e.target.value)
        }}
        onBlur={flush}
      />
    </label>
  )
}
