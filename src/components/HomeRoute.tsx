import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { usePermissions } from "@/hooks/usePermissions"

/**
 * Home (`/`): users without `dashboard:user` (e.g. a reports-only role) land on
 * Reports instead of the dashboard, whose APIs require `dashboard:user`.
 */
export function HomeRoute({ children }: { children: ReactNode }) {
  const { has, canView } = usePermissions()

  if (!has("dashboard:user") && canView("report")) {
    return <Navigate to="/reports" replace />
  }

  return <>{children}</>
}
