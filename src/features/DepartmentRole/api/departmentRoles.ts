import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

import type {
  DepartmentRoleDetail,
  DepartmentRolePermissionCatalog,
  DepartmentRolePermissionModuleGroup,
  DepartmentRoleWithChildren,
  RoleStatus,
} from "../types"

import { buildCreateDepartmentRolePermissions } from "./departmentRoleCreatePermissions"

/** Mirrors backend list payload (same shape as GET used in add-employee catalog). */
type ApiDepartmentRoleListItem = {
  id: number
  roleId: number
  isAdmin: boolean
  status: string
  role: { id: number; name: string }
  /** When true, same as legacy `data.default` — view-only row, checkbox disabled. */
  autoselected?: boolean
}

function resolveAutoselected(dr: ApiDepartmentRoleListItem): boolean {
  const o = dr as Record<string, unknown>
  const v =
    o.autoselected ??
    o.autoSelected ??
    o.auto_selected
  if (typeof v === "boolean") return v
  if (v === 1 || v === "1" || v === "true") return true
  if (v === 0 || v === "0" || v === "false") return false
  /** If API omits the field, match previous UI: admin bundle rows behaved like non-editable defaults. */
  return dr.isAdmin === true
}

type ApiDepartmentWithRolesRow = {
  id: number
  code: string
  name: string
  status: string
  departmentroles: ApiDepartmentRoleListItem[]
}

type DepartmentRolesListPayload = {
  data: ApiDepartmentWithRolesRow[]
  meta: {
    totalItems: number
    itemCount?: number
    itemsPerPage?: number
    totalPages?: number
    currentPage?: number
  }
}

function assertSuccessData<T>(res: ApiResponseDto<T>, failureMessage: string): T {
  if (!res?.success || res.data == null) {
    throw new Error(res?.message ?? failureMessage)
  }
  return res.data
}

function assertSuccessOk(res: ApiResponseDto<unknown>, failureMessage: string): void {
  if (!res?.success) {
    throw new Error(res?.message ?? failureMessage)
  }
}

function normalizeRoleStatus(s: unknown): RoleStatus {
  if (typeof s === "string" && s.toLowerCase() === "inactive") return "inactive"
  return "active"
}

export function mapApiDepartmentRowToUi(
  dept: ApiDepartmentWithRolesRow
): DepartmentRoleWithChildren {
  const drs = dept.departmentroles ?? []
  const children = drs.map((dr) => {
    const autoselected = resolveAutoselected(dr)
    return {
      id: String(dr.id),
      roleName: dr.role?.name?.trim() ?? "",
      status: normalizeRoleStatus(dr.status),
      autoselected,
      isCustom: !autoselected,
    }
  })
  const activeRoleNames = children
    .filter((c) => c.status === "active")
    .map((c) => c.roleName)
    .filter(Boolean)

  return {
    id: String(dept.id),
    departmentId: dept.id,
    departmentName: typeof dept.name === "string" ? dept.name : "",
    roles: activeRoleNames,
    status: normalizeRoleStatus(dept.status),
    children,
  }
}

export type DepartmentRolesPageResult = {
  items: DepartmentRoleWithChildren[]
  totalItems: number
}

export async function fetchDepartmentRolesPage(params: {
  page: number
  limit: number
  status?: string
}): Promise<DepartmentRolesPageResult> {
  const search = new URLSearchParams()
  search.set("page", String(params.page))
  search.set("limit", String(params.limit))
  if (params.status) search.set("status", params.status)

  const res = await api.get<ApiResponseDto<DepartmentRolesListPayload>>(
    `/department-roles?${search.toString()}`
  )
  const payload = assertSuccessData(res, "Failed to load department roles")
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Unexpected department roles list response")
  }
  const items = payload.data.map(mapApiDepartmentRowToUi)
  const totalItems =
    typeof payload.meta?.totalItems === "number" ? payload.meta.totalItems : items.length
  return { items, totalItems }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v === null || typeof v !== "object") return null
  return v as Record<string, unknown>
}

function permissionStatusIsActive(status: unknown): boolean {
  if (status == null) return true
  if (typeof status === "string") return status.toLowerCase() === "active"
  return status !== false
}

/** Maps `role.permissions[].id` → display `name` (GET detail payload). */
function buildRolePermissionNameLookup(
  roleObj: Record<string, unknown> | null
): Map<string, string> {
  const map = new Map<string, string>()
  if (!roleObj) return map
  const perms = roleObj.permissions
  if (!Array.isArray(perms)) return map
  for (const p of perms) {
    const pr = asRecord(p)
    if (!pr) continue
    const pid = pr.id
    const name = pr.name
    if (
      (typeof pid === "string" || typeof pid === "number") &&
      typeof name === "string"
    ) {
      map.set(String(pid), name)
    }
  }
  return map
}

