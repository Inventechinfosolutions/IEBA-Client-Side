import type { UserModuleFormValues } from "./add-employee/types"

export type {
  UserModuleFormMode,
  UserModuleFormValues,
  AddEmployeeFormTab,
  UserFormTab,
  AddEmployeeSaveSync,
  AddEmployeeFormPanelProps,
  UserFormPanelProps,
  AddEmployeeFormPageProps,
  UserFormPageProps,
  EmployeeLoginDetailsSectionProps,
  EmployeeDetailsContentProps,
  AddEmployeeFormTabsProps,
  UserFormTabsProps,
  SupervisorDropdownFieldProps,
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

export type UserListItemDto = {
  id: string
  loginId: string
  employeeName: string
  employeeId: string
  spmp: boolean
  tsMinPerDay?: number
}

export type UserListResponseDto = {
  data: UserListItemDto[]
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
  user: { loginId: string }
  location?: { id: number; name: string } | null
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
