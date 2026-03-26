import { z } from "zod"

import { leaveApprovalFiltersSchema } from "./schemas"

export type LeaveApprovalStatus = "Approved" | "Rejected" | "Withdraw"
export type LeaveApprovalTypeFilter = z.infer<typeof leaveApprovalFiltersSchema>["type"]

export type LeaveApprovalRow = {
  id: string
  employeeName: string
  startDate: string
  startTime: string
  endTime: string
  programCode: string
  activityCode: string
  totalMinutes: number
  status: LeaveApprovalStatus
  commentsCount: number
  commentText?: string
}

export type LeaveApprovalUserOption = {
  id: string
  label: string
}

export type LeaveApprovalFilters = z.infer<typeof leaveApprovalFiltersSchema>

export type SortDirection = "asc" | "desc"
export type LeaveApprovalSortKey = "employeeName" | "startDate"

export type LeaveApprovalSortState = {
  key: LeaveApprovalSortKey
  direction: SortDirection
} | null

export type GetLeaveApprovalsParams = {
  page: number
  pageSize: number
  filters: LeaveApprovalFilters
  sort: LeaveApprovalSortState
}

export type LeaveApprovalListResponse = {
  items: LeaveApprovalRow[]
  totalItems: number
  userOptions: LeaveApprovalUserOption[]
}

export type LeaveApprovalToolbarProps = {
  defaultValues: LeaveApprovalFilters
  userOptions: LeaveApprovalUserOption[]
  isSubmitting?: boolean
  onSearch: (values: LeaveApprovalFilters) => void
}

export type LeaveApprovalTableProps = {
  rows: LeaveApprovalRow[]
  isLoading: boolean
  sort: LeaveApprovalSortState
  onToggleSort: (key: LeaveApprovalSortKey) => void
  onOpenComments: (rowId: string, mode: "comments" | "reject" | "approve") => void
}

export type LeaveApprovalPaginationProps = {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export type LeaveApprovalCommentsModalValues = {
  commentText?: string
}

export type LeaveApprovalCommentsModalProps = {
  open: boolean
  title?: string
  initialValues: LeaveApprovalCommentsModalValues
  onOpenChange: (open: boolean) => void
  onSave: (values: LeaveApprovalCommentsModalValues) => void
}

