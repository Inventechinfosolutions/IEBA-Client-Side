import { z } from "zod"
import type { FieldErrors } from "react-hook-form"

import { MasterCodeTypeEnum } from "@/features/master-code/enums/master-code-type.enum"
import type { ActivityStatusEnum as ActivityStatus } from "@/features/master-code/enums/activity-status.enum"

import { masterCodeFormSchema } from "./schemas"

export type MasterCodeTab = (typeof MasterCodeTypeEnum)[keyof typeof MasterCodeTypeEnum]

/** Tab strip order (UI); tab labels match `MasterCodeTypeEnum` / activity `type` — not loaded from DB. */
export const MASTER_CODE_TYPE_TAB_ORDER: MasterCodeTab[] = [
  MasterCodeTypeEnum.FFP,
  MasterCodeTypeEnum.MAA,
  MasterCodeTypeEnum.TCM,
  MasterCodeTypeEnum.INTERNAL,
  MasterCodeTypeEnum.CDSS,
]

export type MasterCodeFormMode = "add" | "edit"

export type MasterCodeFormValues = z.infer<typeof masterCodeFormSchema>

/** Activity-code `type` / master tab — same strings as `master-codes.name` and API `type` filter. */
export type MasterCodeRow = {
  id: string
  code?: string
  name: string
  spmp: boolean
  allocable: boolean
  ffpPercent: string
  match: string
  status: boolean
  activityDescription?: string
}

export type GetMasterCodesParams = {
  codeType: MasterCodeTab | ""
  page: number
  pageSize: number
  inactiveOnly: boolean
}

export type MasterCodeListResponse = {
  items: MasterCodeRow[]
  totalItems: number
}

/** Row from `GET /api/v1/master-codes/by-name` or list/detail responses */
export type TenantMasterCodeRow = {
  id: number
  name: string
  allowMulticode: boolean
  status: ActivityStatus
}

export type CreateMasterCodeInput = {
  codeType: MasterCodeTab
  values: MasterCodeFormValues
}

export type UpdateMasterCodeInput = {
  id: string
  codeType: MasterCodeTab
  values: MasterCodeFormValues
}

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
  activeTab: MasterCodeTab | ""
  onChange: (tab: MasterCodeTab) => void
}

export type MasterCodeFormFieldErrors = FieldErrors<MasterCodeFormValues>
