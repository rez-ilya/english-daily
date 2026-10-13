import { useRef, useState } from 'react'
import { getAll, newId, put, remove, type PhraseRecord } from '../db/db'
import { downloadFile } from '../db/backup'
import { useQuery } from '../db/useQuery'
import { formatShort, plural, todayISO } from '../lib/date'
import { BOXES, dueToday, review, toAnkiCsv } from '../lib/srs'
import { Icon } from '../components/Icon'
import { DeckReview } from '../components/DeckReview'
import { deckQueue, getNewPerDay } from '../decks/deck'

type Tab = 'review' | 'list' | 'deck'

export default function Phrases() {
  const items = useQuery(() => getAll('phrases'), [])
  const [tab, setTab] = useState<Tab>('review')
  const today = todayISO()
  const due = dueToday(items ?? [], today)
  const progress = useQuery(() => getAll('deckProgress'), [])
  const deckLeft = progress ? deckQueue(progress, today, getNewPerDay()).queue.length : 0

  return (
    <div className="screen">
      <header className="day-head">
        <h1>Фразы</h1>
      </header>
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={tab === 'review'} className={tab === 'review' ? 'on' : ''} onClick={() => setTab('review')}>
          Повторение {due.length > 0 && <span className="pill-count">{due.length}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'list'} className={tab === 'list' ? 'on' : ''} onClick={() => setTab('list')}>
          Словарь {items && <span className="muted">· {items.length}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'deck'} className={tab === 'deck' ? 'on' : ''} onClick={() => setTab('deck')}>
          ML & AI {deckLeft > 0 && <span className="pill-count">{deckLeft}</span>}
        </button>
      </div>
      {tab === 'deck'
        ? progress && <DeckReview progress={progress} />
        : items && (tab === 'review' ? <Review due={due} total={items.length} onAdd={() => setTab('list')} /> : <Dictionary items={items} />)}
    </div>
  )
}

function Review({ due, total, onAdd }: { due: PhraseRecord[]; total: number; onAdd: () => void }) {
  const [shown, setShown] = useState(false)
  const card = due[0]

  if (!total)
    return (
      <section className="card empty">
        <p>Словарь пока пуст. Добавляйте по 5 новых фраз в день.</p>
        <button className="btn primary" onClick={onAdd}>
          <Icon name="plus" size={18} /> Добавить фразы
        </button>
      </section>
    )
  if (!card)
    return (
      <section className="card empty">
        <h2>На сегодня всё повторено</h2>
        <p className="muted">Новые карточки появятся, когда подойдёт их срок.</p>
      </section>
    )

  const answer = async (ok: boolean) => {
    setShown(false)
    await put('phrases', review(card, ok, todayISO()))
  }

  return (
    <section className="card flashcard">
      <div className="muted small">
        Осталось: {due.length} · коробка {card.box + 1} из {BOXES}
      </div>
      <div className="flash-front" lang="en">{card.phrase}</div>
      {shown ? (
        <>
          <div className="flash-back">{card.translation}</div>
          {card.example && <div className="flash-example" lang="en">{card.example}</div>}
          <div className="flash-actions">
            <button className="btn danger" onClick={() => answer(false)}>
              Не помню
            </button>
            <button className="btn primary" onClick={() => answer(true)}>
              Помню
            </button>
          </div>
        </>
      ) : (
        <button className="btn" onClick={() => setShown(true)}>
          Показать перевод
        </button>
      )}
    </section>
  )
}

const emptyForm = { phrase: '', translation: '', example: '' }

function Dictionary({ items }: { items: PhraseRecord[] }) {
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<PhraseRecord | null>(null)
  const [query, setQuery] = useState('')
  const first = useRef<HTMLInputElement>(null)
  const today = todayISO()

  const q = query.trim().toLowerCase()
  const list = [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((p) => !q || [p.phrase, p.translation, p.example].some((f) => f.toLowerCase().includes(q)))
  const addedToday = items.filter((p) => new Date(p.createdAt).toDateString() === new Date().toDateString()).length

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = { phrase: form.phrase.trim(), translation: form.translation.trim(), example: form.example.trim() }
    if (!v.phrase || !v.translation) return
    if (editing) await put('phrases', { ...editing, ...v })
    else await put('phrases', { id: newId(), createdAt: Date.now(), box: 0, due: today, ...v })
    setForm(emptyForm)
    setEditing(null)
    first.current?.focus()
  }

  return (
    <>
      <form className="card form" onSubmit={submit}>
        <div className="section-head">
          <h2>{editing ? 'Изменить фразу' : 'Новая фраза'}</h2>
          {!editing && <span className="count">сегодня +{addedToday}</span>}
        </div>
        <label className="field column">
          <span className="field-label">Фраза</span>
          <input ref={first} className="input" lang="en" value={form.phrase} placeholder="to be keen on something" onChange={(e) => setForm({ ...form, phrase: e.target.value })} />
        </label>
        <label className="field column">
          <span className="field-label">Перевод</span>
          <input className="input" value={form.translation} placeholder="очень увлекаться чем-то" onChange={(e) => setForm({ ...form, translation: e.target.value })} />
        </label>
        <label className="field column">
          <span className="field-label">Пример</span>
          <input className="input" lang="en" value={form.example} placeholder="I'm really keen on machine learning." onChange={(e) => setForm({ ...form, example: e.target.value })} />
        </label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={!form.phrase.trim() || !form.translation.trim()}>
            <Icon name={editing ? 'check' : 'plus'} size={18} /> {editing ? 'Сохранить' : 'Добавить'}
          </button>
          {editing && (
            <button className="btn" type="button" onClick={() => { setEditing(null); setForm(emptyForm) }}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <section className="card">
        <div className="section-head">
          <h2>Мой словарь</h2>
          <button className="btn" disabled={!items.length} onClick={() => downloadFile(`phrases-anki-${today}.csv`, toAnkiCsv(items), 'text/csv;charset=utf-8')}>
            <Icon name="download" size={18} /> CSV для Anki
          </button>
        </div>
        <label className="search">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder="Поиск" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        {!list.length && <p className="muted small">{items.length ? 'Ничего не найдено.' : 'Пока нет фраз.'}</p>}
        <ul className="phrase-list">
          {list.map((p) => (
            <li key={p.id}>
              <div className="phrase-main">
                <b lang="en">{p.phrase}</b> — {p.translation}
                {p.example && <div className="muted small" lang="en">{p.example}</div>}
                <div className="phrase-meta">
                  <span className="boxes" aria-label={`Коробка ${p.box + 1} из ${BOXES}`}>
                    {Array.from({ length: BOXES }, (_, i) => (
                      <i key={i} className={i <= p.box ? 'on' : ''} />
                    ))}
                  </span>
                  <span className="muted small">
                    {p.due <= today ? 'повторить сегодня' : `повтор ${formatShort(p.due)}`}
                  </span>
                </div>
              </div>
              <div className="phrase-actions">
                <button className="chip" onClick={() => { setEditing(p); setForm({ phrase: p.phrase, translation: p.translation, example: p.example }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  Изменить
                </button>
                <button className="icon-btn" aria-label="Удалить" onClick={() => confirm(`Удалить «${p.phrase}»?`) && remove('phrases', p.id)}>
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        {items.length > 0 && (
          <p className="muted small">
            {items.length} {plural(items.length, ['фраза', 'фразы', 'фраз'])}. В Anki: Файл → Импорт → выберите CSV; поля
            идут в порядке «фраза, перевод, пример».
          </p>
        )}
      </section>
    </>
  )
}
