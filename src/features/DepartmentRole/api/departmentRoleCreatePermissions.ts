import type {
  DepartmentRoleDetail,
  DepartmentRolePermissionCatalog,
} from "../types"

/** POST /department-roles `permissions[]` item (backend: `permissionId` + `moduleId`, not `id`). */
export type DepartmentRoleCreatePermissionRef = {
  permissionId: string
  moduleId: number
}

/** Fixed shuttle order; labels must match backend `module.name`. */
export const SHUTTLE_MODULE_LABELS = [
  "General Admin",
  "Time Study",
  "Personal",
] as const

export type ShuttleModuleLabel = (typeof SHUTTLE_MODULE_LABELS)[number]

const TIME_STUDY_MODULE_ID = 2

function crud(prefix: string): string[] {
  return [`${prefix}:add`, `${prefix}:delete`, `${prefix}:update`, `${prefix}:view`]
}

function asRefs(
  permissionIds: string[],
  moduleId: number
): DepartmentRoleCreatePermissionRef[] {
  return permissionIds.map((permissionId) => ({ permissionId, moduleId }))
}

/** Used only when `permissionCatalogByModuleName` is missing (e.g. Add Role without catalog API). */
const FALLBACK_BUNDLES_BY_LABEL: Record<string, DepartmentRoleCreatePermissionRef[]> = {
  "Time Study": asRefs(
    [
      ...crud("costallocation"),
      ...crud("countyactivity"),
      ...crud("jobclassification"),
      ...crud("timestudyactivity"),
      ...crud("timestudypersonal"),
      ...crud("timestudyprogram"),
      ...crud("timestudyrecord"),
      "timestudysupervisor:review",
    ],
    TIME_STUDY_MODULE_ID
  ),
  Personal: asRefs(crud("timestudypersonal"), TIME_STUDY_MODULE_ID),
  "General Admin": [{ permissionId: "superadmin:all", moduleId: 1 }],
}

function bundleForLabel(
  label: string,
  catalog: DepartmentRolePermissionCatalog | null | undefined
): DepartmentRoleCreatePermissionRef[] | undefined {
  const fromServer = catalog?.[label]
  if (fromServer && fromServer.length > 0) {
    return fromServer.map((r) => ({
      permissionId: r.permissionId,
      moduleId: r.moduleId,
    }))
  }
  return FALLBACK_BUNDLES_BY_LABEL[label]
}

export function buildCreateDepartmentRolePermissions(
  selectedLabels: readonly string[],
  catalog?: DepartmentRolePermissionCatalog | null
): DepartmentRoleCreatePermissionRef[] {
  const dedupe = new Map<string, DepartmentRoleCreatePermissionRef>()
  for (const label of selectedLabels) {
    const bundle = bundleForLabel(label, catalog)
    if (!bundle?.length) continue
    for (const p of bundle) {
      dedupe.set(`${p.permissionId}\0${p.moduleId}`, p)
    }
  }
  return [...dedupe.values()]
}

export function permissionLabelsToApiPermissionIds(
  labels: readonly string[],
  catalog?: DepartmentRolePermissionCatalog | null
): string[] {
  return buildCreateDepartmentRolePermissions(labels, catalog).map((p) => p.permissionId)
}

function bundleFullyAssigned(
  label: string,
  assignedIds: ReadonlySet<string>,
  catalog: DepartmentRolePermissionCatalog
): boolean {
  const bundle = catalog[label]
  if (!bundle?.length) return false
  return bundle.every((b) => assignedIds.has(b.permissionId))
}

function bundleFullyAssignedFallback(
  label: string,
  assignedIds: ReadonlySet<string>
): boolean {
  const bundle = FALLBACK_BUNDLES_BY_LABEL[label]
  if (!bundle?.length) return false
  return bundle.every((b) => assignedIds.has(b.permissionId))
}

/**
 * GET detail → module labels for the shuttle. Prefers `permissionCatalogByModuleName` from
 * `role.permissions`; falls back to hardcoded bundles only if catalog is empty.
 */
export function assignedModuleLabelsFromDetail(
  detail: DepartmentRoleDetail
): string[] {
  const assignedIds = new Set<string>()
  for (const g of detail.permissionGroups ?? []) {
    for (const p of g.permissions) {
      if (p.permissionId?.trim()) assignedIds.add(p.permissionId.trim())
    }
  }
  if (assignedIds.size === 0) return []

  const catalog = detail.permissionCatalogByModuleName ?? {}
  const useServer =
    Object.keys(catalog).length > 0 &&
    SHUTTLE_MODULE_LABELS.some((m) => (catalog[m]?.length ?? 0) > 0)

  const out: string[] = []
  if (useServer) {
    for (const label of SHUTTLE_MODULE_LABELS) {
      if (bundleFullyAssigned(label, assignedIds, catalog)) out.push(label)
    }
    return out
  }

  if (bundleFullyAssignedFallback("General Admin", assignedIds)) {
    out.push("General Admin")
  }
  if (bundleFullyAssignedFallback("Time Study", assignedIds)) {
    out.push("Time Study")
  } else if (bundleFullyAssignedFallback("Personal", assignedIds)) {
    out.push("Personal")
  }
  return out
}

/**
 * Modules shown in the shuttle. Uses `role.permissions` grouped by `module.name` when it lines up
 * with our three labels; otherwise falls back to all three so the left list never goes empty after
 * refetch (e.g. API uses different casing/keys or omits some modules on partial responses).
 */
export function shuttleModuleLabelsFromCatalog(
  catalog: DepartmentRolePermissionCatalog | null | undefined
): ShuttleModuleLabel[] {
  if (!catalog || Object.keys(catalog).length === 0) {
    return [...SHUTTLE_MODULE_LABELS]
  }
  const matched = SHUTTLE_MODULE_LABELS.filter(
    (m) => (catalog[m]?.length ?? 0) > 0
  )
  return matched.length > 0 ? matched : [...SHUTTLE_MODULE_LABELS]
}
