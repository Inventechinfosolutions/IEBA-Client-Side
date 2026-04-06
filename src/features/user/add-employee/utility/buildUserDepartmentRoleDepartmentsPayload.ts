import type {
  AddEmployeeSecurityRoleCatalogItem,
  UserDepartmentRoleDepartmentBlockPayload,
} from "../types"

/** Catalog row id is `deptId-roleId` or `deptId-departmentRoleId` — first segment is department id. */
export function departmentIdFromSecurityCatalogItemId(id: string): number | null {
  const first = id.split("-")[0]
  const n = Number.parseInt(first ?? "", 10)
  return Number.isFinite(n) && n >= 1 ? n : null
}

/** Remainder after first `-` is role id or department-role id (string for API). */
export function roleRefIdFromSecurityCatalogItemId(id: string): string | null {
  const idx = id.indexOf("-")
  if (idx < 0) return null
  const rest = id.slice(idx + 1).trim()
  return rest !== "" ? rest : null
}

export function buildUserDepartmentRoleDepartmentsPayload(
  items: AddEmployeeSecurityRoleCatalogItem[],
): UserDepartmentRoleDepartmentBlockPayload[] {
  const byDept = new Map<number, Set<string>>()
  for (const i of items) {
    const deptId = departmentIdFromSecurityCatalogItemId(i.id)
    const roleRef = roleRefIdFromSecurityCatalogItemId(i.id)
    if (deptId == null || roleRef == null) continue
    let set = byDept.get(deptId)
    if (!set) {
      set = new Set()
      byDept.set(deptId, set)
    }
    set.add(roleRef)
  }
  return Array.from(byDept.entries()).map(([id, roleSet]) => ({
    id,
    roles: [...roleSet].map((rid) => ({ id: rid })),
  }))
}