/** Align API `module.name` with shuttle labels (avoids empty left column after refetch). */
function shuttleLabelForModuleName(raw: string): string {
  const t = raw.trim()
  const k = t.toLowerCase()
  if (k === "general admin") return "General Admin"
  if (k === "time study") return "Time Study"
  if (k === "personal") return "Personal"
  return t
}

/** `role.permissions[]` → `{ [moduleName]: [{ permissionId, moduleId }] }` (backend shape). */
function buildPermissionCatalogFromRole(
  roleObj: Record<string, unknown> | null
): DepartmentRolePermissionCatalog {
  const out: DepartmentRolePermissionCatalog = {}
  if (!roleObj) return out
  const perms = roleObj.permissions
  if (!Array.isArray(perms)) return out
  for (const p of perms) {
    const pr = asRecord(p)
    if (!pr) continue
    const pidRaw = pr.id
    if (typeof pidRaw !== "string" || !pidRaw.trim()) continue
    const permissionId = pidRaw.trim()
    const mod = asRecord(pr.module)
    const moduleId = typeof mod?.id === "number" ? mod.id : 0
    const moduleName =
      typeof mod?.name === "string" ? mod.name.trim() : ""
    if (!moduleName) continue
    const label = shuttleLabelForModuleName(moduleName)
    const row = { permissionId, moduleId }
    if (!out[label]) out[label] = []
    const key = `${permissionId}\0${moduleId}`
    const exists = out[label].some(
      (x) => `${x.permissionId}\0${x.moduleId}` === key
    )
    if (!exists) out[label].push(row)
  }
  return out
}

function normalizeDepartmentRoleDetail(raw: unknown): DepartmentRoleDetail {
  const root = asRecord(raw) ?? {}
  const inner = asRecord(root.data) ?? root

  const idRaw = inner.id
  const id =
    typeof idRaw === "number" || typeof idRaw === "string"
      ? String(idRaw).trim()
      : ""

  const dept = asRecord(inner.department)
  let departmentName =
    typeof dept?.name === "string"
      ? dept.name.trim()
      : typeof inner.departmentName === "string"
        ? inner.departmentName.trim()
        : typeof inner.department === "string"
          ? inner.department.trim()
          : ""

  const deptIdFromNested =
    typeof dept?.id === "number"
      ? dept.id
      : typeof dept?.id === "string"
        ? Number(dept.id)
        : NaN
  const deptIdTop = inner.departmentId ?? inner["department_id"]
  const departmentIdRaw = Number.isFinite(deptIdFromNested)
    ? deptIdFromNested
    : deptIdTop
  const departmentIdNum =
    typeof departmentIdRaw === "number"
      ? departmentIdRaw
      : typeof departmentIdRaw === "string"
        ? Number(departmentIdRaw)
        : NaN
  const departmentId = Number.isFinite(departmentIdNum)
    ? Math.trunc(departmentIdNum)
    : undefined

  const role = asRecord(inner.role)
  const roleName =
    typeof role?.name === "string"
      ? role.name
      : typeof inner.roleName === "string"
        ? inner.roleName
        : ""

  const statusRaw = inner.status
  const active =
    typeof statusRaw === "string"
      ? statusRaw.toLowerCase() === "active"
      : statusRaw !== false

  const nameByPermissionId = buildRolePermissionNameLookup(role)

  type MutableGroup = {
    moduleId: number
    moduleName: string
    items: Map<string, { permissionId: string; name: string }>
  }
  const groupByModuleId = new Map<number, MutableGroup>()

  const rolePermsRaw = inner.rolePermissions
  if (Array.isArray(rolePermsRaw)) {
    for (const item of rolePermsRaw) {
      const r = asRecord(item)
      if (!r || !permissionStatusIsActive(r.status)) continue

      const permissionIdRaw = r.permissionId
      if (typeof permissionIdRaw !== "string" || !permissionIdRaw.trim()) continue
      const permissionId = permissionIdRaw.trim()

      const mod = asRecord(r.module)
      const moduleId =
        typeof mod?.id === "number"
          ? mod.id
          : typeof r.moduleId === "number"
            ? r.moduleId
            : 0
      const moduleName =
        typeof mod?.name === "string" ? mod.name : "Other"

      const name = nameByPermissionId.get(permissionId) ?? permissionId

      let g = groupByModuleId.get(moduleId)
      if (!g) {
        g = { moduleId, moduleName, items: new Map() }
        groupByModuleId.set(moduleId, g)
      }
      g.items.set(permissionId, { permissionId, name })
    }
  }

  let permissionGroups: DepartmentRolePermissionModuleGroup[] = [...groupByModuleId.values()]
    .sort((a, b) => a.moduleId - b.moduleId)
    .map((g) => ({
      moduleId: g.moduleId,
      moduleName: g.moduleName,
      permissions: [...g.items.values()].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    }))

  let assignedPermissions: string[] = permissionGroups.flatMap((g) =>
    g.permissions.map((p) => p.name)
  )

  if (permissionGroups.length === 0) {
    const permsRaw = inner.permissions
    if (Array.isArray(permsRaw)) {
      assignedPermissions = permsRaw.map((p) => {
        if (typeof p === "string") return p
        const pr = asRecord(p)
        if (typeof pr?.name === "string") return pr.name
        if (typeof pr?.label === "string") return pr.label
        return String(p)
      })
    }
  }

  return {
    id,
    departmentName,
    departmentId,
    roleName,
    active,
    assignedPermissions,
    permissionGroups,
    permissionCatalogByModuleName: buildPermissionCatalogFromRole(role),
  }
}

