import type { z } from "zod"

import { userModuleFormSchema } from "./schemas"

/** Mirrors backend PaginationMetaDto (local to avoid circular import with user/types). */
export type AddEmployeeListMetaDto = {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
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

/** Backend activities list row (subset). Master `Activity.id` — not valid for POST /users/new/assign/activity. */
export type AddEmployeeActivityCatalogRow = {
  id: number
  code: string
  name: string
  activityCode: string
  status: string
}

/** `GET /activity-departments?departmentId=` row — `id` is ActivityDepartment id (required for user activity assign). */
export type AddEmployeeActivityDepartmentRow = {
  id: number
  activityId: number
  departmentId: number
  code: string
  name: string
  status: string
  parentId?: number | null
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
  roleId?: number
}

/** GET /departments/assignedDepartment/roles — assigned + unassigned lists for Security tab. */
export type SecurityAssignedSnapshot = {
  id: string
  name: string
  departmentId: number
  department: string
}

export type SecurityDepartmentRolesQueryResult = {
  unassigned: AddEmployeeSecurityRoleCatalogItem[]
  assignedSnapshots: SecurityAssignedSnapshot[]
}

/** GET /users/:id/details/required?method=tab2 — Security / Assignments tab slice. */
export type UserDetailsTab2DepartmentRoleDto = {
  id: number
  departmentId: number
  roleId: number
  department: { id: number; name: string }
  role: { id: number; name: string }
  apportioningRequired: boolean
  apportioning?: number
}

export type UserDetailsTab2Dto = {
  id: string
  firstName: string
  lastName: string
  name: string
  departmentsRoles: UserDetailsTab2DepartmentRoleDto[]
}

/** POST /userdepartmentrole/assign/roles and …/unassign/roles body (per department). */
export type UserDepartmentRoleRefPayload = { id: string }

export type ApportioningAllocation = {
  id: number
  allocation: number
}

export type UserDepartmentRoleDepartmentBlockPayload = {
  id: number
  roles: UserDepartmentRoleRefPayload[]
}

export type UserDepartmentRoleDepartmentsBody = {
  userId: string
  departments: UserDepartmentRoleDepartmentBlockPayload[]
  apportioningRequired?: boolean
  apportioningAllocation?: ApportioningAllocation[]
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
  parentId?: string
  level?: number
  isMultiCode?: boolean
}

/** GET /timestudyprogram/user/programs-activities-with-assignments — program row. */
export type UserProgramsActivitiesProgramItem = {
  id: number
  code: string
  name: string
  departmentId: number
  status?: string
  type?: string
  parentId?: number | null
  isMultiCode?: boolean
}

/** Activity row (ActivityDepartment id) nested under an assigned program. */
export type UserProgramsActivitiesActivityItem = {
  id: number
  code: string
  name: string
  departmentId: number
  parentId?: number | null
  activityId?: number
}

export type UserProgramsActivitiesAssignedSplit<T> = {
  assigned: T[]
  unassigned: T[]
}

export type UserProgramsActivitiesProgramWithAssignments = UserProgramsActivitiesProgramItem & {
  children: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem>
  jobpoolId?: number | null
  jobpoolName?: string | null
}

/** Assigned programs from GET …/programs-activities-with-assignments. */
export type UserProgramsActivitiesAssignedPrograms = {
  normal: UserProgramsActivitiesProgramWithAssignments[]
  jobpoolautoassign: UserProgramsActivitiesProgramWithAssignments[]
}

export type UserProgramsActivitiesProgramsBundle = {
  assigned: UserProgramsActivitiesAssignedPrograms
  unassigned: UserProgramsActivitiesProgramWithAssignments[]
}

/** Per-program activity shuttle from GET …/user/activities-with-assignments. */
export type UserProgramsActivitiesProgramActivityGroup = {
  programId: number
  code: string
  name: string
  departmentId: number
  jobpoolId?: number | null
  jobpoolName?: string | null
  children: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem>
}

export type UserProgramsActivitiesProgramActivitiesBundle = {
  assigned: {
    normal: UserProgramsActivitiesProgramActivityGroup[]
    jobpoolautoassign: UserProgramsActivitiesProgramActivityGroup[]
  }
  unassigned: UserProgramsActivitiesProgramActivityGroup[]
}

/** Program row from GET …/user/programs-with-assignments (no `children`). */
export type UserProgramsOnlyProgram = UserProgramsActivitiesProgramItem & {
  jobpoolId?: number | null
  jobpoolName?: string | null
}

export type UserProgramsOnlyProgramsBundle = {
  assigned: {
    normal: UserProgramsOnlyProgram[]
    jobpoolautoassign: UserProgramsOnlyProgram[]
  }
  unassigned: UserProgramsOnlyProgram[]
}

/** GET …/user/departments — lightweight department list (+ user tsMinPerDay). */
export type UserTimeStudyDepartment = {
  departmentId: number
  departmentCode: string
  departmentName: string
  /** `userprofile.tsmins` for this user (same on every department row). */
  tsMinPerDay?: number | null
  allowActivationStartDateAndEndDate?: boolean
  multiCodes?: string[] | null
  moveSaveSubmitToTop?: boolean
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
  removeDescriptionActivityNote?: boolean
  removeDescriptionActivityNoteAnchor?: boolean
  removeDescriptionActivityNoteMultiCode?: boolean
}

/** GET …/user/programs-with-assignments — programs only. */
export type UserProgramsOnlyDepartmentBundle = {
  departmentId: number
  departmentCode: string
  departmentName: string
  tsMinPerDay?: number | null
  moveSaveSubmitToTop?: boolean
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
  removeDescriptionActivityNote?: boolean
  removeDescriptionActivityNoteAnchor?: boolean
  removeDescriptionActivityNoteMultiCode?: boolean
  programs: UserProgramsOnlyProgramsBundle
}

/** GET …/user/activities-with-assignments (activity blocks only). */
export type UserActivitiesOnlyDepartmentBundle = {
  departmentId: number
  departmentCode: string
  departmentName: string
  tsMinPerDay?: number | null
  moveSaveSubmitToTop?: boolean
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
  removeDescriptionActivityNote?: boolean
  removeDescriptionActivityNoteAnchor?: boolean
  removeDescriptionActivityNoteMultiCode?: boolean
  programActivities: UserProgramsActivitiesProgramActivitiesBundle
  orphanActivities: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem>
  jobPoolActivities: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem>
}

/** One department bundle from GET …/programs-activities-with-assignments. */
export type UserProgramsActivitiesDepartmentBundle = {
  departmentId: number
  departmentCode: string
  departmentName: string
  tsMinPerDay?: number | null
  moveSaveSubmitToTop?: boolean
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
  removeDescriptionActivityNote?: boolean
  removeDescriptionActivityNoteAnchor?: boolean
  removeDescriptionActivityNoteMultiCode?: boolean
  programs: UserProgramsActivitiesProgramsBundle
  /** Clubbed activities for the regular activity shuttle (assigned / unassigned). */
  orphanActivities: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem>
  /** Deduped job-pool template activities (JobPool Assigned Activities block). */
  jobPoolActivities?: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem>
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

export type UserModuleFormValues = z.infer<typeof userModuleFormSchema> & {
  jobDutyFile?: File | null
  jobDutyFileId?: number | null
}

export type AddEmployeeFormTab = "employee" | "security" | "supervisor" | "timeStudy"

export type AddEmployeeTabDefinition = {
  id: AddEmployeeFormTab
  label: string
}

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

export type SaveGatedTab = "employee" | "security" | "supervisor"

export type UseAddEmployeeFormParams = {
  mode: UserModuleFormMode
  initialValues: UserModuleFormValues
  /** User id for Security / Supervisor tab APIs (edit or draft). */
  securityContextUserId?: string | null
  onSave: (payload: AddEmployeeSavePayload) => void | Promise<AddEmployeeSaveSync | void>
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
  isSubmitting?: boolean
}

export type UserFormPanelProps = AddEmployeeFormPanelProps

export type AddEmployeeFormPageProps = AddEmployeeFormPanelProps

export type UserFormPageProps = AddEmployeeFormPageProps

export type EmployeeLoginDetailsSectionProps = {
  isEditMode: boolean
  userId?: string | null
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
  onToggleDepartmentGroup?: (idsToAdd: string[], idsToRemove: string[]) => void
  isLoading?: boolean
}

/** Program or activity row in Time Study transfer panels (with optional code for display). */
export type AddEmployeeTimeStudyTransferItem = {
  id: string
  department: string
  name: string
  code?: string
  level?: number
  parentId?: string
  activityId?: number
  isMultiCode?: boolean
  ancestors?: { id: string; name: string; code?: string; isMultiCode?: boolean }[]
}

/** Read-only JobPool block in the assigned transfer column. */
export type AddEmployeeTimeStudyJobPoolSection = {
  sectionTitle: string
  items: AddEmployeeTimeStudyTransferItem[]
}

export type AddEmployeeTimeStudyTransferPanelProps = {
  title: string
  items: AddEmployeeTimeStudyTransferItem[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onToggleAll: () => void
  searchValue: string
  onSearchChange: (value: string) => void
  selectedDept: string
  isLoading?: boolean
  jobPoolSection?: AddEmployeeTimeStudyJobPoolSection | null
}

export type TimeStudyPlacementOverride = "assigned" | "unassigned"

export type TimeStudyPlacementOverrideMap = Record<string, TimeStudyPlacementOverride>

export type TimeStudyAssignmentsPanelProps = {
  mode: UserModuleFormMode
  /** Profile user id — same as Security tab; required for edit-mode user-scoped programs/activities. */
  timeStudyContextUserId?: string | null
}

export type SecurityAssignmentsPanelProps = {
  mode: UserModuleFormMode
  /** User id for `userId` query param (edit = always set; add = draft id when known). */
  securityContextUserId?: string | null
  /** Add mode: allow GET without `userId` before first save. Edit mode should be false. */
  allowUnassignedQueryWithoutUserId: boolean
  /** Add mode: fired after a successful role transfer (API or local). */
  onAddModeTransferSucceeded?: () => void
}

export type SupervisorAssignmentsPanelProps = {
  mode: UserModuleFormMode
  /** User id for GET …/details/required?method=tab3 (edit / draft). */
  supervisorContextUserId?: string | null
}

export type SupervisorMenuOpen = "primary" | "secondary" | null

export type UserAllowMultiCodeHistoryRow = {
  id: number
  userId: string
  startDate: string
  endDate: string | null
  allowMultiCodes: boolean
  multiCodeTypes: string[] | null
  departmentId: number | null
  latestMultiCodeTypes?: string[] | null
  createdAt: string
  createdBy: string | null
  updatedAt: string
  updatedBy: string | null
}

