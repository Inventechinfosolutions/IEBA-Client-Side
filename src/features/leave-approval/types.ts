import { z } from "zod"

import { leaveApprovalFiltersSchema } from "./schemas"
import type { LeaveApprovalStatusValue } from "./enums/leaveApprovalStatus"

export type LeaveApprovalStatus = LeaveApprovalStatusValue
export type LeaveApprovalTypeFilter = z.infer<typeof leaveApprovalFiltersSchema>["type"]

// --- Backend: `src/core/common/dto/api-response.dto.ts` ---
export type ApiResponseDto<T> = {
  success: boolean
  message: string
  data: T | null
  errorCode?: string | null
}

/** Alternate gateway envelope (matches some deployed APIs). */
export type ApiEnvelopeDto<T> = {
  statusCode: number
  message: string
  data: T
}

// --- Backend: `src/core/common/dto/pagination-meta.dto.ts` ---
export type PaginationMetaDto = {
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

// --- Backend: `userleavestatus.enum.ts` ---
export type UserLeaveStatusDto =
  | "draft"
  | "requested"
  | "approved"
  | "rejected"
  | "withdraw"

// --- Backend: `dto/response/user-leave.res.dto.ts` → `UserLeavePersonNameDto` ---
export type UserLeavePersonNameDto = {
  firstName: string
  lastName: string
}

// --- Backend: `dto/response/user-leave.res.dto.ts` → `UserLeaveListItemDto` ---
export type UserLeaveListItemDto = {
  id: number
  userId: string
  programid: string | null
  activityid: string | null
  programcode: string
  programname: string
  activitycode: string
  activityname: string
  startdt: string
  enddt: string
  starttime: string
  endtime: string
  leaveTotalTime: number
  requestdate: string
  requestcomment: string | null
  supervisorcomment: string | null
  updatedOn: string
  status: UserLeaveStatusDto
  user: UserLeavePersonNameDto
  supervisor?: UserLeavePersonNameDto
}

// --- Backend: `dto/response/user-leave.res.dto.ts` → `UserLeaveListResponseDto` (`items` + `meta`) ---
export type UserLeaveListResponseDto = {
  items: UserLeaveListItemDto[]
  meta: PaginationMetaDto
}

/** Older responses used `data` instead of `items`. */
export type UserLeaveListResponseLegacyDto = {
  data: UserLeaveListItemDto[]
  meta: PaginationMetaDto
}

/** @deprecated Use `UserLeaveListItemDto` — list rows are always enriched now. */
export type UserLeaveListItemEnrichedDto = UserLeaveListItemDto

/** @deprecated Gateway-only; prefer `UserLeaveListResponseDto`. */
export type UserLeaveListResponseAlternateDto = UserLeaveListResponseDto

// --- Backend: `dto/response/user-leave-details.res.dto.ts` ---
export type UserLeaveStatusCountDto = {
  status: string
  count: number
}

export type UserLeaveDetailsResponseDto = {
  totalLeaves: number
  statusCounts: UserLeaveStatusCountDto[]
}

// --- Backend: `entity/userleave.model.ts` (JSON-serialized) ---
export type UserLeave = {
  id: number
  userId: string
  programid: string | null
  activityid: string | null
  programcode: string
  programname: string
  activitycode: string
  activityname: string
  startdt: string
  enddt: string
  starttime: string
  endtime: string
  leaveTotalTime: number
  requestdate: string
  requestcomment: string | null
  supervisorcomment: string | null
  supervisoruserId: string | null
  updatedOn: string
  status: UserLeaveStatusDto
  user?: { firstName: string; lastName: string }
  supervisor?: { firstName: string; lastName: string }
}

// --- Backend: `dto/request/create-user-leave.req.dto.ts` ---
export type CreateUserLeaveRequestDto = {
  id?: number
  userId?: string
  programid?: string
  activityid?: string
  programcode: string
  programname: string
  activitycode: string
  activityname: string
  startdt: string
  enddt: string
  starttime: string
  endtime: string
  leaveTotalTime: number
  requestcomment?: string
  status?: "requested" | "withdraw"
}

// --- Backend: `dto/request/submit-user-leave.req.dto.ts` ---
export type SubmitUserLeaveRequestDto = {
  action: "approved" | "rejected"
  supervisorcomment?: string
}

// --- Backend: `dto/request/review-user-leave.req.dto.ts` ---
export type ReviewUserLeaveRequestDto = {
  status: "approved" | "rejected"
  /** Optional legacy alias; backend ignores it when `status` is sent. */
  supervisor_status?: "approved" | "rejected"
  supervisorcomment?: string
}

// --- Backend: `dto/request/user-leave-list-query.dto.ts` ---
export type UserLeaveListQueryDto = {
  page?: number
  limit?: number
  sort?: string
  status?: string
  userId?: string
  filterUserId?: string
  action?: "leaveDetails"
  date?: string
}

/** Params used by the leave-approval query hook (maps UI → `UserLeaveListQueryDto`). */
export type GetUserLeavesParams = {
  page: number
  limit: number
  sort?: "ASC" | "DESC"
  status?: LeaveApprovalStatus
  userId?: string
  filterUserId?: string
  action?: "leaveDetails"
  date?: string
}

/** UI row: list item, possibly enriched by API. */
export type LeaveApprovalRow = UserLeaveListItemEnrichedDto

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
  enabled?: boolean
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
  onOpenComments: (rowId: number, mode: "comments" | "reject" | "approve" | "requested") => void
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
  mode?: "comments" | "reject" | "approve" | "requested"
  initialValues: LeaveApprovalCommentsModalValues
  onOpenChange: (open: boolean) => void
  onSave: (
    values: LeaveApprovalCommentsModalValues,
    action: "comment" | "approve" | "reject",
  ) => void
}