export async function fetchDepartmentRoleById(id: string): Promise<DepartmentRoleDetail> {
  const res = await api.get<unknown>(`/department-roles/${encodeURIComponent(id)}`)
  if (
    res !== null &&
    typeof res === "object" &&
    "success" in res &&
    "data" in res
  ) {
    const data = assertSuccessData(
      res as ApiResponseDto<unknown>,
      "Failed to load department role"
    )
    return normalizeDepartmentRoleDetail(data)
  }
  return normalizeDepartmentRoleDetail(res)
}

/**
 * POST /department-roles — full DTO in one request (includes permissions; no follow-up assign on create).
 */
export type CreateDepartmentRoleBody = {
  departmentId: number
  status: string
  role: { name: string }
  isAdmin?: boolean
  /** Add Role transfer-list labels → expanded to `{ permissionId, moduleId }[]`. */
  assignedPermissionLabels?: readonly string[]
  /** When set (e.g. from GET role template), replaces hardcoded bundles for expansion. */
  permissionCatalogByModuleName?: DepartmentRolePermissionCatalog | null
}

function extractCreatedId(data: unknown): number {
  const o = asRecord(data) ?? {}
  const id = o.id
  if (typeof id === "number" && Number.isFinite(id)) return id
  if (typeof id === "string") {
    const n = Number(id)
    if (Number.isFinite(n)) return n
  }
  throw new Error("Create response missing department role id")
}

export async function createDepartmentRole(
  body: CreateDepartmentRoleBody
): Promise<number> {
  const permissions = buildCreateDepartmentRolePermissions(
    body.assignedPermissionLabels ?? [],
    body.permissionCatalogByModuleName ?? null
  )
  const departmentId = Math.trunc(Number(body.departmentId))
  if (!Number.isFinite(departmentId)) {
    throw new Error("departmentId must be a valid integer")
  }
  const res = await api.post<ApiResponseDto<unknown>>("/department-roles", {
    departmentId,
    role: { name: body.role.name.trim() },
    status: body.status,
    isAdmin: body.isAdmin ?? false,
    permissions,
  })
  const data = assertSuccessData(res, "Failed to create department role")
  return extractCreatedId(data)
}

export type MutateDepartmentRolePermissionsBody = {
  departmentRoleId: number
  /** Permission names/codes, or switch to `permissionIds` in the payload if your API expects ids. */
  permissions: string[]
}

export async function assignDepartmentRolePermissions(
  body: MutateDepartmentRolePermissionsBody
): Promise<void> {
  const res = await api.post<ApiResponseDto<unknown>>(
    "/department-roles/permissions/assign",
    body
  )
  assertSuccessOk(res, "Failed to assign permissions")
}

export async function unassignDepartmentRolePermissions(
  body: MutateDepartmentRolePermissionsBody
): Promise<void> {
  const res = await api.post<ApiResponseDto<unknown>>(
    "/department-roles/permissions/unassign",
    body
  )
  assertSuccessOk(res, "Failed to unassign permissions")
}

export type UpdateDepartmentRoleBody = {
  roleName?: string
  status?: string
}

/**
 * Updates a department-role row (custom role name / status).
 * Uses REST `PUT /department-roles/:id`. Adjust path/body if your backend differs.
 */
export async function updateDepartmentRole(
  id: string,
  body: UpdateDepartmentRoleBody
): Promise<void> {
  const res = await api.put<ApiResponseDto<unknown>>(
    `/department-roles/${encodeURIComponent(id)}`,
    body
  )
  assertSuccessOk(res, "Failed to update department role")
}
