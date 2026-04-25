import { useState } from 'react'
import { apiFetch, type CreateFlatRequest } from '../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Plus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface AddFlatFormProps {
  onFlatAdded?: () => void
}

export default function AddFlatForm({ onFlatAdded }: AddFlatFormProps) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CreateFlatRequest>({
    title: '',
    description: '',
    locationArea: '',
    city: 'Kathmandu',
    priceMonthly: 0,
    rooms: 1,
    areaSqM: 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ['priceMonthly', 'rooms', 'areaSqM'].includes(name) ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await apiFetch('/api/flats', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      setFormData({
        title: '',
        description: '',
        locationArea: '',
        city: 'Kathmandu',
        priceMonthly: 0,
        rooms: 1,
        areaSqM: 0,
      })
      setOpen(false)
      onFlatAdded?.()
    } catch (err) {
      if (err instanceof Error && err.message === 'Authentication failed.') {
        logout()
        setError('Session expired. Please login again.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create flat')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        Add New Flat
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Add New Property</CardTitle>
          <CardDescription>List your property on FlatFinder</CardDescription>
        </div>
        <button onClick={() => setOpen(false)} className="p-2 hover:bg-accent rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              name="title"
              placeholder="e.g., Modern 2BHK near Naxal"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              name="description"
              placeholder="Describe your property..."
              rows={4}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                name="locationArea"
                placeholder="e.g., Naxal, Thamel"
                value={formData.locationArea}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="Kathmandu">Kathmandu</option>
                <option value="Lalitpur">Lalitpur</option>
                <option value="Bhaktapur">Bhaktapur</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Price (NPR)</label>
              <Input
                name="priceMonthly"
                type="number"
                placeholder="25000"
                value={formData.priceMonthly}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rooms</label>
              <Input
                name="rooms"
                type="number"
                min="1"
                placeholder="2"
                value={formData.rooms}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Area (m²)</label>
              <Input
                name="areaSqM"
                type="number"
                placeholder="50"
                value={formData.areaSqM}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
