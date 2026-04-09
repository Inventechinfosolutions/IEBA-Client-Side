import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { usePermissions } from "@/hooks/usePermissions"

interface PermissionRouteProps {
  /**
   * The module key(s) to check for `:view` permission.
   *  - string        → requires `module:view`
   *  - string[]      → requires ANY of `module:view` (OR logic)
   *  - "superadmin"  → requires `superadmin:all`
   */
  permission: string | string[] | "superadmin"
  children: ReactNode
  /** Where to redirect on access denied. Defaults to "/" */
  redirectTo?: string
}

/**
 * Wraps a route element and redirects to `redirectTo` (default "/") when the
 * current user does not hold the required view permission.
 *
 * Super-admins always bypass all checks.
 */
export function PermissionRoute({
  permission,
  children,
  redirectTo = "/",
}: PermissionRouteProps) {
  const { isSuperAdmin, canView } = usePermissions()

  // Super-admin bypasses every check
  if (isSuperAdmin) return <>{children}</>

  // Superadmin-only pages
  if (permission === "superadmin") {
    return <Navigate to={redirectTo} replace />
  }

  // Array → OR: visible if user has :view for ANY listed module
  const allowed = Array.isArray(permission)
    ? permission.some((mod) => canView(mod))
    : canView(permission)

  if (!allowed) return <Navigate to={redirectTo} replace />

  return <>{children}</>
}
