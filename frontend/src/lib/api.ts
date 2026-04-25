const TOKEN_KEY = 'flatfinder_token'

export interface AuthResponse {
  token: string
  email: string
  displayName: string
}

export interface BackendFlat {
  id: number
  title: string
  description: string
  locationArea: string
  city: string
  priceMonthly: number
  rooms: number
  areaSqM?: number | null
}

export interface FlatDetail extends BackendFlat {
  ownerName?: string
  ownerEmail?: string
}

export interface CreateFlatRequest {
  title: string
  description: string
  locationArea: string
  city: string
  priceMonthly: number
  rooms: number
  areaSqM?: number
}

export interface FavoriteDto {
  id: number
  flatId: number
  title: string
  locationArea: string
  priceMonthly: number
  rooms: number
  areaSqM?: number
  favoritedAt: string
}

export interface MessageDto {
  id: number
  subject: string
  body: string
  senderEmail: string
  senderPhone: string
  senderName: string
  flatId: number
  flatTitle: string
  sentAt: string
  isRead: boolean
}

export interface CreateMessageRequest {
  subject: string
  body: string
  senderEmail: string
  senderPhone: string
  flatId: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

export interface PreferencesDto {
  minPrice?: number | null
  maxPrice?: number | null
  preferredRooms?: number | null
  preferredAreas?: string | null
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (!options.skipAuth) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(path, { ...options, headers })
  const text = await res.text()
  let data: { error?: string } & T = {} as { error?: string } & T
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string } & T
    } catch {
      throw new Error('Invalid response from server.')
    }
  }

  if (!res.ok) {
    const fallback = res.status === 401 ? 'Authentication failed.' : `Request failed (${res.status}).`
    throw new Error(data.error || fallback)
  }
  return data as T
}
