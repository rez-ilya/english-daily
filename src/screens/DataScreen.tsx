import { useEffect, useState } from 'react'
import { downloadFile, exportBackup, importBackup } from '../db/backup'
import { todayISO } from '../lib/date'
import { Icon } from '../components/Icon'

export default function DataScreen() {
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [usage, setUsage] = useState<string | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
    navigator.storage?.estimate?.().then((e) => e.usage !== undefined && setUsage(`${(e.usage / 1024 / 1024).toFixed(1)} МБ`))
  }, [status])

  async function doExport() {
    setBusy(true)
    try {
      const b = await exportBackup()
      downloadFile(`english-backup-${todayISO()}.json`, JSON.stringify(b), 'application/json')
      setStatus('Файл резервной копии скачан.')
    } catch (e) {
      setStatus(`Не удалось сделать копию: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function doImport(file: File) {
    if (!confirm('Импорт заменит ВСЕ текущие данные содержимым файла. Продолжить?')) return
    setBusy(true)
    try {
      const n = await importBackup(await file.text())
      setStatus(
        `Восстановлено: дней ${n.days}, записей ${n.recordings}, текстов ${n.texts}, ошибок ${n.mistakes}, фраз ${n.phrases}.`,
      )
    } catch (e) {
      setStatus(`Не удалось импортировать: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <header className="day-head">
        <h1>Данные</h1>
      </header>

      <section className="card">
        <h2>Резервная копия</h2>
        <p className="muted small">
          Все данные — отметки, записи голоса, тексты, ошибки и фразы — хранятся только в этом браузере.
          Время от времени сохраняйте копию в файл, чтобы ничего не потерять и перенести данные на другое устройство.
        </p>
        <div className="row">
          <button className="btn primary" onClick={doExport} disabled={busy}>
            <Icon name="download" size={18} /> Экспорт в JSON
          </button>
          <label className={`btn ${busy ? 'disabled' : ''}`}>
            <Icon name="upload" size={18} /> Импорт из JSON
            <input
              type="file"
              accept="application/json,.json"
              hidden
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void doImport(f)
              }}
            />
          </label>
        </div>
        {busy && <p className="muted small">Подождите…</p>}
        {status && <p className="status">{status}</p>}
      </section>

      <section className="card">
        <h2>Хранилище</h2>
        <p className="muted small">Занято: {usage ?? '—'}.</p>
        {persisted === false && (
          <>
            <p className="muted small">
              Браузер может удалить данные при нехватке места. Можно попросить его хранить их постоянно.
            </p>
            <button className="btn" onClick={() => navigator.storage.persist().then(setPersisted)}>
              Хранить постоянно
            </button>
          </>
        )}
        {persisted && <p className="muted small">Браузер хранит данные постоянно.</p>}
      </section>
    </div>
  )
}
