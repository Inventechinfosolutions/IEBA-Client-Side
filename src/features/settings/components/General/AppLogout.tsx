import { useCallback, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useGetInactivityTime } from "./queries"
import { useQuery } from "@tanstack/react-query"
import { getToken, refreshAccessToken } from "@/lib/api"

/**
 * Decode the `exp` claim (seconds-since-epoch) from a JWT without
 * verifying the signature — we just need the expiry time on the client.
 */
function getTokenExpiryMs(token: string): number | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>
    const exp = payload.exp
    if (typeof exp !== "number") return null
    return exp * 1000
  } catch {
    return null
  }
}

// ─── Module-level activity tracking (survives component re-renders) ──────────
let lastActivityTime = Date.now()

const syncActivity = () => {
  lastActivityTime = Date.now()
}

if (typeof window !== "undefined") {
  const activityEvents = ["mousemove", "keypress", "click", "scroll", "touchstart"]
  activityEvents.forEach((event) => {
    window.addEventListener(event, syncActivity, { passive: true })
  })

  window.addEventListener("storage", (e) => {
    if (e.key === "SCREEN_INACTIVITY_TIME_IN_MIN") {
      syncActivity()
    }
  })
}
// ─────────────────────────────────────────────────────────────────────────────

export function AppLogout() {
  const { signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { data: minutes = 120 } = useGetInactivityTime()
  const didTriggerRef = useRef(false)

  // Reset the triggered flag when auth state resets (new login).
  useEffect(() => {
    if (!isAuthenticated) {
      didTriggerRef.current = false
    }
  }, [isAuthenticated])

  const performLogoutAction = useCallback(() => {
    if (didTriggerRef.current) return
    didTriggerRef.current = true
    signOut()
    navigate("/login")
  }, [signOut, navigate])

  useQuery({
    queryKey: ["app-inactivity-status", isAuthenticated, minutes],
    queryFn: async () => {
      if (!isAuthenticated || minutes <= 0) return "active"

      const now = Date.now()

      // ── Check 1: inactivity timeout ──────────────────────────────────────
      const thresholdMs = minutes * 60 * 1000
      if (now - lastActivityTime >= thresholdMs) {
        performLogoutAction()
        return "logged-out"
      }

      // ── Check 2: access-token expiry → refresh, don't kick active users ──
      // Short-lived access tokens (~15m) must not force logout while the user
      // is still active and the refresh cookie is valid. Only log out if
      // refresh fails (refresh session truly expired).
      const token = getToken()
      if (token) {
        const expiryMs = getTokenExpiryMs(token)
        if (expiryMs !== null && now >= expiryMs) {
          const newToken = await refreshAccessToken()
          if (!newToken) {
            performLogoutAction()
            return "logged-out"
          }
        }
      }

      return "active"
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    enabled: isAuthenticated && minutes > 0,
  })

  return null
}
