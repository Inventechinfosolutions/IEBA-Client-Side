import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { clearToken, getToken } from "@/lib/api"
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "@/lib/auth-storage"
import { login as loginApi } from "@/features/auth/api/login"

export type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restoreSession = useCallback(() => {
    const token = getToken()
    const storedUser = getStoredUser()
    if (token && storedUser) {
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    setAuthLoading(true)
    try {
      const result = await loginApi({ email, password })
      const authUser: User = {
        id: result.id,
        name: result.name,
        email: result.email,
        avatar: result.avatar,
      }
      setUser(authUser)
      setStoredUser(authUser)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
      throw err
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    clearToken()
    clearStoredUser()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: isLoading || authLoading,
      signIn,
      signOut,
      error,
      clearError,
    }),
    [user, isLoading, authLoading, signIn, signOut, error, clearError]
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
