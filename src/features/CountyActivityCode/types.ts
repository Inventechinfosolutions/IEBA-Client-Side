import type { UseFormReturn } from "react-hook-form"
import { z } from "zod"

import type { MasterCodeRow } from "@/features/master-code/types"

import type {
  ApiActivityType,
  CountyActivityAddPageMode,
  CountyActivityGridRowType,
} from "./enums/CountyActivity.enum"
import {
  countyActivityAddFormSchema,
  countyActivityFilterFormSchema,
} from "./schemas"

export * from "./enums/CountyActivity.enum"

export type CountyActivityFilterFormValues = z.infer<typeof countyActivityFilterFormSchema>

export type CountyActivityAddFormValues = z.infer<typeof countyActivityAddFormSchema>

/**
 * Echo of master activity-codes `match` (N, E, N/M, E/N, per-type codes such as MAA `F`, etc.).
 * Same rules as master-code form: trimmed, max 5 characters.
 */
export type MatchStatus = string

export type CountyActivityCodeRow = {
  id: string
  countyActivityCode: string
  countyActivityName: string
  description: string
  department: string
  /** IDs from activity–department links; names are resolved in the county activity grid hook from cached departments. */
  linkedDepartmentIds: number[]
  masterCodeType: string
  masterCode: number
  /** Master activity-code value from API (`activityCode` on activity) — used to match catalog rows when editing. */
  catalogActivityCode: string
  spmp: boolean
  match: MatchStatus
  percentage: number
  active: boolean
  leaveCode: boolean
  docRequired: boolean
  multipleJobPools: boolean
  apportioning: boolean
  manualApportioning: boolean
  apportioningDepartments: { name: string; apportioning: boolean; manualApportioning?: boolean }[]
  rowType: CountyActivityGridRowType
  parentId?: string | null
  hasChild?: boolean
  bhsaApplicable: boolean
  expenditureClassification: string | null
  bhccCategory: string | null
  ageGroup: string | null
  otherCountyExpenditureType: string | null
  bhsaNotes: string | null
}

/** Nested on `GET /activities/hierarchy` and `GET /activities/:id` (backend `ActivityNestedDepartmentResDto`). */
export type ApiActivityNestedDepartmentResDto = {
  id: number
  code: string
  name: string
  status: string
  apportioning?: boolean
  manualApportioning?: boolean
}

export type ApiActivityParentResDto = {
  id: number
  code?: string
  name?: string
  description?: string | null
  type?: ApiActivityType
  activityCode?: string
  activityCodeType?: string
  leavecode?: boolean
  docrequired?: boolean
  status?: string
  isActivityAssignableToMultipleJobPools?: boolean
}

export type ApiActivityResDto = {
  id: number
  code: string
  name: string
  description: string | null
  type: ApiActivityType
  activityCode: string
  activityCodeType: string
  leavecode: boolean
  docrequired: boolean
  status: string
  isActivityAssignableToMultipleJobPools: boolean
  apportioning: boolean
  manualApportioning: boolean
  parentId?: number | null
  /** Present on list/hierarchy when API hydrates links. */
  departments?: ApiActivityNestedDepartmentResDto[]
  /** Detail GET/PUT — linked departments for the shuttle (right side). */
  assignedDepartments?: ApiActivityNestedDepartmentResDto[]
  /** Detail GET/PUT — active departments not linked (left side). */
  unassignedDepartments?: ApiActivityNestedDepartmentResDto[]
  parent?: ApiActivityParentResDto | null
  activityCodeId?: number | null
  activityCodeName?: string | null
  /** SPMP flag from linked activity code (present on list responses). */
  spmp?: boolean
  /** Match from linked activity code (present on list responses). */
  match?: string | null
  /** Percent (%) from linked activity code (present on list responses). */
  percent?: number
  activityDepartments?: ApiActivityDepartmentResDto[]
  apportioningDepartments?: any[]
  hasChild?: boolean
  bhsaApplicable?: boolean
  expenditureClassification?: string | null
  bhccCategory?: string | null
  ageGroup?: string | null
  otherCountyExpenditureType?: string | null
  bhsaNotes?: string | null
}

