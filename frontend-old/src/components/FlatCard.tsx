import type { FlatDto } from '../types'

function npr(n: number) {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(
    n,
  )
}

export function FlatCard({ flat }: { flat: FlatDto }) {
  return (
    <article className="card">
      <h3>{flat.title}</h3>
      <p className="muted">
        {flat.locationArea} · {flat.rooms} BR
        {flat.areaSqM != null ? ` · ${flat.areaSqM} m²` : ''}
      </p>
      <p style={{ fontWeight: 700, color: 'var(--accent)', marginTop: '0.5rem' }}>{npr(flat.priceMonthly)}/mo</p>
      <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', marginBottom: 0 }}>{flat.description}</p>
    </article>
  )
}
