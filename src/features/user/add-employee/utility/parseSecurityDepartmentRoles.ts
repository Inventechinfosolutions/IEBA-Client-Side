import { queryClient } from "@/main"

import { fetchSecurityDepartmentRoles } from "../api"
import { addEmployeeLookupKeys } from "../keys"
import type {
  AddEmployeeSecurityRoleCatalogItem,
  SecurityDepartmentRolesQueryResult,
} from "../types"

type DepartmentRoleRow = {
  id: number
  name: string
  code?: string
  roles?: Array<{ id: number; name: string }>
}

function legacyDepartmentRowsFromPayload(payload: unknown): DepartmentRoleRow[] {
  if (payload === null || typeof payload !== "object") return []
  const p = payload as Record<string, unknown>
  if (Array.isArray(p.data)) return p.data as DepartmentRoleRow[]
  if (Array.isArray(payload)) return payload as DepartmentRoleRow[]
  return []
}

function flattenDepartmentRoleRowsToCatalogItems(
  rows: readonly DepartmentRoleRow[],
): AddEmployeeSecurityRoleCatalogItem[] {
  const out: AddEmployeeSecurityRoleCatalogItem[] = []
  for (const d of rows) {
    const deptId = typeof d.id === "number" ? d.id : Number(d.id)
    const deptName = typeof d.name === "string" ? d.name.trim() : ""
    if (!Number.isFinite(deptId) || !deptName) continue
    for (const r of d.roles ?? []) {
      const roleId = typeof r.id === "number" ? r.id : Number(r.id)
      const roleName = typeof r.name === "string" ? r.name.trim() : ""
      if (!Number.isFinite(roleId) || !roleName) continue
      out.push({
        id: `${deptId}-${roleId}`,
        name: roleName,
        department: deptName,
      })
    }
  }
  return out
}

function assignedSnapshotsFromDepartmentRoleRows(rows: readonly DepartmentRoleRow[]) {
  const out: SecurityDepartmentRolesQueryResult["assignedSnapshots"] = []
  const seen = new Set<string>()
  for (const d of rows) {
    const deptId = typeof d.id === "number" ? d.id : Number(d.id)
    const deptName = typeof d.name === "string" ? d.name.trim() : ""
    if (!Number.isFinite(deptId) || deptId < 1 || !deptName) continue
    for (const r of d.roles ?? []) {
      const roleId = typeof r.id === "number" ? r.id : Number(r.id)
      const roleName = typeof r.name === "string" ? r.name.trim() : ""
      if (!Number.isFinite(roleId) || roleId < 1 || !roleName) continue
      const id = `${deptId}-${roleId}`
      if (seen.has(id)) continue
      seen.add(id)
      out.push({ id, name: roleName, departmentId: deptId, department: deptName })
    }
  }
  return out.sort((a, b) => {
    const d = a.department.localeCompare(b.department, undefined, { sensitivity: "base" })
    if (d !== 0) return d
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  })
}

/** Parses GET /departments/assignedDepartment/roles response. */
export function parseSecurityDepartmentRolesResponse(
  payload: unknown,
): SecurityDepartmentRolesQueryResult {
  if (payload === null || typeof payload !== "object") {
    return { unassigned: [], assignedSnapshots: [] }
  }
  const p = payload as Record<string, unknown>
  const assignedRows = Array.isArray(p.assigned) ? (p.assigned as DepartmentRoleRow[]) : []
  const unassignedRows = Array.isArray(p.unassigned) ? (p.unassigned as DepartmentRoleRow[]) : []

  if (assignedRows.length > 0 || unassignedRows.length > 0) {
    return {
      unassigned: flattenDepartmentRoleRowsToCatalogItems(unassignedRows),
      assignedSnapshots: assignedSnapshotsFromDepartmentRoleRows(assignedRows),
    }
  }

  const legacyRows = legacyDepartmentRowsFromPayload(payload)
  return {
    unassigned: flattenDepartmentRoleRowsToCatalogItems(legacyRows),
    assignedSnapshots: [],
  }
}

export function roleNamesFromSecuritySnapshots(
  snapshots: SecurityDepartmentRolesQueryResult["assignedSnapshots"],
): string[] {
  return [...new Set(snapshots.map((s) => s.name.trim()).filter(Boolean))]
}

/** Flat rows for RoleTransferPanel (grouped by `department` in the panel). */
export function securityRoleItemsFromSnapshots(
  snapshots: SecurityDepartmentRolesQueryResult["assignedSnapshots"],
): Array<{ id: string; name: string; department: string }> {
  return snapshots.map((s) => ({
    id: s.id,
    name: s.name,
    department: s.department,
  }))
}

export function catalogItemsFromAssignedSnapshots(
  snapshots: SecurityDepartmentRolesQueryResult["assignedSnapshots"],
): AddEmployeeSecurityRoleCatalogItem[] {
  return securityRoleItemsFromSnapshots(snapshots)
}

/** Prefer cached GET /assignedDepartment/roles when the Security tab has loaded. */
export function getAssignedSecuritySnapshots(
  userId: string | null | undefined,
  formSnapshots: SecurityDepartmentRolesQueryResult["assignedSnapshots"],
): SecurityDepartmentRolesQueryResult["assignedSnapshots"] {
  const id = userId?.trim() ?? ""
  if (id) {
    const cached = queryClient.getQueryData<SecurityDepartmentRolesQueryResult>(
      addEmployeeLookupKeys.securityDepartmentRoles(id),
    )
    if (cached?.assignedSnapshots.length) return cached.assignedSnapshots
  }
  return formSnapshots
}

/** Loads assigned roles from GET /departments/assignedDepartment/roles (updates query cache). */
export async function loadAssignedSecuritySnapshotsFromApi(
  userId: string,
): Promise<SecurityDepartmentRolesQueryResult> {
  const id = userId.trim()
  return await queryClient.fetchQuery({
    queryKey: addEmployeeLookupKeys.securityDepartmentRoles(id),
    queryFn: () => fetchSecurityDepartmentRoles(id),
    staleTime: 0,
  })
}

/** Prefer cached GET /assignedDepartment/roles for Save when the Security tab has loaded. */
export function resolveAssignedSnapshotsForSecuritySave(
  userId: string,
  formSnapshots: SecurityDepartmentRolesQueryResult["assignedSnapshots"],
): SecurityDepartmentRolesQueryResult["assignedSnapshots"] {
  return getAssignedSecuritySnapshots(userId, formSnapshots)
}

/**
 * Resolves assigned roles for Supervisor tab gating (form → query cache → GET assignedDepartment/roles).
 */
export async function resolveSecurityRolesForSupervisorTab(
  userId: string | null | undefined,
  formSnapshots: SecurityDepartmentRolesQueryResult["assignedSnapshots"],
): Promise<SecurityDepartmentRolesQueryResult | null> {
  const cachedSnapshots = getAssignedSecuritySnapshots(userId, formSnapshots)
  if (cachedSnapshots.length > 0) {
    const id = userId?.trim() ?? ""
    const cached = id
      ? queryClient.getQueryData<SecurityDepartmentRolesQueryResult>(
          addEmployeeLookupKeys.securityDepartmentRoles(id),
        )
      : undefined
    if (cached) return cached
    return { unassigned: [], assignedSnapshots: cachedSnapshots }
  }

  const id = userId?.trim() ?? ""
  if (!id) return null

  const refreshed = await loadAssignedSecuritySnapshotsFromApi(id)
  return refreshed.assignedSnapshots.length > 0 ? refreshed : null
}
