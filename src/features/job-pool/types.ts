import { z } from "zod"
import type { UseFormReturn } from "react-hook-form"
import { jobPoolFormSchema } from "./schemas"

export type JobPoolFormMode = "add" | "edit"
export type JobPoolSortKey = "name" | "jobClassifications"
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
  assignedActivityIds?: string[]
  assignedEmployeeIds?: string[]
  /** Optional derived fields for simpler API-style representation */
  departmentName?: string
  jobClassificationName?: { name: string; status: string }[]
  userprofiles?: { id: string; name?: string; firstName?: string; lastName?: string }[]
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
  onToggleAll?: () => void
  searchValue: string
  onSearchChange: (value: string) => void
  isActivity?: boolean
  count: number
  selectedDept?: string
  isSearchDisabled?: boolean
  isListDisabled?: boolean
}

/** Shared alias — avoids repeating the full UseFormReturn generic on every section props type. */
export type JobPoolFormReturn = UseFormReturn<JobPoolFormValues>

export type JobClassificationSectionProps = { form: JobPoolFormReturn }
export type ActivitySectionProps          = { form: JobPoolFormReturn }
export type EmployeeSectionProps          = { form: JobPoolFormReturn }
