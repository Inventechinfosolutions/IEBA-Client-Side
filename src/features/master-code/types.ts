import { z } from "zod"
import type { FieldErrors } from "react-hook-form"

import { masterCodeFormSchema } from "./schemas"

export type MasterCodeFormMode = "add" | "edit"

export type MasterCodeFormValues = z.infer<typeof masterCodeFormSchema>

export type MasterCodeRow = {
  id: string
  code?: string
  name: string
  spmp: boolean
  allocable: boolean
  ffpPercent: string
  match: "E" | "N"
  status: boolean
  activityDescription?: string
}

export type GetMasterCodesParams = {
  codeType: string
  page: number
  pageSize: number
  inactiveOnly: boolean
}

export type MasterCodeListResponse = {
  items: MasterCodeRow[]
  totalItems: number
}

export type CreateMasterCodeInput = {
  codeType: string
  values: MasterCodeFormValues
}

export type UpdateMasterCodeInput = {
  id: string
  codeType: string
  values: MasterCodeFormValues
}

export type MasterCodeTab = "FFP" | "MAA" | "TCM" | "INTERNAL" | "CDSS"

export type ActiveTools = {
  bold: boolean
  italic: boolean
  bullet: boolean
}

export type MasterCodeFormModalProps = {
  codeType: string
  open: boolean
  mode: MasterCodeFormMode
  initialValues: MasterCodeFormValues
  onOpenChange: (open: boolean) => void
  onSave: (values: MasterCodeFormValues) => void
}

export type MasterCodeTableProps = {
  codeType: string
  rows: MasterCodeRow[]
  isLoading: boolean
  onEditRow: (row: MasterCodeRow) => void
}

export type MasterCodeSortKey = "code" | "name"
export type MasterCodeSortDirection = "asc" | "desc"
export type MasterCodeSortState = {
  key: MasterCodeSortKey
  direction: MasterCodeSortDirection
}

export type MasterCodeToolbarProps = {
  codeType: string
  allowMultiCodes: boolean
  inactiveOnly: boolean
  onToggleAllowMultiCodes: () => void
  onToggleInactiveOnly: () => void
  onAddFfp: () => void
}

export type MasterCodePaginationProps = {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export type MasterCodeTabsProps = {
  tabs: MasterCodeTab[]
  activeTab: MasterCodeTab
  onChange: (tab: MasterCodeTab) => void
}

export type MasterCodeFormFieldErrors = FieldErrors<MasterCodeFormValues>
