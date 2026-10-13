import { useRef, useState } from 'react'
import { getAll, newId, put, remove, type MistakeRecord } from '../db/db'
import { useQuery } from '../db/useQuery'
import { formatShort, todayISO } from '../lib/date'
import { Icon } from '../components/Icon'

const empty = { wrong: '', right: '', rule: '' }

export default function Mistakes() {
  const items = useQuery(() => getAll('mistakes'), [])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<MistakeRecord | null>(null)
  const [query, setQuery] = useState('')
  const firstField = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()
  const list = [...(items ?? [])]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((m) => !q || [m.wrong, m.right, m.rule].some((f) => f.toLowerCase().includes(q)))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = { wrong: form.wrong.trim(), right: form.right.trim(), rule: form.rule.trim() }
    if (!v.wrong || !v.right) return
    if (editing) await put('mistakes', { ...editing, ...v })
    else await put('mistakes', { id: newId(), date: todayISO(), createdAt: Date.now(), ...v })
    setForm(empty)
    setEditing(null)
    firstField.current?.focus()
  }

  function startEdit(m: MistakeRecord) {
    setEditing(m)
    setForm({ wrong: m.wrong, right: m.right, rule: m.rule })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    firstField.current?.focus()
  }

  return (
    <div className="screen wide">
      <header className="day-head">
        <h1>Журнал ошибок</h1>
        <p className="muted small">
          Записывайте ошибки из проверки текстов и записей. Пять последних показываются перед письмом.
        </p>
      </header>

      <form className="card mistake-form" onSubmit={submit}>
        <label className="field column">
          <span className="field-label">Ошибка</span>
          <input
            ref={firstField}
            className="input"
            lang="en"
            value={form.wrong}
            placeholder="I am interesting in ML"
            onChange={(e) => setForm({ ...form, wrong: e.target.value })}
          />
        </label>
        <label className="field column">
          <span className="field-label">Правильно</span>
          <input
            className="input"
            lang="en"
            value={form.right}
            placeholder="I am interested in ML"
            onChange={(e) => setForm({ ...form, right: e.target.value })}
          />
        </label>
        <label className="field column">
          <span className="field-label">Правило</span>
          <input
            className="input"
            value={form.rule}
            placeholder="-ed — что я чувствую, -ing — что вызывает чувство"
            onChange={(e) => setForm({ ...form, rule: e.target.value })}
          />
        </label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={!form.wrong.trim() || !form.right.trim()}>
            <Icon name={editing ? 'check' : 'plus'} size={18} /> {editing ? 'Сохранить' : 'Добавить'}
          </button>
          {editing && (
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEditing(null)
                setForm(empty)
              }}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <section className="card">
        <div className="section-head">
          <h2>Все ошибки</h2>
          <span className="count">{q ? `${list.length} из ${items?.length ?? 0}` : items?.length ?? 0}</span>
        </div>
        <label className="search">
          <Icon name="search" size={18} />
          <input
            className="input"
            type="search"
            placeholder="Поиск по ошибке, исправлению или правилу"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {items && !items.length && <p className="muted small">Журнал пока пуст.</p>}
        {items && items.length > 0 && !list.length && <p className="muted small">Ничего не найдено.</p>}
        {list.length > 0 && (
          <table className="mistakes-table">
            <thead>
              <tr>
                <th>Ошибка</th>
                <th>Правильно</th>
                <th>Правило</th>
                <th>Дата</th>
                <th aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className={editing?.id === m.id ? 'editing' : ''}>
                  <td data-label="Ошибка" className="wrong" lang="en">{m.wrong}</td>
                  <td data-label="Правильно" className="right" lang="en">{m.right}</td>
                  <td data-label="Правило" className="rule">{m.rule || <span className="muted">—</span>}</td>
                  <td data-label="Дата" className="muted date">{formatShort(m.date)}</td>
                  <td className="actions">
                    <button className="chip" onClick={() => startEdit(m)}>
                      Изменить
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Удалить"
                      onClick={() => confirm('Удалить эту запись из журнала?') && remove('mistakes', m.id)}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
