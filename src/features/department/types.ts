import type { z } from "zod"
import {
  DEPARTMENT_FORM_DEFAULT_VALUES,
  departmentSchema,
  departmentFilterSchema,
  departmentUpsertSchema,
  departmentContactSchema,
} from "./schemas"
import {
  DepartmentDetailsSubTab,
  DepartmentMainTab,
  type DepartmentApiListSortOrder,
  type DepartmentApiRecordStatus,
} from "./enums/department.enum"

export type DepartmentUpsertValues = z.infer<typeof departmentUpsertSchema>

export type DepartmentContact = z.infer<typeof departmentContactSchema>
export type Department = z.infer<typeof departmentSchema>
export type DepartmentFilter = z.infer<typeof departmentFilterSchema>

const {
  code: _omitEmptyDepartmentCode,
  name: _omitEmptyDepartmentName,
  ...departmentUiEmptyBase
} = DEPARTMENT_FORM_DEFAULT_VALUES

/** Default non-identity slice of `Department` for API → UI mapping (aligned with form defaults). */
export const EMPTY_DEPARTMENT_UI: Omit<Department, "id" | "code" | "name"> =
  departmentUiEmptyBase

export type SortColumn = "code" | "name" | null
export type SortDirection = "asc" | "desc" | null

export type ActiveTab = (typeof DepartmentMainTab)[keyof typeof DepartmentMainTab]
export type DetailsTab =
  (typeof DepartmentDetailsSubTab)[keyof typeof DepartmentDetailsSubTab]

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

export const PAGE_SIZES = [10, 20, 30, 50] as const

export const DETAIL_TABS: readonly DetailTabConfig[] = [
  { id: "address", label: "Address", width: "160px" },
  { id: "primary", label: "Primary Contact", width: "214px" },
  { id: "secondary", label: "Secondary Contact", width: "214px" },
  { id: "billing", label: "Billing Contact", width: "214px" },
] as const

type ContactDetailsTab = Exclude<DetailsTab, "address">

export const DEPARTMENT_CONTACT_FORM_PREFIX: Record<
  ContactDetailsTab,
  "primaryContact" | "secondaryContact" | "billingContact"
> = {
  primary: "primaryContact",
  secondary: "secondaryContact",
  billing: "billingContact",
}

export const DEPARTMENT_CONTACT_ID_FIELD: Record<
  ContactDetailsTab,
  "primaryContactId" | "secondaryContactId" | "billingContactId"
> = {
  primary: "primaryContactId",
  secondary: "secondaryContactId",
  billing: "billingContactId",
}

type DepartmentSettingsFormKey = keyof DepartmentUpsertValues["settings"]

export const DEPARTMENT_SETTINGS_ROWS: readonly {
  key: DepartmentSettingsFormKey
  label: string
}[] = [
  { key: "apportioning", label: "Apportioning" },
  { key: "costAllocation", label: "Cost Allocation" },
  { key: "autoApportioning", label: "Auto Apportioning" },
  { key: "allowUserCostpoolDirect", label: "Allow User/Costpool Direct" },
  { key: "allowMultiCodes", label: "Allow MultiCodes" },
  { key: "removeStartEndTime", label: "Remove Start and End Time" },
  { key: "removeSupportingDocument", label: "Remove Supporting Document" },
  { key: "removeAutoFillEndTime", label: "Remove Auto Fill End Time" },
  { key: "removeDescriptionActivityNote", label: "Remove Description/Activity/Note" },
] as const

/** Resolved contact row for the department table when the list API has richer data than the department DTO. */
export type DepartmentContactResolved = {
  name: string
  email: string
  phone: string
  location: string
}

export type DepartmentContactCellProps = {
  contactId?: string | null
  contact?: Department["primaryContact"]
  resolved?: DepartmentContactResolved | null
}

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
  primaryContactId?: unknown
  secondaryContactId?: unknown
  billingContactId?: unknown
  allowMultiCodes?: boolean
  multiCodes?: unknown
  allowUserOrCostpoolDirect?: boolean;
  costallocation?: boolean;
  apportioning?: boolean;
  autoApportioning?: boolean;
  removeAutoFillEndTime?: boolean;
  startorEndTime?: boolean;
  supportingDoc?: boolean;
  removeDescriptionActivityNote?: boolean;
}

export type DepartmentAddressCreateDto = {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
}

export type CreateDepartmentReqDto = {
  code: string;
  name: string;
  status: DepartmentApiRecordStatus;
  address?: DepartmentAddressCreateDto;
  apportioning?: boolean;
  costallocation?: boolean;
  autoApportioning?: boolean;
  allowUserOrCostpoolDirect?: boolean;
  allowMultiCodes?: boolean;
  multiCodes?: string[];
  removeAutoFillEndTime?: boolean;
  startorEndTime?: boolean;
  supportingDoc?: boolean;
  removeDescriptionActivityNote?: boolean;
  primaryContactId?: string | null;
  secondaryContactId?: string | null;
  billingContactId?: string | null;
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

export type GetDepartmentsParams = {
  page?: number
  limit?: number
  status?: DepartmentApiRecordStatus
  sort?: DepartmentApiListSortOrder
  userId?: string
  search?: string
}

export type GetAllDepartmentsParams = {
  status?: DepartmentApiRecordStatus
  sort?: DepartmentApiListSortOrder
}

export type GetDepartmentsListResult = {
  items: Department[]
  total: number
}

export type { DepartmentApiListSortOrder, DepartmentApiRecordStatus }
