// Небольшой набор линейных иконок (stroke = currentColor).
const PATHS = {
  today: 'M4 7h16M4 7v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2M8 2v4M16 2v4M8.5 14l2.5 2.5 4.5-5',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  pen: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  alert: 'M5 4h11l3 3v13H5zM9 10h6M9 14h6M9 18h3',
  cards: 'M4 7h12v13H4zM8 7V4h12v13h-4',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  data: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  play: 'M8 5v14l11-7z',
  pause: 'M8 5v14M16 5v14',
  reset: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  check: 'M5 12.5l4.5 4.5L19 7',
  stop: 'M7 7h10v10H7z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  sound: 'M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const filled = name === 'play'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
