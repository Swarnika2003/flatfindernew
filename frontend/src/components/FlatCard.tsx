import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react'
import { useState } from 'react'
import { formatNpr } from '../lib/utils'

export interface Flat {
  id: string
  title: string
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  image: string
  isFavorite?: boolean
}

interface FlatCardProps {
  flat: Flat
  onFavoriteToggle?: (id: string) => void
}

export default function FlatCard({ flat, onFavoriteToggle }: FlatCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(flat.isFavorite || false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
    onFavoriteToggle?.(flat.id)
  }

  return (
    <div
      className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={flat.image}
          alt={flat.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'
            }`}
          />
        </button>
        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-sm">
          <span className="text-lg font-semibold text-foreground">
            {formatNpr(flat.price)}
          </span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground line-clamp-1 mb-2">
          {flat.title}
        </h3>
        <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm line-clamp-1">{flat.location}</span>
        </div>
        
        {/* Details */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{flat.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{flat.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{flat.area} sq m</span>
          </div>
        </div>
      </div>
    </div>
  )
}
