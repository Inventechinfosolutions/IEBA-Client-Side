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
  const permSet = new Set(permissions)

  const isSuperAdmin = permSet.has("superadmin:all")
  const roles = user?.roles ?? []
  const isDepartmentAdmin = roles.includes("Department Admin")
  const isPayrollAdmin = roles.includes("Payroll Admin")
  const isTimeStudyAdmin = roles.includes("Time Study Admin")
  const isTimeStudySupervisor = roles.includes("Time Study Supervisor")

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
    has,
    canView,
    canAdd,
    canUpdate,
    canDelete,
    canReview,
  }
}
