import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { clearToken, getToken, setToken } from "@/lib/api"
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "@/lib/auth-storage"
import { login as loginRequest } from "@/features/auth/api/login"

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
  /** After login when `nextPage` is `dashboard`; token is already in storage from `loginRequest`. */
  establishDashboardSession: (user: User) => void
  /** Completes OTP flow: sets user + token without API, so user can reach dashboard after county selection. */
  completeOtpSignIn: (email: string) => void
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

  const establishDashboardSession = useCallback((authUser: User) => {
    setError(null)
    setUser(authUser)
    setStoredUser(authUser)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    setAuthLoading(true)
    try {
      const result = await loginRequest({ email, password })
      if (result.nextPage === "otp") {
        throw new Error("OTP verification required. Use the login screen to continue.")
      }
      const authUser: User = {
        id: result.userId,
        name: result.loginId.includes("@")
          ? (result.loginId.split("@")[0] ?? "User")
          : result.loginId,
        email: result.loginId,
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

  /** Sets user and token so dashboard is accessible after OTP + county selection. No API call. */
  const completeOtpSignIn = useCallback((email: string) => {
    setError(null)
    const authUser: User = {
      id: "otp-user",
      name: email.split("@")[0] || "User",
      email: email.trim(),
    }
    setToken("otp-session-token")
    setUser(authUser)
    setStoredUser(authUser)
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
      establishDashboardSession,
      completeOtpSignIn,
      signOut,
      error,
      clearError,
    }),
    [
      user,
      isLoading,
      authLoading,
      signIn,
      establishDashboardSession,
      completeOtpSignIn,
      signOut,
      error,
      clearError,
    ]
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
