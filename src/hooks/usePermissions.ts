import { useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"

/**
 * Maps the flat `allpermissions` string[] from the API (e.g. ["user:view", "user:add"])
 * into easy-to-use boolean helpers.
 *
 * Permission format: "<module>:<action>"
 * Actions seen in the API: view | add | update | delete | review | user
 */
export function usePermissions() {
  const { user } = useAuth()
  
  const permissions: string[] = user?.permissions ?? []
  const permSet = useMemo(() => new Set(permissions), [permissions])

  const isSuperAdmin = useMemo(() => permSet.has("superadmin:all"), [permSet])
  const roles = user?.roles ?? []
  
  const isDepartmentAdmin = useMemo(() => roles.some(r => r.toLowerCase() === "department admin"), [roles])
  const isPayrollAdmin = useMemo(() => roles.some(r => r.toLowerCase() === "payroll admin"), [roles])
  const isTimeStudyAdmin = useMemo(() => roles.some(r => r.toLowerCase() === "time study admin"), [roles])
  const isTimeStudySupervisor = useMemo(() => roles.some(r => r.toLowerCase() === "time study supervisor"), [roles])

  const assignedDepartmentIds = useMemo(() => {
    if (!user?.departmentRoles) return []
    return Array.from(new Set(user.departmentRoles.map(dr => dr.departmentId)))
  }, [user?.departmentRoles])

  /**
   * Returns true if the user has the exact permission string,
   * OR if the user is a super-admin (who bypasses all checks).
   */
  function has(perm: string): boolean {
    return isSuperAdmin || permSet.has(perm)
  }

  /** Can the user view this module? (requires `module:view`) */
  function canView(module: string): boolean {
    return has(`${module}:view`)
  }

  /** Can the user create/add in this module? (requires `module:add`) */
  function canAdd(module: string): boolean {
    return has(`${module}:add`)
  }

  /** Can the user edit records in this module? (requires `module:update`) */
  function canUpdate(module: string): boolean {
    return has(`${module}:update`)
  }

  /** Can the user delete records in this module? (requires `module:delete`) */
  function canDelete(module: string): boolean {
    return has(`${module}:delete`)
  }

  /** Can the user perform review actions in this module? (requires `module:review`) */
  function canReview(module: string): boolean {
    return has(`${module}:review`)
  }

  return {
    permissions,
    permSet,
    isSuperAdmin,
    isDepartmentAdmin,
    isPayrollAdmin,
    isTimeStudyAdmin,
    isTimeStudySupervisor,
    assignedDepartmentIds,
    user,
    has,
    canView,
    canAdd,
    canUpdate,
    canDelete,
    canReview,
  }
}
