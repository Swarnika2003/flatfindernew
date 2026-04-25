import { Search, MapPin,IndianRupee,BedDouble } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FlatCard, { type Flat } from '../components/FlatCard'
import FlatCardSkeleton from '../components/FlatCardSkeleton'
import EmptyState from '../components/EmptyState'
import { apiFetch, type BackendFlat } from '../lib/api'

function toFlat(raw: BackendFlat): Flat {
  return {
    id: String(raw.id),
    title: raw.title,
    location: `${raw.locationArea}, ${raw.city}`,
    price: raw.priceMonthly,
    bedrooms: raw.rooms,
    bathrooms: Math.max(1, Math.ceil(raw.rooms / 2)),
    area: raw.areaSqM ?? 0,
    image: `https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=60&sig=${raw.id}`,
    isFavorite: false,
  }
}

export default function Home() {
  const navigate = useNavigate()
  const [location, setLocation] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [rooms, setRooms] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [flats, setFlats] = useState<Flat[]>([])
  const [error, setError] = useState('')

  const loadFlats = async (filters?: { location?: string; minPrice?: string; maxPrice?: string; rooms?: string }) => {
    setIsLoading(true)
    setError('')
    const params = new URLSearchParams({ page: '1', pageSize: '12' })
    if (filters?.location?.trim()) params.set('location', filters.location.trim())
    if (filters?.minPrice?.trim()) params.set('minPrice', filters.minPrice.trim())
    if (filters?.maxPrice?.trim()) params.set('maxPrice', filters.maxPrice.trim())
    if (filters?.rooms?.trim()) params.set('rooms', filters.rooms.trim())
    try {
      const data = await apiFetch<{ items: BackendFlat[] }>(`/api/flats/search?${params.toString()}`)
      setFlats((data.items || []).map(toFlat))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load flats.')
      setFlats([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadFlats()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    let minPrice = ''
    let maxPrice = ''
    if (priceRange.includes('-')) {
      const [min, max] = priceRange.split('-')
      minPrice = min || ''
      maxPrice = max || ''
    } else if (priceRange === '120000+') {
      minPrice = '120000'
    }
    void loadFlats({ location, minPrice, maxPrice, rooms })
  }

  const handleFavoriteToggle = async (id: string) => {
    const flatId = parseInt(id)
    const currentFlat = flats.find((f) => f.id === id)
    if (!currentFlat) return

    try {
      if (currentFlat.isFavorite) {
        // Remove favorite
        await apiFetch(`/api/flats/${flatId}/favorite`, { method: 'DELETE' })
      } else {
        // Add favorite
        await apiFetch(`/api/flats/${flatId}/favorite`, { method: 'POST' })
      }

      setFlats((prev) =>
        prev.map((flat) =>
          flat.id === id ? { ...flat, isFavorite: !flat.isFavorite } : flat
        )
      )
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-accent to-background py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">
              Find Your Perfect Flat in Kathmandu
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Explore verified rental listings across Kathmandu neighborhoods with local pricing in Nepali Rupees.
            </p>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-4xl mx-auto bg-card rounded-2xl shadow-lg border border-border p-4 md:p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Location */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Area in Kathmandu (e.g. Baneshwor)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Price Range */}
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Monthly Rent (NPR)</option>
                  <option value="0-5000">NPR 0 - NPR 5,000</option>
                  
                  <option value="5000-15000">NPR 5,000 - NPR 15,000</option>
                  <option value="15000-30000">NPR 15,000 - NPR 30,000</option>
                  <option value="30000-50000">NPR 30,000 - NPR 50,000</option>
                  <option value="50000-100000">NPR 50,000 - NPR 1,00,000</option>
                  <option value="100000+">NPR 1,00,000+</option>
                </select>
              </div>

              {/* Rooms */}
              <div className="relative">
                <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Bedrooms</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search Flats
            </button>
          </form>
        </div>
      </section>

      {/* Featured Flats Section */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Featured Kathmandu Listings
              </h2>
              <p className="text-muted-foreground">
                Handpicked properties across Kathmandu Valley
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <FlatCardSkeleton key={i} />
              ))}
            </div>
          ) : flats.length === 0 ? (
            <EmptyState
              title="No flats found"
              description={error || 'We could not find any flats matching your criteria. Try adjusting your search filters.'}
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setLocation('')
                  setPriceRange('')
                  setRooms('')
                  void loadFlats()
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {flats.map((flat) => (
                <div key={flat.id} className="cursor-pointer">
                  <div
                    onClick={() => navigate(`/flats/${flat.id}`)}
                  >
                    <FlatCard
                      flat={flat}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
