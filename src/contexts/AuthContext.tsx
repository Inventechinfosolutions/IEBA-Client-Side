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
  clearStoredUser,
  getStoredUser,
  hasPasswordBeenChangedForUser,
  setStoredUser,
} from "@/lib/auth-storage"
import { clearStoredMimicSession } from "@/features/user/user-mimic/storage"
import { login as loginRequest } from "@/features/auth/api/login"
import { logout as logoutRequest } from "@/features/auth/api/logout"
import { getUserDetails } from "@/features/auth/api/getUserDetails"
import type { AuthContextValue, User } from "./types"

const AuthContext = createContext<AuthContextValue | null>(null)
const AUTH_SESSION_QUERY_KEY = ["auth", "session"] as const

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const queryClient = useQueryClient()

  if (typeof window !== "undefined") {
    (window as any).showSessionExpired = () => setSessionExpired(true)
  }

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
        // If OTP is required, return result so LoginPage can redirect
        if (result.nextPage === "otp") {
          return result
        }
        // If dashboard, fetch full details to get permissions/roles
        let roles: string[] | undefined
        let permissions: string[] | undefined
        let displayName: string | undefined
        let departmentRoles: User["departmentRoles"] | undefined
        let isPasswordChangeRequired: boolean | undefined
        
        try {
          // IMPORTANT: Set token first so getUserDetails call is authorized
          setToken(result.accessToken)
          const details = await getUserDetails(result.userId)
          roles = details.roles?.map((r) => r.name)
          permissions = details.allpermissions
          isPasswordChangeRequired = !!details.isPasswordChangeRequired
          departmentRoles = details.departmentsRoles?.map(dr => ({
            departmentId: dr.departmentId,
            roleId: dr.roleId,
            departmentName: dr.department?.name ?? "",
            roleName: dr.role?.name ?? "",
          }))
          if (!permissions || permissions.length === 0) {
            const all = new Set<string>()
            details.departmentsRoles?.forEach(dr => {
              dr.permissions?.forEach(p => all.add(p))
            })
            permissions = Array.from(all)
          }
          displayName = details.name ?? 
            [details.firstName, details.lastName]
              .filter(Boolean)
              .join(" ")
        } catch (err) {
          // Fallback if details call fails
        }

        const authUser: User = {
          id: result.userId,
          name: displayName && displayName.trim().length > 0 
            ? displayName 
            : result.loginId.split("@")[0] || result.loginId,
          email: result.loginId,
          isPasswordChangeRequired:
            isPasswordChangeRequired && !hasPasswordBeenChangedForUser(result.userId)
              ? true
              : false,
          roles,
          permissions,
          departmentRoles,
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
    clearStoredMimicSession()
    localStorage.removeItem("SCREEN_INACTIVITY_TIME_IN_MIN")
    localStorage.removeItem("APP_LAST_ACTIVITY_TIME")
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
      <Dialog open={sessionExpired} onOpenChange={setSessionExpired}>
        <DialogContent className="max-w-[400px]!" overlayClassName="bg-black/60!" showClose={false} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogDescription className="text-foreground! font-medium">
              Session Expired Please Login Again
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSessionExpired(false)} className="rounded-[6px]! bg-[#6C5DD3] hover:bg-[#5a4eb3] text-white border-transparent">OK</Button>
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
