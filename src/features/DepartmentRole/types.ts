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
  departmentName: string
  roles: string[]
  status: RoleStatus
  children?: Array<{
    id: string
    roleName: string
    status: RoleStatus
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
}

export type PaginationState = {
  page: number
  pageSize: number
  totalItems: number
}

export type DepartmenRoleTableProps = {
  data: DepartmentRoleWithChildren[]
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onView?: (id: string) => void
  onOptionAction?: (id: string, action: string) => void
  isLoading?: boolean
}

export type DepartmentRoleAddProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AddRoleFormValues) => void
  isSubmitting?: boolean
}

export type DepartmentRoleViewData = {
  departmentName: string
  roleName: string
  active: boolean
}

export type DepartmentRoleViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: DepartmentRoleViewData | null
}
