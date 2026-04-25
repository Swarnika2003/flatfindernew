import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Phone, Mail, MapPin, DoorOpen, Ruler, Calendar, ArrowLeft } from 'lucide-react'
import { apiFetch, type FlatDetail, type CreateMessageRequest } from '../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { formatNpr } from '../lib/utils'

export default function FlatDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [flat, setFlat] = useState<FlatDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    senderEmail: '',
    senderPhone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    const loadFlat = async () => {
      if (!id) return
      try {
        const data = await apiFetch<FlatDetail>(`/api/flats/${id}`, { skipAuth: true })
        setFlat(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flat')
      } finally {
        setLoading(false)
      }
    }
    loadFlat()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!flat) return

    setSubmitting(true)
    try {
      const payload: CreateMessageRequest = {
        ...formData,
        flatId: flat.id,
      }
      await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      })
      setSubmitSuccess(true)
      setFormData({ subject: '', body: '', senderEmail: '', senderPhone: '' })
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!flat) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">{error || 'Flat not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Details */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <img
              src={`https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=60&sig=${flat.id}`}
              alt={flat.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{flat.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4" />
                {flat.locationArea}, {flat.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-green-600">{formatNpr(flat.priceMonthly)}/month</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <DoorOpen className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rooms</p>
                    <p className="font-semibold">{flat.rooms} BHK</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Area</p>
                    <p className="font-semibold">{flat.areaSqM} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Listed</p>
                    <p className="font-semibold">{new Date(flat.listedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{flat.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form & Owner Info */}
        <div className="space-y-6">
          {/* Owner Info */}
          {flat.ownerName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{flat.ownerName}</p>
                </div>
                {flat.ownerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm break-all">{flat.ownerEmail}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Owner</CardTitle>
              <CardDescription>Send a message to the property owner</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Your Email</label>
                  <Input
                    type="email"
                    name="senderEmail"
                    placeholder="your@email.com"
                    value={formData.senderEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Your Phone</label>
                  <Input
                    type="tel"
                    name="senderPhone"
                    placeholder="+977-XXXXXXXXXX"
                    value={formData.senderPhone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <Input
                    type="text"
                    name="subject"
                    placeholder="Inquiry about the flat"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <Textarea
                    name="body"
                    placeholder="Tell the owner more about your interest..."
                    rows={5}
                    value={formData.body}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {submitSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                    Message sent successfully!
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
