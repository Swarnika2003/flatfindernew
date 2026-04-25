import { createContext, useContext, useState, type ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
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

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Mock login - replace with actual API call
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0],
      email,
    }
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
    return true
  }

  const register = async (name: string, email: string, _password: string): Promise<boolean> => {
    // Mock register - replace with actual API call
    const mockUser: User = {
      id: '1',
      name,
      email,
    }
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
    return true
  }

  const logout = () => {
    setUser(null)
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
