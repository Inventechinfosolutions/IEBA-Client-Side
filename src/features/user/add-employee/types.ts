import type { z } from "zod"

import { userModuleFormSchema } from "./schemas"

/** Mirrors backend PaginationMetaDto (local to avoid circular import with user/types). */
export type AddEmployeeListMetaDto = {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

/** Backend jobclassification list row (subset used by Add Employee UI). */
export type AddEmployeeJobClassificationRow = {
  id: number
  code: string
  name: string
  description?: string | null
  status: string
}

export type AddEmployeeJobClassificationListPayload = {
  data: AddEmployeeJobClassificationRow[]
  meta: AddEmployeeListMetaDto
}

/** Backend jobpool list row (subset). */
export type AddEmployeeJobPoolRow = {
  id: number
  name: string
  departmentId: number
  status: string
}

export type AddEmployeeJobPoolListPayload = {
  data: AddEmployeeJobPoolRow[]
  meta: AddEmployeeListMetaDto
}

/** Backend activities list row (subset). */
export type AddEmployeeActivityCatalogRow = {
  id: number
  code: string
  name: string
  activityCode: string
  status: string
}

export type AddEmployeeActivityListPayload = {
  data: AddEmployeeActivityCatalogRow[]
  meta: AddEmployeeListMetaDto
}

export type AddEmployeeDepartmentOption = {
  id: string
  code: string
  name: string
}

/** Flattened row for Security/Assignments role transfer (from GET /department-roles). */
export type AddEmployeeSecurityRoleCatalogItem = {
  id: string
  name: string
  department: string
}

export type AddEmployeeDepartmentRoleListItem = {
  id: number
  roleId: number
  isAdmin: boolean
  status: string
  role: { id: number; name: string }
}

export type AddEmployeeDepartmentWithRolesRow = {
  id: number
  code: string
  name: string
  status: string
  departmentroles: AddEmployeeDepartmentRoleListItem[]
}

export type AddEmployeeDepartmentRolesListPayload = {
  data: AddEmployeeDepartmentWithRolesRow[]
  meta: AddEmployeeListMetaDto
}

/** Time study program row for assignments tab (from GET /timestudyprograms, active only). */
export type AddEmployeeTimeStudyProgramRow = {
  id: string
  code: string
  name: string
  department: string
}

/** Tenant master-code row from GET /master-codes (subset for multicode picker). */
export type AddEmployeeMasterCodeRow = {
  id: number
  name: string
  allowMulticode: boolean
  status: string
}

export type AddEmployeeMasterCodeListPayload = {
  data: AddEmployeeMasterCodeRow[]
  meta: AddEmployeeListMetaDto
}

/** County activity row from GET /countyactivity?method=listcountyactivity (normalized). */
export type AddEmployeeCountyActivityRow = {
  id: string
  countyActivityCode?: string
  countyActivityName?: string
}

export type UserModuleFormMode = "add" | "edit"

export type UserModuleFormValues = z.infer<typeof userModuleFormSchema>

export type AddEmployeeFormTab = "employee" | "security" | "supervisor" | "timeStudy"

/** @deprecated Use AddEmployeeFormTab; kept as alias for existing call sites re-exported from user/types */
export type UserFormTab = AddEmployeeFormTab

/** Returned from `onSave` after create/draft update: form reset from GET /users/:id/details. */
export type AddEmployeeSaveSync = {
  formValues: UserModuleFormValues
}

export type AddEmployeeFormPanelProps = {
  mode: UserModuleFormMode
  initialValues: UserModuleFormValues
  onCancel: () => void
  onSave: (values: UserModuleFormValues) => void | Promise<AddEmployeeSaveSync | void>
}

export type UserFormPanelProps = AddEmployeeFormPanelProps

export type AddEmployeeFormPageProps = AddEmployeeFormPanelProps

export type UserFormPageProps = AddEmployeeFormPageProps

export type EmployeeLoginDetailsSectionProps = {
  isEditMode: boolean
}

export type EmployeeDetailsContentProps = EmployeeLoginDetailsSectionProps

export type AddEmployeeFormTabsProps = {
  activeTab: AddEmployeeFormTab
  onTabChange: (tab: AddEmployeeFormTab) => void
  disabledTabs?: AddEmployeeFormTab[]
}

export type UserFormTabsProps = AddEmployeeFormTabsProps

export type SupervisorDropdownFieldProps = {
  name: "supervisorPrimary" | "supervisorSecondary"
  label: string
  /** Employee display names from GET /users */
  options: string[]
}

/** Item row in security role transfer panels (available / assigned). Alias of AddEmployeeSecurityRoleCatalogItem. */
export type AddEmployeeSecurityRoleItem = AddEmployeeSecurityRoleCatalogItem

export type AddEmployeeSecurityRolePanelProps = {
  title: string
  items: AddEmployeeSecurityRoleItem[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onToggleAll: () => void
}

/** Program or activity row in Time Study transfer panels (with optional code for display). */
export type AddEmployeeTimeStudyTransferItem = {
  id: string
  department: string
  name: string
  code?: string
}

export type AddEmployeeTimeStudyTransferPanelProps = {
  title: string
  items: AddEmployeeTimeStudyTransferItem[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  searchValue: string
  onSearchChange: (value: string) => void
  selectedDept: string
}

