import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CircleCheckIcon } from "lucide-react"

import { clearToken, getToken } from "@/lib/api"
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "@/lib/auth-storage"
import { login as loginRequest } from "@/features/auth/api/login"
import { logout as logoutRequest } from "@/features/auth/api/logout"

export type User = {
  id: string
  name: string
  email: string
  /** Selected tenant/namespace key from OTP step. */
  namespace?: string
  /** Human-friendly county name for header display, e.g. 'Lassen County'. */
  countyName?: string
  avatar?: string
}

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** After login when `nextPage` is `dashboard`; token is already in storage from `loginRequest`. */
  establishDashboardSession: (user: User) => void
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
  const queryClient = useQueryClient()

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

  const signOut = useCallback(() => {
    void logoutRequest()
      .then(() => {
        toast.success("Logged out successfully", {
          icon: (
            <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
          ),
        })
      })
      .catch(() => {
        // Ignore API errors; still clear client-side session.
        toast.success("Logged out successfully", {
          icon: (
            <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
          ),
        })
      })
    setUser(null)
    queryClient.clear()
    clearToken()
    clearStoredUser()
  }, [queryClient])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: isLoading || authLoading,
      signIn,
      establishDashboardSession,
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
