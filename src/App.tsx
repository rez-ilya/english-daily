import { lazy, Suspense } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './components/Icon'
import { TimerPill } from './components/TimerPill'
import DataScreen from './screens/DataScreen'
import Mistakes from './screens/Mistakes'
import Phrases from './screens/Phrases'
import Recorder from './screens/Recorder'
import Today from './screens/Today'
import Writing from './screens/Writing'

// Экран с графиками грузится отдельно: библиотека графиков тяжёлая.
const Progress = lazy(() => import('./screens/Progress'))

// desktopOnly — пункт только в боковом меню; на телефоне он доступен с экрана «Прогресс».
const NAV: { to: string; label: string; icon: IconName; desktopOnly?: boolean }[] = [
  { to: '/', label: 'Сегодня', icon: 'today' },
  { to: '/recorder', label: 'Запись', icon: 'mic' },
  { to: '/writing', label: 'Письмо', icon: 'pen' },
  { to: '/mistakes', label: 'Ошибки', icon: 'alert' },
  { to: '/phrases', label: 'Фразы', icon: 'cards' },
  { to: '/progress', label: 'Прогресс', icon: 'chart' },
  { to: '/data', label: 'Данные', icon: 'data', desktopOnly: true },
]

export default function App() {
  const { pathname } = useLocation()
  return (
    <div className="app">
      <nav className="nav" aria-label="Разделы">
        <div className="nav-brand">English Daily</div>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `nav-item ${n.desktopOnly ? 'desktop-only' : ''} ${isActive || (n.to === '/' && pathname.startsWith('/day/')) ? 'active' : ''}`
            }
          >
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="main">
        <Suspense fallback={<div className="screen" />}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/day/:date" element={<Today />} />
            <Route path="/recorder" element={<Recorder />} />
            <Route path="/recorder/:date" element={<Recorder />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/writing/:date" element={<Writing />} />
            <Route path="/mistakes" element={<Mistakes />} />
            <Route path="/phrases" element={<Phrases />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/data" element={<DataScreen />} />
            <Route path="*" element={<Today />} />
          </Routes>
        </Suspense>
      </main>
      <TimerPill />
    </div>
  )
}
