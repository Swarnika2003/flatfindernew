export type FlatDto = {
  id: number
  title: string
  description: string
  locationArea: string
  city: string
  priceMonthly: number
  rooms: number
  areaSqM: number | null
  listedAt: string
}

export type PagedFlats = {
  items: FlatDto[]
  totalCount: number
  page: number
  pageSize: number
}

export type PreferenceDto = {
  minPrice: number | null
  maxPrice: number | null
  preferredRooms: number | null
  preferredAreas: string | null
  updatedAt: string
}

export type AuthResponse = {
  token: string
  email: string
  displayName: string
  expiresAt: string
}
