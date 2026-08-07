import { assignUserDepartmentRoles, unassignUserDepartmentRoles } from "../api"
import type { UserModuleFormValues } from "../types"

/**
 * Client Admin (roleId=2) is a county-wide role.
 * In the DB it is mapped to the special "all" department (departmentId=1, departmentRoleId=2).
 * Checking/unchecking the Client Admin checkbox assigns/unassigns the user
 * from that single county-wide sentinel department — NOT individual departments.
 */
const CLIENT_ADMIN_DEPT_ID = 1    // "all" department — county-wide sentinel
const CLIENT_ADMIN_ROLE_ID = 2    // Client Admin global role id

export async function persistClientAdminRoleOnSave(
  userId: string,
  values: UserModuleFormValues,
  defaultValues?: Partial<UserModuleFormValues>,
): Promise<void> {
  const wasClientAdmin = defaultValues?.clientAdmin ?? false
  const isClientAdmin = values.clientAdmin ?? false

  // No change — skip API call entirely
  if (wasClientAdmin === isClientAdmin) return

  const departments = [{ id: CLIENT_ADMIN_DEPT_ID, roles: [{ id: String(CLIENT_ADMIN_ROLE_ID) }] }]

  if (isClientAdmin) {
    await assignUserDepartmentRoles({ userId, departments })
  } else {
    await unassignUserDepartmentRoles({ userId, departments })
  }
}

