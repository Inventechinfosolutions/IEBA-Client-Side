import { z } from "zod"
import type { addRoleFormSchema, departmentRoleFormSchema } from "./schemas"

export type RoleStatus = "active" | "inactive"

export type DepartmentRoleRow = {
  id: string
  departmentName: string
  roles: string[]
  status: RoleStatus
  isExpanded?: boolean
}

export type DepartmentRoleWithChildren = {
  id: string
  /** Numeric department id from API (for create / lookups). */
  departmentId?: number
  departmentName: string
  roles: string[]
  status: RoleStatus
  children?: Array<{
    id: string
    roleName: string
    status: RoleStatus
    /**
     * API `autoselected` (legacy `data.default`). When true: view-only action (eye), Active checkbox disabled.
     * When false and active: edit (pencil). When false and inactive: no action in Option column.
     */
    autoselected: boolean
    /** Derived as `!autoselected` for legacy naming; prefer `autoselected` for new code. */
    isCustom?: boolean
  }>
}

export type DepartmentRoleFormValues = {
  departmentName: string
  roles: string[]
  status: RoleStatus
}

export type AddRoleFormValues = {
  department: string
  roleName: string
  active: boolean
  assignedPermissions: string[]
  permissionCatalogByModuleName?: DepartmentRolePermissionCatalog | null
}

/**
 * Permissions for one module name from GET detail `role.permissions[]`
 * (`id` + `module.id` / `module.name`). Used for shuttle assign/create payloads.
 */
export type DepartmentRolePermissionCatalog = Record<
  string,
  Array<{ permissionId: string; moduleId: number }>
>

/** Single assigned permission under a module (GET detail / view). */
export type DepartmentRolePermissionItem = {
  permissionId: string
  name: string
}

/** Active `rolePermissions` grouped by module for the view. */
export type DepartmentRolePermissionModuleGroup = {
  moduleId: number
  moduleName: string
  permissions: DepartmentRolePermissionItem[]
}

/** Normalized GET /department-roles/:id payload (used by view + edit). */
export type DepartmentRoleDetail = {
  id: string
  /** Display name; may be filled from list API via `departmentId` when GET omits nested `department`. */
  departmentName: string
  /** From GET detail when present; used to resolve name from the department-role table. */
  departmentId?: number
  roleName: string
  active: boolean
  assignedPermissions: string[]
  permissionGroups: DepartmentRolePermissionModuleGroup[]
  /**
   * From `role.permissions` on GET `/department-roles/:id`. When non-empty, shuttle + assign use this
   * instead of hardcoded bundles.
   */
  permissionCatalogByModuleName: DepartmentRolePermissionCatalog
}

export type PaginationState = {
  page: number
  pageSize: number
  totalItems: number
}

export type DepartmentRolesListFilters = {
  page: number
  pageSize: number
  status?: string
}

export type DepartmenRoleTableProps = {
  data: DepartmentRoleWithChildren[]
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onToggleChildStatus?: (childId: string, active: boolean) => void
  onOptionAction?: (id: string, action: string) => void
  isLoading?: boolean
}

export type DepartmentRoleAddProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: readonly string[]
  initialDepartment?: string
  mode?: "create" | "edit"
  /** Department-role id (GET /department-roles/:id) when mode is `edit`. */
  editRoleId?: string | null
  /** Populated from GET by id; drives the edit form via react-hook-form `values`. */
  editDetail?: DepartmentRoleDetail | null
  isEditDetailLoading?: boolean
  editDetailError?: Error | null
  onSubmit: (
    values:
      | AddRoleFormValues
      | {
          childId: string
          roleName: string
          active: boolean
          permIdsToAdd?: string[]
          permIdsToRemove?: string[]
        }
  ) => void
  isSubmitting?: boolean
}

export type DepartmentRoleViewData = {
  departmentName: string
  roleName: string
  active: boolean
  assignedPermissions?: string[]
  permissionGroups?: DepartmentRolePermissionModuleGroup[]
}

export type DepartmentRoleViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: DepartmentRoleViewData | null
  isLoading?: boolean
}

/** @deprecated Edit form now loads from GET by id; kept for reference only. */
export type DepartmentRoleEditInitialValues = {
  childId: string
  departmentName: string
  roleName: string
  active: boolean
}

/** TransferPanel item types */
export type TransferPanelItem = {
  id: string
  name: string
  permissions: string[]
}

export type TransferPanelProps = {
  title: string
  items: TransferPanelItem[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onTogglePermission?: (itemId: string, permission: string) => void
  totalCount: number
  allSelected: boolean
  onSelectAll: (checked: boolean) => void
}

/** POST /department-roles `permissions[]` item. */
export type DepartmentRoleCreatePermissionRef = {
  id: string
  moduleId: number
}

/** Schema inference types */
export type DepartmentRoleFormSchema = z.infer<typeof departmentRoleFormSchema>
export type AddRoleFormSchema = z.infer<typeof addRoleFormSchema>

/** API specific types */
export type ApiDepartmentRoleListItem = {
  id: number
  roleId: number
  isAdmin: boolean
  status: string
  role: { id: number; name: string }
  /** When true, same as legacy `data.default` — view-only row, checkbox disabled. */
  autoselected?: boolean
}

export type ApiDepartmentWithRolesRow = {
  id: number
  code: string
  name: string
  status: string
  departmentroles: ApiDepartmentRoleListItem[]
}

export type DepartmentRolesListPayload = {
  data: ApiDepartmentWithRolesRow[]
  meta: {
    totalItems: number
    itemCount?: number
    itemsPerPage?: number
    totalPages?: number
    currentPage?: number
  }
}

export type DepartmentRolesPageResult = {
  items: DepartmentRoleWithChildren[]
  totalItems: number
}

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

export type MutateDepartmentRolePermissionsBody = {
  departmentRoleId: number
  /** Permission names/codes, or switch to `permissionIds` in the payload if your API expects ids. */
  permissions: string[]
}

export type UpdateDepartmentRoleBody = {
  name?: string
  status?: string
  assignedPermissionLabels?: readonly string[]
  permissionCatalogByModuleName?: DepartmentRolePermissionCatalog | null
}

/** Mutation Input types */
export type CreateDepartmentRoleMutationInput = AddRoleFormValues & {
  departmentId: number
  listFilters: DepartmentRolesListFilters
}
