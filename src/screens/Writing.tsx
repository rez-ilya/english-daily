import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db, getAll, put, remove } from '../db/db'
import { useQuery } from '../db/useQuery'
import { formatDayMonth, plural, todayISO } from '../lib/date'
import { useDebouncedSave } from '../lib/useDebouncedSave'
import { dayWordTarget, getPlanDay, nearestPlanDay, type DayInfo } from '../plan/plan'
import { Icon } from '../components/Icon'
import { PlanDayNav } from '../components/PlanDayNav'
import { RecentMistakes } from '../components/RecentMistakes'

const CHECK_PROMPT =
  "Check my text. Correct grammar and vocabulary mistakes. List each mistake with a short explanation in Russian. Then suggest 3 more natural phrases I could use. Don't rewrite the whole text."

export const countWords = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // запасной вариант для старых браузеров и http
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.append(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}

export default function Writing() {
  const { date } = useParams()
  const day = (date && getPlanDay(date)) || nearestPlanDay(todayISO())
  // Ответ помечен датой: пока грузится новый день, старый текст в редактор не попадёт.
  const saved = useQuery(async () => ({ date: day.date, text: (await (await db()).get('texts', day.date))?.text ?? '' }), [day.date])

  return (
    <div className="screen">
      <header className="day-head">
        <h1>Письмо</h1>
      </header>
      <PlanDayNav day={day} basePath="/writing" />
      <section className="topic">
        <div className="topic-label">
          Тема <span className="meta">· {day.week.writingLength}</span>
        </div>
        <div className="topic-text" lang="en">{day.writing}</div>
      </section>
      <RecentMistakes />
      {saved?.date === day.date && <Editor key={day.date} day={day} initial={saved.text} />}
      <TextList current={day.date} />
    </div>
  )
}

function Editor({ day, initial }: { day: DayInfo; initial: string }) {
  const [text, setText] = useState(initial)
  const [copied, setCopied] = useState(false)
  const { schedule, flush } = useDebouncedSave<string>((v) =>
    v.trim() ? put('texts', { date: day.date, text: v, updatedAt: Date.now() }) : remove('texts', day.date),
  )
  const words = countWords(text)
  const target = dayWordTarget(day)
  const state = !target || !words ? '' : words < target.min ? 'under' : words > target.max ? 'over' : 'ok'

  return (
    <section className="card form">
      <textarea
        className="input writing"
        lang="en"
        spellCheck={false}
        rows={12}
        value={text}
        placeholder="Write your text here…"
        onChange={(e) => {
          setText(e.target.value)
          setCopied(false)
          schedule(e.target.value)
        }}
        onBlur={flush}
      />
      <div className="writing-bar">
        <span className={`words ${state}`}>
          {words} {plural(words, ['слово', 'слова', 'слов'])}
          {target && (
            <span className="muted">
              {' '}
              · цель {target.min === target.max ? target.min : `${target.min}–${target.max}`}
            </span>
          )}
          {!target && <span className="muted"> · {day.week.writingLength}</span>}
        </span>
        <button
          className="btn primary"
          disabled={!words}
          onClick={async () => {
            flush()
            await copyText(`${CHECK_PROMPT}\n\n${text.trim()}`)
            setCopied(true)
          }}
        >
          <Icon name={copied ? 'check' : 'copy'} size={18} />
          {copied ? 'Скопировано' : 'Скопировать для проверки'}
        </button>
      </div>
      {copied && (
        <p className="muted small">
          Вставьте в чат с ИИ-помощником. Ошибки из ответа запишите в{' '}
          <Link to="/mistakes">журнал ошибок</Link>.
        </p>
      )}
    </section>
  )
}

function TextList({ current }: { current: string }) {
  const texts = useQuery(() => getAll('texts'), [])
  if (!texts?.length) return null
  const sorted = [...texts].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <section className="card">
      <h2>Мои тексты</h2>
      <ul className="text-list">
        {sorted.map((t) => {
          const d = getPlanDay(t.date)
          const n = countWords(t.text)
          return (
            <li key={t.date} className={t.date === current ? 'current' : ''}>
              <Link to={`/writing/${t.date}`}>
                <span className="text-list-head">
                  <b>{formatDayMonth(t.date)}</b>
                  <span className="muted small">
                    {n} {plural(n, ['слово', 'слова', 'слов'])}
                  </span>
                </span>
                {d && <span className="muted small" lang="en">{d.writing}</span>}
                <span className="text-preview" lang="en">{t.text.slice(0, 140)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
