import { assignUserDepartmentRoles } from "../api"
import type { UserModuleFormValues } from "../types"
import { buildUserDepartmentRoleDepartmentsPayload } from "./buildUserDepartmentRoleDepartmentsPayload"
import {
  catalogItemsFromAssignedSnapshots,
  resolveAssignedSnapshotsForSecuritySave,
} from "./parseSecurityDepartmentRoles"

/**
 * Security tab Save — apportioning only.
 * Role assign/unassign is persisted immediately via transfer arrows
 * (POST /userdepartmentrole/assign/roles and …/unassign/roles).
 */
export async function persistSecurityApportioningOnSave(
  userId: string,
  values: UserModuleFormValues,
): Promise<void> {
  if (!values.supervisorApportioning) return

  const snapshots = resolveAssignedSnapshotsForSecuritySave(
    userId,
    values.securityAssignedSnapshots ?? [],
  )
  const departments = buildUserDepartmentRoleDepartmentsPayload(
    catalogItemsFromAssignedSnapshots(snapshots),
  )
  if (departments.length === 0) return

  const apportioningAllocation = Object.entries(values.apportioningAllocations ?? {}).map(
    ([id, val]) => ({
      id: Number(id),
      allocation: parseFloat(val ?? "") || 0,
    }),
  )

  await assignUserDepartmentRoles({
    userId,
    departments,
    apportioningRequired: true,
    apportioningAllocation,
  })
}
