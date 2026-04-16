import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useGetInactivityTime } from "./queries"
import { useQuery } from "@tanstack/react-query"

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

export function AppLogout() {
  const { signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { data: minutes = 120 } = useGetInactivityTime()

  const performLogoutAction = useCallback(() => {
    signOut()
    navigate("/login")
  }, [signOut, navigate])

    
  useQuery({
    queryKey: ["app-inactivity-status", isAuthenticated, minutes],
    queryFn: () => {
      if (!isAuthenticated || minutes <= 0) return "active"
      
      const now = Date.now()
      const thresholdMs = minutes * 60 * 1000
      
      if (now - lastActivityTime >= thresholdMs) {
        performLogoutAction()
        return "logged-out"
      }
      
      return "active"
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    enabled: isAuthenticated && minutes > 0,
  })

  return null
}
