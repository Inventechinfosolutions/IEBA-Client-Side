import { z } from "zod"
import { jobPoolFormSchema } from "./schemas"

export type JobPoolFormMode = "add" | "edit"
export type JobPoolSortKey = "name"
export type SortDirection = "asc" | "desc" | "none"

export type JobPoolFormValues = z.infer<typeof jobPoolFormSchema>

export type JobClassificationTag = {
  id: string
  name: string
  isHighlighted?: boolean
}

export type TransferItem = {
  id: string
  name: string
  code?: string
}

export type JobPoolRow = {
  id: string
  name: string
  jobClassifications: JobClassificationTag[]
  department: string
  active: boolean
}

export type GetJobPoolsParams = {
  page: number
  pageSize: number
  search: string
  inactiveOnly: boolean
}

export type JobPoolListResponse = {
  items: JobPoolRow[]
  totalItems: number
}

export type CreateJobPoolInput = {
  values: JobPoolFormValues
}

export type UpdateJobPoolInput = {
  id: string
  values: JobPoolFormValues
}

export type JobPoolTableSortState = {
  key: JobPoolSortKey
  direction: SortDirection
}

export type JobPoolToolbarProps = {
  searchValue: string
  inactiveOnly: boolean
  onSearchChange: (value: string) => void
  onToggleInactiveOnly: () => void
  onAdd: () => void
}

export type JobPoolTableProps = {
  rows: JobPoolRow[]
  isLoading: boolean
  onEditRow: (row: JobPoolRow) => void
}

export type JobPoolFormModalProps = {
  open: boolean
  mode: JobPoolFormMode
  initialValues: JobPoolFormValues
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: JobPoolFormValues) => void
}

export type TransferPanelProps = {
  title: string
  items: TransferItem[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onToggleAll: () => void
  searchValue: string
  onSearchChange: (value: string) => void
  isActivity?: boolean
  count: number
  selectedDept?: string
  isSearchDisabled?: boolean
  isListDisabled?: boolean
}

