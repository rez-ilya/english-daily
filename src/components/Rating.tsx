/** Оценка 1–5. Повторное нажатие на выбранное значение сбрасывает оценку. */
export function Rating({
  value,
  onChange,
  label,
}: {
  value?: number
  onChange: (v: number | undefined) => void
  label: string
}) {
  return (
    <div className="rating" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          className={value === n ? 'on' : value && n < value ? 'below' : ''}
          onClick={() => onChange(value === n ? undefined : n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