export type ApiActivityTreeResDto = ApiActivityResDto & {
  children?: ApiActivityTreeResDto[]
}

/** Wrapped `data` from `GET /activities` (paginated list). */
export type CountyActivityListResponsePayload = {
  data: ApiActivityResDto[]
  meta: CountyActivityListMeta
}

export type CountyActivityListMeta = {
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  itemCount: number
}

/** Cached paginated list value for county activity queries (`setQueryData` / cache readers). */
export type PagedCountyActivityData = {
  rows: CountyActivityCodeRow[]
  meta: CountyActivityListMeta
  raw: ApiActivityResDto[] | unknown[]
}

/** Params segment for {@link countyActivityCodeKeys.pagedList} (query key index after `paged` prefix). */
export type PagedListParams = {
  page: number
  pageSize: number
  search: string
  status: string
  departmentIds?: number[]
}

export type CountyActivityListQueryParams = {
  page: number
  limit: number
  search?: string
  /** Backend `ActivityStatusEnum` string (`active` | `inactive`). */
  status?: string
  sort?: "ASC" | "DESC"
  /** Filter to activities linked to any of these department IDs (non-super-admin). */
  departmentIds?: number[]
}

/** Params for paginated `GET /activities` (toolbar search is debounced before reaching the query). */
export type CountyActivityPagedListParams = {
  page: number
  pageSize: number
  search: string
  showInactive: boolean
  /** Department IDs to restrict results to — undefined = SuperAdmin (no filter). */
  assignedDepartmentIds?: number[]
}

export type ApiActivityDepartmentResDto = {
  id: number
  activityId: number
  departmentId: number
  code: string
  name: string
  status: string
  type: ApiActivityType
  leavecode: boolean
  parentId?: number | null
  apportioning: boolean
  manualApportioning: boolean
  department?: {
    name?: string
    apportioning: boolean
    manualApportioning?: boolean
  }
}

export type CountyActivityEditPayload = {
  activity: ApiActivityResDto
  departmentNames: string[]
  apportioningDepartments: { name: string; apportioning: boolean; manualApportioning?: boolean }[]
  /** From GET /activities/:id shuttle + activityDepartments — drives manual-only filter in edit modal. */
  departmentManualApportioningByName?: Record<string, boolean>
}

/** Context for merging copy-from-master and sub-primary defaults into the county activity add form before submit. */
export type CountyActivityAddFormMergeContext = {
  tab: CountyActivityGridRowType
  copyFromMasterEnabled: boolean
  masterRow: MasterCodeRow | undefined
  subParentDetail: CountyActivityEditPayload | null | undefined
  selectedPrimaryId: string | null | undefined
}

export type ActivityCatalogEnrichmentValue = {
  spmp: boolean
  match: MatchStatus
  percentage: number
}

export type ActivityCatalogEnrichmentMap = Map<string, ActivityCatalogEnrichmentValue>

export type ActivityDepartmentPageResult = {
  items: ApiActivityDepartmentResDto[]
  totalItems: number
}

export type PostActivityDepartmentBody = {
  activityId: number
  departmentId: number
  code: string
  name: string
  type: ApiActivityType
  leavecode: boolean
  parentId: number | null
  apportioning: boolean
  manualApportioning: boolean
}

export type PostActivityDepartmentLinksInput = {
  activityId: number
  departmentIds: number[]
  activityCode: string
  activityName: string
  type: ApiActivityType
  leavecode: boolean
  parentActivityId: number | null
  apportioning: boolean
  manualApportioning: boolean
}

export type SyncActivityDepartmentLinksInput = {
  activityId: number
  desiredDepartmentIds: number[]
  activityCode: string
  activityName: string
  type: ApiActivityType
  leavecode: boolean
  parentActivityId: number | null
  apportioning: boolean
  manualApportioning: boolean
}

