import { createContext, useContext, useState, type ReactNode } from 'react'
import { apiFetch, setToken } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthResponse {
  token: string
  email: string
  displayName: string
  expiresAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      })
      const userData: User = {
        id: '1', // We don't have id in response, but can get from /me later
        name: response.displayName,
        email: response.email,
      }
      setUser(userData)
      setToken(response.token)
      localStorage.setItem('user', JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName: name }),
        skipAuth: true,
      })
      const userData: User = {
        id: '1',
        name: response.displayName,
        email: response.email,
      }
      setUser(userData)
      setToken(response.token)
      localStorage.setItem('user', JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('Register failed:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
