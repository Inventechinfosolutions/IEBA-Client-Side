import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
import type { AuthContextValue, User } from "./types"

const AuthContext = createContext<AuthContextValue | null>(null)
const AUTH_SESSION_QUERY_KEY = ["auth", "session"] as const

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: queryUser, isLoading: sessionLoading } = useQuery<User | null>({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: async () => {
      const token = getToken()
      const storedUser = getStoredUser()
      if (token && storedUser) {
        return storedUser
      }
      return null
    },
  })
  const user: User | null = queryUser ?? null

  const establishDashboardSession = useCallback(
    (authUser: User) => {
      setError(null)
      setStoredUser(authUser)
      queryClient.setQueryData<User | null>(AUTH_SESSION_QUERY_KEY, authUser)
    },
    [queryClient]
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null)
      setAuthLoading(true)
      try {
        const result = await loginRequest({ email, password })
        if (result.nextPage === "otp") {
          throw new Error(
            "OTP verification required. Use the login screen to continue."
          )
        }
        const authUser: User = {
          id: result.userId,
          name: result.loginId.includes("@")
            ? (result.loginId.split("@")[0] ?? "User")
            : result.loginId,
          email: result.loginId,
        }
        setStoredUser(authUser)
        queryClient.setQueryData<User | null>(AUTH_SESSION_QUERY_KEY, authUser)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed"
        setError(message)
        throw err
      } finally {
        setAuthLoading(false)
      }
    },
    [queryClient]
  )

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
    queryClient.setQueryData<User | null>(AUTH_SESSION_QUERY_KEY, null)
    queryClient.clear()
    clearToken()
    clearStoredUser()
  }, [queryClient])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: sessionLoading || authLoading,
      signIn,
      establishDashboardSession,
      signOut,
      error,
      clearError,
    }),
    [
      user,
      sessionLoading,
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
