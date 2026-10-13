import type { Material } from '../plan/plan'
import { Icon } from './Icon'

export function Materials({ items }: { items: Material[] }) {
  if (!items.length) return null
  return (
    <ul className="materials">
      {items.map((m) => (
        <li key={m.url + m.title}>
          <a href={m.url} target="_blank" rel="noopener noreferrer">
            <span className="badge">{m.type}</span>
            <span className="material-title">{m.title}</span>
            <Icon name="external" size={16} />
          </a>
        </li>
      ))}
    </ul>
  )
}
