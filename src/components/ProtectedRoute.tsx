import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialLoading } = useAuth()
  const location = useLocation()

  if (isInitialLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  return <>{children}</>
}
