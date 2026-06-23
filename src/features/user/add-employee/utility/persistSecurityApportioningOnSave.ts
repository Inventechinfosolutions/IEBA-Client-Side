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
  defaultValues?: Partial<UserModuleFormValues>,
): Promise<void> {
  const apportioningChanged =
    values.supervisorApportioning !== defaultValues?.supervisorApportioning ||
    JSON.stringify(values.apportioningAllocations ?? {}) !== JSON.stringify(defaultValues?.apportioningAllocations ?? {})

  if (defaultValues && !apportioningChanged) {
    return
  }

  const snapshots = resolveAssignedSnapshotsForSecuritySave(
    userId,
    values.securityAssignedSnapshots ?? [],
  )
  const departments = buildUserDepartmentRoleDepartmentsPayload(
    catalogItemsFromAssignedSnapshots(snapshots),
  )
  if (departments.length === 0) return

  if (!values.supervisorApportioning) {
    await assignUserDepartmentRoles({
      userId,
      departments,
      apportioningRequired: false,
      apportioningAllocation: [],
    })
    return
  }

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
  defaultValues?: Partial<UserModuleFormValues>,
): Promise<void> {
  const configs = values.departmentMultiCodes ?? []
  
  // We only send records for departments that are present in the form configuration.
  const records = configs
    .filter((c) => {
      if (c.departmentId <= 0) return false
      if (!defaultValues) return true

      const def = defaultValues.departmentMultiCodes?.find((d) => d.departmentId === c.departmentId)
      if (!def) return true

      const codesVal = (c.assignedMultiCodes ?? "").trim()
      const codesDef = (def.assignedMultiCodes ?? "").trim()
      return (
        c.allowMultiCodes !== def.allowMultiCodes ||
        (c.activationStartDate || "") !== (def.activationStartDate || "") ||
        (c.activationEndDate || "") !== (def.activationEndDate || "") ||
        codesVal !== codesDef
      )
    })
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

