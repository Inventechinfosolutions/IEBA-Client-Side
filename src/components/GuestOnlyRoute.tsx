import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

type GuestOnlyRouteProps = {
  children: React.ReactNode
}

export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const { isAuthenticated, isInitialLoading } = useAuth()

  if (isInitialLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
