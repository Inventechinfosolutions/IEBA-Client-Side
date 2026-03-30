import { z } from "zod"
import { jobClassificationFormSchema } from "./schemas"

export type JobClassificationFormMode = "add" | "edit"
export type JobClassificationSortKey = "code" | "name"
export type SortDirection = "asc" | "desc" | "none"

export type ActiveTools = {
  bold: boolean
  italic: boolean
  bullet: boolean
}

export type JobClassificationFormValues = z.infer<typeof jobClassificationFormSchema>

export type JobClassificationRow = {
  id: string
  code: string
  name: string
  active: boolean
}

export type GetJobClassificationsParams = {
  page: number
  pageSize: number
  search: string
  inactiveOnly: boolean
}

export type JobClassificationListResponse = {
  items: JobClassificationRow[]
  totalItems: number
}

export type CreateJobClassificationInput = {
  values: JobClassificationFormValues
}

export type UpdateJobClassificationInput = {
  id: string
  values: JobClassificationFormValues
}

export type JobClassificationTableSortState = {
  key: JobClassificationSortKey
  direction: SortDirection
}

export type JobClassificationToolbarProps = {
  searchValue: string
  inactiveOnly: boolean
  onSearchChange: (value: string) => void
  onToggleInactiveOnly: () => void
  onAdd: () => void
}

export type JobClassificationTableProps = {
  rows: JobClassificationRow[]
  isLoading: boolean
  onEditRow: (row: JobClassificationRow) => void
}

export type JobClassificationFormModalProps = {
  open: boolean
  mode: JobClassificationFormMode
  initialValues: JobClassificationFormValues
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: JobClassificationFormValues) => void
}
