import { Link } from 'react-router-dom'
import { getAll } from '../db/db'
import { useQuery } from '../db/useQuery'

/** Напоминание перед письмом: 5 последних ошибок из журнала. */
export function RecentMistakes() {
  const items = useQuery(() => getAll('mistakes'), [])
  if (!items?.length) return null
  const last = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  return (
    <section className="card reminder">
      <div className="section-head">
        <h2>Не повторяйте эти ошибки</h2>
        <Link to="/mistakes" className="link-small">
          весь журнал
        </Link>
      </div>
      <ul className="mistake-mini">
        {last.map((m) => (
          <li key={m.id}>
            <span className="wrong" lang="en">{m.wrong}</span>
            <span className="arrow" aria-hidden="true">→</span>
            <span className="right" lang="en">{m.right}</span>
            {m.rule && <span className="rule">{m.rule}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
