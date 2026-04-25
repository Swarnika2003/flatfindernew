import { useCallback, useEffect, useState, type FormEvent } from 'react'
import * as signalR from '@microsoft/signalr'
import { apiFetch, getToken } from '../api/client'
import { FlatCard } from '../components/FlatCard'
import type { FlatDto, PreferenceDto } from '../types'

function mapFlat(raw: Record<string, unknown>): FlatDto {
  return {
    id: Number(raw.id),
    title: String(raw.title),
    description: String(raw.description),
    locationArea: String(raw.locationArea),
    city: String(raw.city),
    priceMonthly: Number(raw.priceMonthly),
    rooms: Number(raw.rooms),
    areaSqM: raw.areaSqM == null ? null : Number(raw.areaSqM),
    listedAt: String(raw.listedAt),
  }
}

export function Dashboard() {
  const [location, setLocation] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [rooms, setRooms] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [results, setResults] = useState<FlatDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const [recs, setRecs] = useState<FlatDto[]>([])
  const [recError, setRecError] = useState<string | null>(null)

  const [prefMin, setPrefMin] = useState('')
  const [prefMax, setPrefMax] = useState('')
  const [prefRooms, setPrefRooms] = useState('')
  const [prefAreas, setPrefAreas] = useState('')
  const [prefMsg, setPrefMsg] = useState<string | null>(null)
  const [savingPref, setSavingPref] = useState(false)

  const loadRecommendations = useCallback(async () => {
    setRecError(null)
    try {
      const data = await apiFetch<unknown[]>('/api/recommendations?take=8')
      setRecs(data.map((x) => mapFlat(x as Record<string, unknown>)))
    } catch (e) {
      setRecError(e instanceof Error ? e.message : 'Could not load recommendations.')
    }
  }, [])

  const runSearch = useCallback(
    async (p = 1) => {
      setSearchError(null)
      setSearching(true)
      setPage(p)
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('pageSize', String(pageSize))
      if (location.trim()) params.set('location', location.trim())
      if (minPrice.trim()) params.set('minPrice', minPrice.trim())
      if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
      if (rooms.trim()) params.set('rooms', rooms.trim())

      try {
        const raw = await apiFetch<Record<string, unknown>>(`/api/flats/search?${params.toString()}`)
        const items = (raw.items as Record<string, unknown>[]) || []
        setResults(items.map((x) => mapFlat(x)))
        setTotalCount(Number(raw.totalCount ?? 0))
        void loadRecommendations()
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : 'Search failed.')
        setResults([])
        setTotalCount(0)
      } finally {
        setSearching(false)
      }
    },
    [location, minPrice, maxPrice, rooms, pageSize, loadRecommendations],
  )

  useEffect(() => {
    void runSearch(1)
    // Initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const p = await apiFetch<PreferenceDto>('/api/preferences')
        setPrefMin(p.minPrice != null ? String(p.minPrice) : '')
        setPrefMax(p.maxPrice != null ? String(p.maxPrice) : '')
        setPrefRooms(p.preferredRooms != null ? String(p.preferredRooms) : '')
        setPrefAreas(p.preferredAreas ?? '')
      } catch {
        /* optional */
      }
    })()
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/listing', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build()

    conn.on('searchUpdated', () => {
      void loadRecommendations()
    })
    conn.on('preferencesUpdated', () => {
      void loadRecommendations()
    })

    void conn.start().catch(() => {
      /* SignalR optional in dev if API down */
    })

    return () => {
      void conn.stop()
    }
  }, [loadRecommendations])

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault()
    void runSearch(1)
  }

  async function onSavePreferences(e: FormEvent) {
    e.preventDefault()
    setPrefMsg(null)
    setSavingPref(true)
    const body = {
      minPrice: prefMin.trim() ? Number(prefMin) : null,
      maxPrice: prefMax.trim() ? Number(prefMax) : null,
      preferredRooms: prefRooms.trim() ? Number(prefRooms) : null,
      preferredAreas: prefAreas.trim() || null,
    }
    if (body.minPrice != null && body.maxPrice != null && body.minPrice > body.maxPrice) {
      setPrefMsg('Minimum price cannot be greater than maximum.')
      setSavingPref(false)
      return
    }
    try {
      await apiFetch('/api/preferences', { method: 'PUT', body: JSON.stringify(body) })
      setPrefMsg('Preferences saved. Recommendations will update.')
      void loadRecommendations()
    } catch (err) {
      setPrefMsg(err instanceof Error ? err.message : 'Could not save preferences.')
    } finally {
      setSavingPref(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start' }}>
      <div
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <section className="card">
          <h2>Your preferences</h2>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Used by the recommendation engine (budget, rooms, comma-separated areas e.g. Thamel, Boudha).
          </p>
          {prefMsg && (
            <div className={prefMsg.includes('saved') ? 'muted' : 'error-banner'} style={{ marginBottom: '1rem' }}>
              {prefMsg}
            </div>
          )}
          <form onSubmit={onSavePreferences}>
            <div className="field">
              <label htmlFor="prefMin">Min price (NPR)</label>
              <input id="prefMin" inputMode="numeric" value={prefMin} onChange={(e) => setPrefMin(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="prefMax">Max price (NPR)</label>
              <input id="prefMax" inputMode="numeric" value={prefMax} onChange={(e) => setPrefMax(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="prefRooms">Preferred rooms</label>
              <input id="prefRooms" inputMode="numeric" value={prefRooms} onChange={(e) => setPrefRooms(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="prefAreas">Preferred areas</label>
              <textarea
                id="prefAreas"
                rows={2}
                placeholder="Thamel, Lazimpat, Patan (Lalitpur)"
                value={prefAreas}
                onChange={(e) => setPrefAreas(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPref}>
              {savingPref ? 'Saving…' : 'Save preferences'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Search flats</h2>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            All listings are in Kathmandu Valley. Filters apply server-side with pagination (large datasets).
          </p>
          {searchError && <div className="error-banner">{searchError}</div>}
          <form onSubmit={onSearchSubmit}>
            <div className="field">
              <label htmlFor="loc">Location / keyword</label>
              <input
                id="loc"
                placeholder="Neighborhood or title"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="minP">Min NPR</label>
                <input id="minP" inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="maxP">Max NPR</label>
                <input id="maxP" inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="rooms">Rooms</label>
              <select id="rooms" value={rooms} onChange={(e) => setRooms(e.target.value)}>
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
        </section>
      </div>

      <section>
        <h2 style={{ marginBottom: '0.75rem' }}>Recommended for you</h2>
        {recError && <div className="error-banner">{recError}</div>}
        {recs.length === 0 && !recError ? (
          <div className="card empty-state">Add preferences or run a few searches to improve recommendations.</div>
        ) : (
          <div className="grid-flats">
            {recs.map((f) => (
              <FlatCard key={f.id} flat={f} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ marginBottom: 0 }}>Search results</h2>
          <span className="muted">
            {totalCount} listing{totalCount === 1 ? '' : 's'} · page {page} of {totalPages}
          </span>
        </div>
        {results.length === 0 && !searching ? (
          <div className="card empty-state" style={{ marginTop: '1rem' }}>
            No flats match these filters. Try widening price or clearing location.
          </div>
        ) : (
          <>
            <div className="grid-flats" style={{ marginTop: '1rem' }}>
              {results.map((f) => (
                <FlatCard key={f.id} flat={f} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page <= 1 || searching}
                  onClick={() => void runSearch(page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={page >= totalPages || searching}
                  onClick={() => void runSearch(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
