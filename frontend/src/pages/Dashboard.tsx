import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Home,
  Heart,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Trash2,
} from 'lucide-react'
import AddFlatForm from '../components/AddFlatForm'
import Messages from '../components/Messages'
import EmptyState from '../components/EmptyState'
import { apiFetch, type FavoriteDto, type PagedResult } from '../lib/api'
import { Button } from '../components/ui/button'
import { formatNpr } from '../lib/utils'

type TabType = 'listings' | 'favorites' | 'messages' | 'settings'

export default function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('listings')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteDto[]>([])
  const [favLoading, setFavLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (activeTab === 'favorites') {
      loadFavorites()
    }
  }, [activeTab, refreshKey])

  const loadFavorites = async () => {
    setFavLoading(true)
    try {
      const data = await apiFetch<PagedResult<FavoriteDto>>('/api/flats/favorites')
      setFavorites(data.items)
    } catch (err) {
      console.error(err)
    } finally {
      setFavLoading(false)
    }
  }

  const removeFavorite = async (flatId: number) => {
    try {
      await apiFetch(`/api/flats/${flatId}/favorite`, { method: 'DELETE' })
      setFavorites((prev) => prev.filter((f) => f.flatId !== flatId))
    } catch (err) {
      console.error(err)
    }
  }

  const sidebarItems = [
    { id: 'listings' as const, label: 'My Listings', icon: Home },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
    { id: 'messages' as const, label: 'Messages', icon: Mail },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-[calc(100vh-10rem)] flex">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                    <span className="text-sidebar-primary-foreground font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sidebar-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      activeTab === item.id
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-8">
          {/* Mobile Header */}
          <div className="flex items-center gap-4 mb-6 lg:hidden">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">
              {sidebarItems.find((item) => item.id === activeTab)?.label}
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {sidebarItems.find((item) => item.id === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeTab === 'listings' && 'Manage your property listings'}
                {activeTab === 'favorites' && 'Your saved properties'}
                {activeTab === 'messages' && 'Inquiries from interested tenants'}
                {activeTab === 'settings' && 'Account preferences'}
              </p>
            </div>
            {activeTab === 'listings' && <AddFlatForm onFlatAdded={() => setRefreshKey((k) => k + 1)} />}
          </div>

          {/* Content */}
          {activeTab === 'listings' && (
            <>
              <div className="lg:hidden mb-6">
                <AddFlatForm onFlatAdded={() => setRefreshKey((k) => k + 1)} />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                Your listings will appear here. Currently, you can search and favorite properties from other users.
              </div>
            </>
          )}

          {activeTab === 'favorites' && (
            <>
              {favLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-72 bg-muted rounded-lg"></div>
                  ))}
                </div>
              ) : favorites.length === 0 ? (
                <EmptyState
                  title="No favorites yet"
                  description="Start by marking properties as favorites to save them for later."
                  action={{
                    label: 'Browse Properties',
                    onClick: () => (window.location.href = '/'),
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={`https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=60&sig=${fav.flatId}`}
                        alt={fav.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{fav.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {fav.locationArea}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-green-600 font-bold text-lg">
                              {formatNpr(fav.priceMonthly)}/month
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fav.rooms} BHK • {fav.areaSqM} m²
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`/flats/${fav.flatId}`}
                            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center text-sm font-medium"
                          >
                            View Details
                          </a>
                          <button
                            onClick={() => removeFavorite(fav.flatId)}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'messages' && <Messages />}

          {activeTab === 'settings' && (
            <div className="bg-card rounded-lg border border-border p-8">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              <p className="text-muted-foreground">Settings options coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
