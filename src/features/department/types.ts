import type { z } from "zod"
import {
  departmentSchema,
  departmentFilterSchema,
  departmentUpsertSchema,
  departmentContactSchema,
} from "./schemas"

export type DepartmentUpsertValues = z.infer<typeof departmentUpsertSchema>

export type DepartmentContact = z.infer<typeof departmentContactSchema>
export type Department = z.infer<typeof departmentSchema>
export type DepartmentFilter = z.infer<typeof departmentFilterSchema>

export type SortColumn = "code" | "name" | null
export type SortDirection = "asc" | "desc" | null

export const PAGE_SIZES = [10, 20, 30, 50] as const

export interface DepartmentTableProps {
  departments: Department[]
  totalItems: number
  isLoading: boolean
  pagination: {
    pageIndex: number
    pageSize: number
  }
  filters: DepartmentFilter
  onSearchChange: (search: string) => void
  onInactiveChange: (inactive: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onAdd: () => void
  onEdit?: (id: string) => void
}

export interface DepartmentAddPageProps {
  id: string | null
  onClose: () => void
}

export type ActiveTab = "details" | "settings"
export type DetailsTab = "address" | "primary" | "secondary" | "billing"

export type PendingTabChange =
  | { type: "active"; value: ActiveTab }
  | { type: "details"; value: DetailsTab }

export type ModifiedContacts = Record<DetailsTab, boolean>

export type HandleTabChange = (value: string) => Promise<void>
export type HandleDetailsTabChange = (tabId: DetailsTab) => void

export interface DetailTabConfig {
  id: DetailsTab
  label: string
  width: string
}

export const DETAIL_TABS: readonly DetailTabConfig[] = [
  { id: "address", label: "Address", width: "160px" },
  { id: "primary", label: "Primary Contact", width: "214px" },
  { id: "secondary", label: "Secondary Contact", width: "214px" },
  { id: "billing", label: "Billing Contact", width: "214px" },
] as const

// API-layer DTO and envelope types

export type DepartmentApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

export type DepartmentPaginationMeta = {
  total?: number
  totalItems?: number
  page?: number
  limit?: number
  itemsPerPage?: number
  currentPage?: number
  itemCount?: number
  totalPages?: number
}

export type DepartmentListResponseDto = {
  data: unknown[]
  meta?: DepartmentPaginationMeta
}

export type DepartmentResDto = Record<string, unknown> & {
  id?: number
  code?: string
  name?: string
  status?: unknown
  addresses?: unknown
  address?: unknown
  primaryContact?: unknown
  secondaryContact?: unknown
  billingContact?: unknown
  allowMultiCodes?: boolean
  multiCodes?: unknown
  allowUserOrCostpoolDirect?: boolean
  costallocation?: boolean
  apportioning?: boolean
  autoApportioning?: boolean
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
}

export type DepartmentAddressCreateDto = {
  addressLine1: string
  city: string
  state: string
  zipCode: string
}

export type CreateDepartmentReqDto = {
  code: string
  name: string
  status: "active" | "inactive"
  address?: DepartmentAddressCreateDto
  apportioning?: boolean
  costallocation?: boolean
  autoApportioning?: boolean
  allowUserOrCostpoolDirect?: boolean
  allowMultiCodes?: boolean
  multiCodes?: string[]
  removeAutoFillEndTime?: boolean
  startorEndTime?: boolean
  supportingDoc?: boolean
}

export type UpdateDepartmentReqDto = Partial<CreateDepartmentReqDto>

export type CreateDepartmentResponseDto = {
  id: number
  code: string
  name: string
}

export type ToDepartmentUIOptions = {
  /** List rows need `address` for the table; GET-by-id / PUT responses often omit it — map only when true. */
  includeAddress?: boolean
}
