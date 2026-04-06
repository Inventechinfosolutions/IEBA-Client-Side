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

/** POST /userdepartmentrole/assign/roles and …/unassign/roles body (per department). */
export type UserDepartmentRoleRefPayload = { id: string }

export type UserDepartmentRoleDepartmentBlockPayload = {
  id: number
  roles: UserDepartmentRoleRefPayload[]
}

export type UserDepartmentRoleDepartmentsBody = {
  userId: string
  departments: UserDepartmentRoleDepartmentBlockPayload[]
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

/** GET /timestudyprograms/user/programs-activities?userId= — program row per department bundle. */
export type UserProgramsActivitiesProgramItem = {
  id: number
  code: string
  name: string
  departmentId: number
}

/** GET /timestudyprograms/user/programs-activities?userId= — activity row per department bundle. */
export type UserProgramsActivitiesActivityItem = {
  id: number
  code: string
  name: string
  departmentId: number
}

/** One department’s programs + activities for the user-scoped time study endpoint. */
export type UserProgramsActivitiesDepartmentBundle = {
  departmentId: number
  departmentCode: string
  departmentName: string
  programs: UserProgramsActivitiesProgramItem[]
  activities: UserProgramsActivitiesActivityItem[]
}

/** POST /users/new/assign/program and …/unassign/program */
export type AssignUserProgramsApiBody = {
  userId: string
  programs: number[]
}

/**
 * POST /users/new/assign/activity and …/unassign/activity.
 * `countyActivity` = ActivityDepartment ids for `departmentId` (see backend DTO).
 */
export type AssignUserActivitiesApiBody = {
  userId: string
  departmentId: number
  countyActivity: number[]
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

/** Location row from GET /location (active list for Add Employee). */
export type AddEmployeeLocationRow = {
  id: number
  name: string
  clientId: number
  status: string
}

export type AddEmployeeLocationListPayload = {
  data: AddEmployeeLocationRow[]
  meta: AddEmployeeListMetaDto
}

/** County activity row from GET /countyactivity?method=listcountyactivity (normalized). */
export type AddEmployeeCountyActivityRow = {
  id: string
  countyActivityCode?: string
  countyActivityName?: string
}

/** GET /users/supervisors — time-study supervisor role holders in given departments. */
export type AddEmployeeDepartmentSupervisorRow = {
  id: string
  loginId: string
  firstName: string
  lastName: string
  name: string
  employeeId: string
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

/** Passed to `onSave` so the page can scope follow-up calls (e.g. GET roles-assigned only after Security save). */
export type AddEmployeeSavePayload = {
  values: UserModuleFormValues
  sourceTab: AddEmployeeFormTab
}

export type AddEmployeeFormPanelProps = {
  mode: UserModuleFormMode
  initialValues: UserModuleFormValues
  /**
   * User id for Security APIs: add flow = draft id after first save (or null); edit = row id.
   */
  securityContextUserId?: string | null
  onCancel: () => void
  onSave: (payload: AddEmployeeSavePayload) => void | Promise<AddEmployeeSaveSync | void>
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

/** Supervisor picker row: `id` is user profile UUID for PUT /users/:id. */
export type SupervisorPickerOption = { id: string; label: string }

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

