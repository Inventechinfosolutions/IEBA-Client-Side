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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { clearToken, getToken, setToken } from "@/lib/api"
import {
  clearExplicitLogout,
  clearStoredUser,
  getStoredUser,
  markExplicitLogout,
  setStoredUser,
  wasExplicitLogout,
} from "@/lib/auth-storage"
import { clearStoredMimicSession } from "@/features/user/user-mimic/storage"
import { clearStoredReportFormParams } from "@/features/reports/utils/reportFormSessionStorage"
import { login as loginRequest } from "@/features/auth/api/login"
import { logout as logoutRequest } from "@/features/auth/api/logout"
import { getUserDetails } from "@/features/auth/api/getUserDetails"
import { buildAuthUserFromDetails } from "@/features/auth/utils/buildAuthUser"
import { restoreSessionFromRefreshCookie } from "@/features/auth/utils/restoreSession"
import { isSigningOut, setSigningOut } from "@/features/auth/utils/signOutState"
import type { AuthContextValue, User } from "./types"

const AuthContext = createContext<AuthContextValue | null>(null)
const AUTH_SESSION_QUERY_KEY = ["auth", "session"] as const

function isAuthSessionQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === "auth" && queryKey[1] === "session"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const queryClient = useQueryClient()

  if (typeof window !== "undefined") {
    ;(window as Window & { showSessionExpired?: () => void }).showSessionExpired = () => {
      setSessionExpired(true)
      ;(window as Window & { isSessionExpiredOpen?: boolean }).isSessionExpiredOpen = true
    }
  }

  const { data: queryUser, isLoading: sessionLoading } = useQuery<User | null>({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: async () => {
      const token = getToken()
      const storedUser = getStoredUser()
      if (token && storedUser) {
        return storedUser
      }

      if (isSigningOut() || wasExplicitLogout()) {
        return null
      }

      const restored = await restoreSessionFromRefreshCookie()
      if (restored) {
        setStoredUser(restored)
        return restored
      }

      clearToken()
      clearStoredUser()
      return null
    },
    staleTime: Infinity,
    retry: false,
  })
  const user: User | null = queryUser ?? null

  const establishDashboardSession = useCallback(
    (authUser: User) => {
      setSigningOut(false)
      clearExplicitLogout()
      setError(null)
      setStoredUser(authUser)
      queryClient.setQueryData<User | null>(AUTH_SESSION_QUERY_KEY, authUser)
    },
    [queryClient]
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      setSigningOut(false)
      clearExplicitLogout()
      setError(null)
      setAuthLoading(true)
      try {
        const result = await loginRequest({ email, password })
        if (result.nextPage === "otp") {
          return result
        }

        setToken(result.accessToken)
        let authUser: User
        try {
          const details = await getUserDetails(result.userId)
          authUser = buildAuthUserFromDetails(
            result.userId,
            result.loginId,
            details
          )
        } catch {
          authUser = {
            id: result.userId,
            name: result.loginId.split("@")[0] || result.loginId,
            email: result.loginId,
          }
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
    setSigningOut(true)
    markExplicitLogout()

    // Reset theme to light mode on logout
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", "light")
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }

    // Call logout while access token is still in sessionStorage (backend requires Bearer).
    const logoutPromise = logoutRequest()
      .then(() => {
        toast.success("Logged out successfully", {
          icon: (
            <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
          ),
        })
      })
      .catch(() => {
        toast.success("Logged out successfully", {
          icon: (
            <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
          ),
        })
      })

    clearToken()
    clearStoredUser()
    clearStoredMimicSession()
    clearStoredReportFormParams()
    localStorage.removeItem("SCREEN_INACTIVITY_TIME_IN_MIN")
    localStorage.removeItem("APP_LAST_ACTIVITY_TIME")

    void queryClient.cancelQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
    queryClient.setQueryData<User | null>(AUTH_SESSION_QUERY_KEY, null)
    queryClient.removeQueries({
      predicate: (query) => !isAuthSessionQueryKey(query.queryKey),
    })

    void logoutPromise
  }, [queryClient])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: sessionLoading || authLoading,
      isInitialLoading: sessionLoading,
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
    <AuthContext.Provider value={value}>
      {children}
      <Dialog
        open={sessionExpired}
        onOpenChange={(open) => {
          setSessionExpired(open)
          if (!open && typeof window !== "undefined") {
            ;(window as Window & { isSessionExpiredOpen?: boolean }).isSessionExpiredOpen =
              false
          }
        }}
      >
        <DialogContent
          className="max-w-[400px]!"
          overlayClassName="bg-black/60!"
          showClose={false}
        >
          <DialogHeader>
            <DialogDescription className="text-foreground! font-medium">
              Session expired. Please logout and login again
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setSessionExpired(false)
                if (typeof window !== "undefined") {
                  ;(window as Window & { isSessionExpiredOpen?: boolean }).isSessionExpiredOpen =
                    false
                }
                signOut()
              }}
              className="rounded-[6px]! bg-[#6C5DD3] hover:bg-[#5a4eb3] text-white border-transparent"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
