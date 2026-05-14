import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Spinner } from "@/components/ui/spinner"

type ProtectedRouteProps = {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialLoading } = useAuth()
  const location = useLocation()

  if (isInitialLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-primary" />
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