export type CreateCountyActivityApiInput = {
  values: CountyActivityAddFormValues
  tab: CountyActivityGridRowType
  parentId?: string | null
  masterCatalog?: { code: string; type: string }
  departmentLinks: { id: number }[]
}

export type UpdateCountyActivityApiInput = {
  id: string
  values: Partial<CountyActivityAddFormValues>
  originalValues?: CountyActivityAddFormValues
  rowType: CountyActivityGridRowType
  parentId?: string | null
  masterCatalog?: { code: string; type: string }
  departmentLinks?: { id: number; apportioning?: boolean; manualApportioning?: boolean }[]
  existingActivityDepartments?: ApiActivityDepartmentResDto[]
}

export type ApiCountyActivityCreateResponse = {
  id: number
  code: string
  type: ApiActivityType
}

export type CountyActivityPagination = {
  page: number
  pageSize: number
  totalItems: number
  /** From API `meta.totalPages` when using paginated `GET /activities`. */
  totalPages: number
}

export type CountyActivityMasterCodeOption = {
  label: string
  value: number
  code: string
}

export type CountyActivityPrimaryActivityOption = {
  label: string
  value: string
}

/** Sub-tab flow after saving a primary: seed master + department from last primary. */
export type CountyActivitySubFlowPrimaryDefaults = {
  masterCodeType: string
  masterCode: number
  department: string
}

export type CountyActivityDepartmentStackProps = {
  label: string
}

export type CountyActivityDescriptionTableCellProps = {
  description: string
}

export type CountyActivityCodeAddPageProps = {
  form: UseFormReturn<CountyActivityAddFormValues>
  readOnly?: boolean
  /** Add flow: validated + merged values (copy-from-master, sub parent detail). */
  onAddSave?: (tab: CountyActivityGridRowType, values: CountyActivityAddFormValues) => void
  /** Edit flow: submit handler from `editForm.handleSubmit`. */
  onEditSave?: () => void
  onClose: () => void
  mode?: CountyActivityAddPageMode
  tab?: CountyActivityGridRowType
  onTabChange?: (tab: CountyActivityGridRowType) => void
  primaryActivityCodeOptions?: ReadonlyArray<CountyActivityPrimaryActivityOption>
  selectedPrimaryId?: string | null
  onSelectedPrimaryIdChange?: (id: string) => void
  disabledTabs?: Partial<Record<CountyActivityGridRowType, boolean>>
  /** `GET /master-codes` active rows — each `name` is a Code Type option (primary tab). */
  masterCodeTypeOptions?: readonly string[]
  isMasterCodeTypeOptionsLoading?: boolean
  masterCodeOptions?: ReadonlyArray<CountyActivityMasterCodeOption>
  isMasterCodeOptionsLoading?: boolean
  departmentNames?: readonly string[]
  /** Edit primary: server-built assigned/unassigned lists (`GET /activities/:id`). When set, shuttle does not diff client-side. */
  initialDepartmentShuttle?: {
    assigned: ApiActivityNestedDepartmentResDto[]
    unassigned: ApiActivityNestedDepartmentResDto[]
  }
  /** When true, primary-activity picker is disabled (e.g. sub-activity edit; parent is not updatable via API). */
  readOnlyPrimaryPicker?: boolean
  /** Edit modal: `GET /activities/:id` in flight */
  isEditSourceLoading?: boolean
  /** Sub add flow: loaded primary activity (seeds master / department on save). */
  subParentActivityDetail?: CountyActivityEditPayload | null
  apportioningDepartments?: { name: string; apportioning: boolean; manualApportioning?: boolean }[]
  isSubmitting?: boolean
  onCodeDropdownOpen?: () => void
  onCodeTypeDropdownOpen?: () => void
  /** Fired the first time the Primary Activity Code dropdown is opened — triggers lazy API fetch. */
  onPrimaryPickerDropdownOpen?: () => void
}

export type CountyActivityCodeTableProps = {
  rows: CountyActivityCodeRow[]
  primaryRows: CountyActivityCodeRow[]
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
