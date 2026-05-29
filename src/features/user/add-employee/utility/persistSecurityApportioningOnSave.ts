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

function parseMultiCodes(raw: string | undefined): string[] | undefined {
  const t = (raw ?? "").trim()
  if (!t) return undefined
  const parts = t
    .split(/[,;\n]+/g)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : undefined
}

export async function persistUserAllowMultiCodeHistoryOnSave(
  userId: string,
  values: UserModuleFormValues,
): Promise<void> {
  const configs = values.departmentMultiCodes ?? []
  
  // We only send records for departments that are present in the form configuration.
  const records = configs
    .filter((c) => c.departmentId > 0)
    .map((c) => ({
      userId,
      departmentId: c.departmentId,
      allowMultiCodes: c.allowMultiCodes,
      startDate: c.activationStartDate || undefined,
      endDate: c.activationEndDate || undefined,
      multiCodeTypes: parseMultiCodes(c.assignedMultiCodes),
    }))

  if (records.length === 0) return

  const { postUserAllowMulticodeHistory } = await import("../api")
  await postUserAllowMulticodeHistory({ records })
}

