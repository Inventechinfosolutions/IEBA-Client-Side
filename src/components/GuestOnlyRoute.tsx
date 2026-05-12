import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Spinner } from "@/components/ui/spinner"

type GuestOnlyRouteProps = {
  children: React.ReactNode
}

export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const { isAuthenticated, isInitialLoading } = useAuth()

  if (isInitialLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
