import { Fragment, useEffect, useState } from 'react'
import { put, type DeckProgressRecord } from '../db/db'
import { deck, deckQueue, getNewPerDay, imageUrl, NEW_PER_DAY_OPTIONS, setNewPerDay, type DeckCard } from '../decks/deck'
import { plural, todayISO } from '../lib/date'
import { speak, speechSupported } from '../lib/speech'
import { review } from '../lib/srs'
import { Icon } from './Icon'

/** «text **term** text» → узлы React с выделенным термином или пропуском на его месте. */
function Marked({ text, masked = false }: { text: string; masked?: boolean }) {
  const parts = text.split(/\*\*(.+?)\*\*/)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 0 ? <Fragment key={i}>{p}</Fragment> : masked ? <span key={i} className="gap" aria-label="пропуск" /> : <b key={i}>{p}</b>,
      )}
    </>
  )
}

function SpeakButton({ text, label }: { text: string; label: string }) {
  if (!speechSupported()) return null
  return (
    <button type="button" className="icon-btn speak" onClick={() => speak(text)} aria-label={label}>
      <Icon name="sound" size={22} />
    </button>
  )
}

export function DeckReview({ progress }: { progress: DeckProgressRecord[] }) {
  const [newPerDay, setLimit] = useState(getNewPerDay)
  const [session, setSession] = useState(false)
  const today = todayISO()
  const q = deckQueue(progress, today, newPerDay)
  const total = deck.notes.length * 2

  if (session && q.queue.length) {
    const card = q.queue[0]
    // key меняется при каждом новом показе (в т.ч. той же карточки после «не помню») — состояние сбрасывается
    const shownAt = progress.find((p) => p.id === card.id)?.reviewedAt ?? 0
    return <Session key={`${card.id}:${shownAt}`} card={card} left={q.queue.length} progress={progress} onClose={() => setSession(false)} />
  }

  return (
    <section className="card deck-overview">
      <div className="section-head">
        <h2>{deck.title}</h2>
        <span className="count">{deck.notes.length} {plural(deck.notes.length, ['термин', 'термина', 'терминов'])}</span>
      </div>
      <div className="deck-stats">
        <div><b>{q.due}</b><span>к повторению</span></div>
        <div><b>{q.newToday}</b><span>новых сегодня</span></div>
        <div><b>{q.started}<small> / {total}</small></b><span>начато</span></div>
        <div><b>{q.strong}</b><span>в долгой памяти</span></div>
      </div>
      <div className="field">
        <span className="field-label">Новых карточек в день</span>
        <div className="rating">
          {NEW_PER_DAY_OPTIONS.map((n) => (
            <button key={n} type="button" className={n === newPerDay ? 'on' : ''} aria-pressed={n === newPerDay}
              onClick={() => { setLimit(n); setNewPerDay(n) }}>
              {n}
            </button>
          ))}
        </div>
      </div>
      {q.queue.length ? (
        <button className="btn primary wide-btn" onClick={() => setSession(true)}>
          Начать · {q.queue.length} {plural(q.queue.length, ['карточка', 'карточки', 'карточек'])}
        </button>
      ) : (
        <p className="banner small">На сегодня всё 🎉 Завтра будут новые карточки и повторения.</p>
      )}
      <p className="muted small">
        У каждого термина две карточки: «узнать» (English → смысл) и «вспомнить» (смысл → English), вторая — на следующий день.
        Прогресс хранится в этом приложении и не связан с Anki на компьютере.
      </p>
    </section>
  )
}

function Session({ card, left, progress, onClose }: { card: DeckCard; left: number; progress: DeckProgressRecord[]; onClose: () => void }) {
  const [shown, setShown] = useState(false)
  const [hint, setHint] = useState(false)
  const n = card.note

  // Озвучить термин при показе (сессия начата нажатием, так что iOS разрешит звук).
  useEffect(() => {
    if (card.kind === 'rec') speak(n.term)
  }, [])

  const reveal = () => {
    setShown(true)
    speak(card.kind === 'prod' ? n.term : n.example)
  }

  const answer = async (ok: boolean) => {
    const today = todayISO()
    const cur = progress.find((p) => p.id === card.id) ?? { id: card.id, box: 0, due: today, introducedAt: today }
    await put('deckProgress', review(cur, ok, today))
  }

  const img = imageUrl(n)
  const termBlock = (
    <>
      <div className="deck-emoji" aria-hidden="true">{n.emoji}</div>
      <div className="deck-term" lang="en">{n.term}</div>
      <div className="deck-meta">
        {n.pos && <span className="pos">{n.pos}</span>}
        {n.ipa && <span className="ipa">{n.ipa}</span>}
        <SpeakButton text={n.term} label="Произнести термин" />
      </div>
    </>
  )
  const details = (
    <>
      {img && <img className="deck-img" src={img} alt="" loading="lazy" />}
      <div className="deck-ex" lang="en">
        <Marked text={n.example} /> <SpeakButton text={n.example} label="Произнести пример" />
      </div>
      {n.colloc.length > 0 && (
        <div className="deck-chips">
          <span className="lbl">Collocations</span>
          {n.colloc.map((c) => <span key={c} className="chip" lang="en">{c}</span>)}
        </div>
      )}
      {n.note && <div className="deck-note">💡 {n.note}</div>}
    </>
  )

  return (
    <section className="card deck-card">
      <div className="deck-top">
        <button className="icon-btn" onClick={onClose} aria-label="Завершить">
          <Icon name="left" />
        </button>
        <span className="muted small">
          {n.category} · {card.kind === 'rec' ? 'узнайте' : 'вспомните по-английски'}
        </span>
        <span className="count">{left}</span>
      </div>

      {card.kind === 'rec' ? (
        <>
          {termBlock}
          {shown && (
            <div className="deck-answer">
              <div className="deck-ru">{n.ru}</div>
              <div className="deck-def" lang="en">{n.definition}</div>
              {details}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="deck-ru">{n.ru}</div>
          <div className="deck-def" lang="en">{n.definition}</div>
          {!shown && (
            <>
              <div className="deck-ex" lang="en"><Marked text={n.example} masked /></div>
              {hint ? <div className="deck-hint" lang="en">{n.hint}</div> : (
                <button className="chip" onClick={() => setHint(true)}>Подсказка</button>
              )}
            </>
          )}
          {shown && <div className="deck-answer">{termBlock}{details}</div>}
        </>
      )}

      <div className="deck-actions">
        {shown ? (
          <>
            <button className="btn danger" onClick={() => answer(false)}>Не помню</button>
            <button className="btn primary" onClick={() => answer(true)}>Помню</button>
          </>
        ) : (
          <button className="btn primary wide-btn" onClick={reveal}>
            {card.kind === 'rec' ? 'Показать значение' : 'Показать ответ'}
          </button>
        )}
      </div>
    </section>
  )
}
