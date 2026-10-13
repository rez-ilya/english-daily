import { Link } from 'react-router-dom'
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { getAll, type DayRecord } from '../db/db'
import { useQuery } from '../db/useQuery'
import { addDays, formatLong, plural, todayISO } from '../lib/date'
import { computeStats, stepsDone } from '../lib/stats'
import { getPlanDay, plan } from '../plan/plan'
import { Icon } from '../components/Icon'

const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const SERIES_COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)']

const tooltipStyle = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' },
  labelStyle: { color: 'var(--text)', fontWeight: 600 },
}

export default function Progress() {
  const records = useQuery(() => getAll('days'), [])
  if (!records) return <div className="screen" />
  const today = todayISO()
  const s = computeStats(records, today)
  const byDate = new Map(records.map((r) => [r.date, r]))
  const hours = Math.floor(s.extraMinutes / 60)

  return (
    <div className="screen wide">
      <header className="page-head">
        <h1>Прогресс</h1>
        <Link to="/data" className="chip">
          <Icon name="data" size={16} /> Резервная копия
        </Link>
      </header>

      <section className="tiles">
        <div className="tile">
          <div className="tile-value">{s.streak}</div>
          <div className="tile-label">{plural(s.streak, ['день', 'дня', 'дней'])} подряд</div>
          <div className="tile-sub">воскресенья не прерывают</div>
        </div>
        <div className="tile">
          <div className="tile-value">
            {s.fullDays}
            <small> / {s.totalDays}</small>
          </div>
          <div className="tile-label">полных дней</div>
          <div className="tile-sub">все {plan.dailySteps.length} шагов</div>
        </div>
        <div className="tile">
          <div className="tile-value">{s.stepsPct}%</div>
          <div className="tile-label">шагов выполнено</div>
          <div className="tile-sub">
            за {s.passedDays} {plural(s.passedDays, ['прошедший день', 'прошедших дня', 'прошедших дней'])}
          </div>
        </div>
        <div className="tile">
          <div className="tile-value">
            {hours > 0 ? `${hours} ч ${s.extraMinutes % 60}` : s.extraMinutes}
            <small> мин</small>
          </div>
          <div className="tile-label">доп. практики</div>
          <div className="tile-sub">всего</div>
        </div>
      </section>

      <section className="card">
        <h2>Календарь</h2>
        <Heatmap byDate={byDate} today={today} />
      </section>

      <section className="card">
        <h2>По неделям: шаги и беглость</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={s.weeks} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--border)" />
              <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--border)" unit="%" />
              <YAxis yAxisId="fl" orientation="right" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--border)" />
              <Tooltip {...tooltipStyle} labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.theme ?? ''}`} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar yAxisId="pct" dataKey="stepsPct" name="Шаги, %" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="fl" dataKey="fluency" name="Беглость (1–5)" stroke="var(--c2)" strokeWidth={2} connectNulls dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h2>Самооценка IELTS по неделям</h2>
        {s.weeks.some((w) => Object.values(w.ielts).some((v) => v !== null)) ? null : (
          <p className="muted small">Заполняется по субботам на экране «Сегодня».</p>
        )}
        <div className="chart">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={s.weeks.map((w) => ({ label: w.label, theme: w.theme, ...w.ielts }))} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--border)" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: 'var(--muted)', fontSize: 12 }} stroke="var(--border)" />
              <Tooltip {...tooltipStyle} labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.theme ?? ''}`} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              {plan.ieltsCriteria.map((c, i) => (
                <Line key={c.id} dataKey={c.id} name={c.name} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} connectNulls dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

function Heatmap({ byDate, today }: { byDate: Map<string, DayRecord>; today: string }) {
  const total = plan.dailySteps.length
  return (
    <div className="heatmap-wrap">
      <div className="heatmap" role="grid">
        <div />
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="hm-head">{d}</div>
        ))}
        {plan.weeks.map((w) => {
          const monday = w.days[0].date
          return [
            <div key={`l${w.week}`} className="hm-week" title={w.theme}>Н{w.week}</div>,
            ...WEEKDAY_SHORT.map((_, i) => {
              const date = addDays(monday, i)
              const isToday = date === today
              const pd = getPlanDay(date)
              if (!pd)
                return (
                  <div key={date} className={`hm-cell hm-rest ${isToday ? 'today' : ''}`} title={`${formatLong(date)} — отдых`}>
                    {Number(date.slice(8))}
                  </div>
                )
              const n = stepsDone(byDate.get(date))
              return (
                <Link
                  key={date}
                  to={isToday ? '/' : `/day/${date}`}
                  className={`hm-cell l${n} ${isToday ? 'today' : ''} ${date > today ? 'future' : ''}`}
                  title={`${formatLong(date)}: ${n} из ${total}`}
                >
                  {Number(date.slice(8))}
                </Link>
              )
            }),
          ]
        })}
      </div>
      <div className="hm-legend">
        <span>0</span>
        {Array.from({ length: total + 1 }, (_, i) => (
          <i key={i} className={`hm-cell l${i}`} />
        ))}
        <span>{total} шагов</span>
      </div>
    </div>
  )
}
