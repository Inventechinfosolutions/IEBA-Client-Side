import type { UserModuleFormValues } from "./add-employee/types"

export type {
  UserModuleFormMode,
  UserModuleFormValues,
  AddEmployeeFormTab,
  AddEmployeeTabDefinition,
  UserFormTab,
  AddEmployeeSavePayload,
  AddEmployeeSaveSync,
  SaveGatedTab,
  UseAddEmployeeFormParams,
  AddEmployeeFormPanelProps,
  UserFormPanelProps,
  AddEmployeeFormPageProps,
  UserFormPageProps,
  EmployeeLoginDetailsSectionProps,
  EmployeeDetailsContentProps,
  AddEmployeeFormTabsProps,
  UserFormTabsProps,
  SupervisorPickerOption,
  TimeStudyPlacementOverride,
  TimeStudyPlacementOverrideMap,
  TimeStudyAssignmentsPanelProps,
  SecurityAssignmentsPanelProps,
  SupervisorMenuOpen,
} from "./add-employee/types"

export type UserModuleRow = {
  id: string
  employee: string
  employeeNo?: string
  positionNo?: string
  location?: string
  firstName?: string
  lastName?: string
  phone?: string
  loginId?: string
  password?: string
  emailAddress?: string
  jobClassification?: string
  claimingUnit?: string
  multilingual?: boolean
  allowMultiCodes?: boolean
  pkiUser?: boolean
  department: string
  roleAssignments?: string[]
  supervisorPrimary: string
  supervisorSecondary?: string
  /** From list/details for edit form → PUT supervisor ids. */
  supervisorPrimaryId?: string
  supervisorSecondaryId?: string
  spmp: boolean
  tsMinDay: string
  programs: boolean
  activities: boolean
  supervisorApportioning: boolean
  clientAdmin: boolean
  multicodesEnabled: boolean
  assignedMultiCodes: string
  active: boolean
}

export type GetUserModuleParams = {
  page: number
  pageSize: number
  inactiveOnly: boolean
  /** Backend `UserListQueryDto.sort` — order by loginId. */
  sort?: "ASC" | "DESC"
}

export type PaginationMetaDto = {
  /** Total number of items across all pages */
  totalItems: number
  /** Number of items in this page */
  itemCount: number
  /** Items per page (limit) */
  itemsPerPage: number
  /** Total number of pages */
  totalPages: number
  /** Current page */
  currentPage: number
}

export type ApiResponseDto<T> = {
  success: boolean
  message: string
  data: T | null
  errorCode?: string | null
}

/** Matches backend `CreateUserContactItemDto` / update `contacts`. */
export type UserContactItemPayload = { phone?: string; countryCode?: string }

/**
 * GET /users `data[]` wire shape (table list). Extra keys may exist; we map only what the grid needs into `UserModuleRow`.
 */
export type UserListDepartmentRoleItemDto = {
  id: number
  departmentId: number
  roleId: number
  department: { id: number; name: string }
  role: { id: number; name: string }
  apportioningRequired: boolean
  apportioning?: number
}

export type UserListItemApiDto = {
  id: string
  user: { loginId: string }
  name: string
  firstName: string
  lastName: string
  status: string
  employeeId?: string | null
  positionName?: string | null
  claimingUnit?: string | null
  tsmins?: number | null
  spmp?: boolean
  primarySupervisor?: { id: string; name: string } | null
  backupSupervisor?: { id: string; name: string } | null
  location?: { id: number; name: string } | null
  departments: Array<{ id: number; code: string; name: string }>
  roles: Array<{ id: number; name: string }>
  departmentsRoles: UserListDepartmentRoleItemDto[]
  allowMultiCodes: boolean
  multiCodes?: string[] | null
}

/** @deprecated Use `UserListItemApiDto` */
export type UserListItemDto = UserListItemApiDto

export type UserListResponseDto = {
  data: UserListItemApiDto[]
  meta: PaginationMetaDto
}

export type CreateUserRequestDto = {
  loginId: string
  password: string
  firstName: string
  lastName: string
  employeeId: string
  positionName?: string
  locationId?: number
  active?: boolean
  pki?: boolean
  spmp?: boolean
  multilingual?: boolean
  allowMultiCodes?: boolean
  tsMinPerDay?: number
  claimingUnit?: string
  assignedMultiCodes?: string[]
  contacts?: Array<{ phone?: string; countryCode?: string }>
}

export type UpdateUserRequestDto = {
  firstName?: string
  lastName?: string
  roles?: string[]
  password?: string
  employeeId?: string
  positionName?: string
  position?: string
  locationId?: number
  active?: boolean
  pki?: boolean
  spmp?: boolean
  multilingual?: boolean
  allowMultiCodes?: boolean
  tsMinPerDay?: number
  claimingUnit?: string
  assignedMultiCodes?: string[]
  primarySupervisorId?: string
  backupSupervisorId?: string
  contacts?: UserContactItemPayload[]
}

export type CreateUserResponseDto = {
  id: string
  loginId: string
}

export type UserDetailsDepartmentDto = { id: number; code: string; name: string }
export type UserDetailsRoleDto = { id: number; name: string }
export type UserDetailsDepartmentRoleDto = {
  id: number
  departmentId: number
  roleId: number
  department: { id: number; name: string }
  role: { id: number; name: string }
  permissions: string[]
}

/** GET /users/:id/details payload (subset used by the Add Employee form). */
export type UserDetailsDto = {
  id: string
  positionName?: string | null
  employeeId?: string | null
  firstName: string
  lastName: string
  name: string
  status: string
  tsmins?: number | null
  spmp?: boolean
  multilingual?: boolean
  user: { loginId: string }
  /** Serialized USER contacts (`type: phone` holds primary phone digits). */
  contacts?: Array<{
    id?: number
    refType?: string
    type?: string
    phone?: string
    countryCode?: string
    value?: string
  }>
  location?: { id: number; name: string } | null
  primarySupervisor?: { id: string; name: string } | null
  backupSupervisor?: { id: string; name: string } | null
  emergencyContact?: {
    id: number
    firstName: string
    lastName: string
    countryCode: string
    phone: string
    relationship: string
  } | null
  departments: UserDetailsDepartmentDto[]
  roles: UserDetailsRoleDto[]
  departmentsRoles: UserDetailsDepartmentRoleDto[]
  /** Flattened permission strings from roles (see backend `UserDetailsResDto`). */
  allpermissions?: string[]
  allowMultiCodes: boolean
  multiCodes?: string[] | null
}

export type UserModuleListResponse = {
  items: UserModuleRow[]
  totalItems: number
}

export type CreateUserModuleInput = {
  values: UserModuleFormValues
}

export type UpdateUserModuleInput = {
  id: string
  values: UserModuleFormValues
}

export type UserTableProps = {
  rows: UserModuleRow[]
  isLoading: boolean
  onEditRow: (row: UserModuleRow) => void
}

export type UserTableSortState = "none" | "asc" | "desc"

export type UserToolbarProps = {
  inactiveOnly: boolean
  searchTerm: string
  suggestions: string[]
  onToggleInactiveOnly: () => void
  onSearchChange: (value: string) => void
  onSelectSuggestion: (value: string) => void
  onAddEmployee: () => void
}

export type UserPaginationProps = {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}
