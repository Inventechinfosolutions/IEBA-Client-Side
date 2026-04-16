import type { UseFormReturn } from "react-hook-form"

import type { CostPoolStatus, CostPoolUpsertMode } from "./enums/cost-pool.enum"

export type { CostPoolStatus, CostPoolUpsertMode }

/** API: `PaginationMetaDto` */
export type CostPoolPaginationMetaDto = {
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  firstPage: number
  lastPage: number
  itemCount: number
}

export type CostPoolDepartmentResDto = {
  id: number
  code: string
  name: string
  status: string
}

export type CostPoolActivitySummaryResDto = {
  id: number
  activityDepartmentId: number
  activityId: number
  departmentId: number
  code: string
  name: string
  status: string
  type?: string
}

export type CostPoolResDto = {
  id: number
  name: string
  description?: string | null
  status: CostPoolStatus
  departmentId: number
  department?: CostPoolDepartmentResDto
  createdAt?: string
  updatedAt?: string
}

export type CostPoolDetailResDto = CostPoolResDto & {
  assignedActivities?: CostPoolActivitySummaryResDto[]
  unassignedActivities?: CostPoolActivitySummaryResDto[]
}

export type CostPoolListResponseDto = {
  data: CostPoolResDto[]
  meta: CostPoolPaginationMetaDto
}

export type CreateCostPoolResponseDto = {
  id: number
  name: string
  departmentId: number
}

export type CreateCostPoolRequestDto = {
  name: string
  description?: string
  status?: CostPoolStatus
  departmentId: number
  activityDepartmentIds?: number[]
}

export type UpdateCostPoolRequestDto = {
  name?: string
  description?: string
  status?: CostPoolStatus
  departmentId?: number
  activityDepartmentIds?: number[]
}

export type CostPoolListQueryParams = {
  page?: number
  limit?: number
  search?: string
  departmentId?: number | string
  costpoolStatus?: CostPoolStatus
  method?: string
  type?: string
}

export type ActivityDepartmentResDto = {
  id: number
  activityId: number
  departmentId: number
  code: string
  name: string
  status: string
  type?: string
}

export type ActivityDepartmentListResponseDto = {
  data: ActivityDepartmentResDto[]
  meta: CostPoolPaginationMetaDto
}

export type CostPoolRow = {
  id: number
  costPool: string
  department: string
  departmentId: number
  active: boolean
}

export type CostPoolFilterFormValues = {
  search: string
  inactive: boolean
}

export type CostPoolUpsertFormValues = {
  costPool: string
  departmentId: number
  active: boolean
  assignedActivityDepartmentIds: number[]
}

export type CostPoolActivityPickRow = {
  activityDepartmentId: number
  displayName: string
}

export type CostPoolDepartmentOption = {
  id: string
  name: string
}

export type CostPoolVisualCheckboxProps = {
  checked: boolean
}

export type CostPoolPagination = {
  page: number
  pageSize: number
  totalItems: number
}

export type CostPoolSortableColumn = "costPool"

export const COST_POOL_SORT_DIRECTION = {
  ASC: "asc",
  DESC: "desc",
} as const

export type CostPoolSortDirection =
  (typeof COST_POOL_SORT_DIRECTION)[keyof typeof COST_POOL_SORT_DIRECTION] | null

export const COST_POOL_SORT_STATE = {
  NONE: "none",
  ASC: COST_POOL_SORT_DIRECTION.ASC,
  DESC: COST_POOL_SORT_DIRECTION.DESC,
} as const

export type CostPoolSortState =
  (typeof COST_POOL_SORT_STATE)[keyof typeof COST_POOL_SORT_STATE]

export type CostPoolTableProps = {
  rows: CostPoolRow[]
  pagination: CostPoolPagination
  totalItems: number
  isLoading?: boolean
  filters: CostPoolFilterFormValues
  onSearchChange: (value: string) => void
  onInactiveChange: (value: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export type CostPoolUpsertDialogProps = {
  mode: CostPoolUpsertMode
  form: UseFormReturn<CostPoolUpsertFormValues>
  onSubmit: () => void
  onClose: () => void
  departmentOptions: CostPoolDepartmentOption[]
  departmentsLoading?: boolean
  activityRows: CostPoolActivityPickRow[]
  activitiesLoading?: boolean
}

export type CostPoolAddPageProps = CostPoolUpsertDialogProps
