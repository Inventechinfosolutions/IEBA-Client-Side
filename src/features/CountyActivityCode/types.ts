import type { UseFormReturn } from "react-hook-form"

export type MatchStatus = "N" | "E" | "N/M" | "E/N"

export type CountyActivityCodeRow = {
  id: string
  countyActivityCode: string
  countyActivityName: string
  description: string
  department: string
  masterCodeType: string
  masterCode: number
  spmp: boolean
  match: MatchStatus
  percentage: number
  active: boolean
  leaveCode: boolean
  multipleJobPools: boolean
  rowType: "primary" | "sub"
  parentId?: string | null
}

export type CountyActivityFilterFormValues = {
  search: string
  inactive: boolean
}

export type CountyActivityAddFormValues = {
  countyActivityCode: string
  countyActivityName: string
  description: string
  department: string
  masterCodeType: string
  masterCode: number
  match: MatchStatus
  percentage: number
  active: boolean
  leaveCode: boolean
  multipleJobPools: boolean
}

export type CountyActivityPagination = {
  page: number
  pageSize: number
  totalItems: number
}

export type CountyActivityCodeAddPageProps = {
  form: UseFormReturn<CountyActivityAddFormValues>
  onSubmit: (tab: "primary" | "sub") => void
  onClose: () => void
  mode?: "add" | "edit"
  tab?: "primary" | "sub"
  onTabChange?: (tab: "primary" | "sub") => void
  primaryActivityCodeOptions?: ReadonlyArray<{ label: string; value: string }>
  selectedPrimaryId?: string | null
  onSelectedPrimaryIdChange?: (id: string) => void
  disabledTabs?: Partial<Record<"primary" | "sub", boolean>>
}

export type CountyActivityCodeTableProps = {
  rows: CountyActivityCodeRow[]
  primaryRows: CountyActivityCodeRow[]
  subRowsByParentId: Record<string, CountyActivityCodeRow[]>
  pagination: CountyActivityPagination
  totalItems: number
  isLoading?: boolean
  filters: CountyActivityFilterFormValues
  onSearchChange: (value: string) => void
  onInactiveChange: (value: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export type CountyActivityCodeSortableColumn =
  | "countyActivityCode"
  | "countyActivityName"

export type CountyActivityCodeSortDirection = "asc" | "desc" | null
