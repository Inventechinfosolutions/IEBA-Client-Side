import type { UseFormReturn } from "react-hook-form"

export type Department =
  | "Public Health"
  | "Social Services"
  | "Health Services"
  | "Administration"

export type CostPoolRow = {
  id: string
  costPool: string
  department: string
  active: boolean
  assignedActivityIds: string[]
}

export type CostPoolFilterFormValues = {
  search: string
  inactive: boolean
}

export type CostPoolUpsertFormValues = {
  costPool: string
  department: string
  active: boolean
  assignedActivityIds: string[]
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
  mode: "add" | "edit"
  form: UseFormReturn<CostPoolUpsertFormValues>
  onSubmit: () => void
  onClose: () => void
}

export type CostPoolActivity = {
  id: string
  name: string
}


export type CostPoolAddPageProps = CostPoolUpsertDialogProps