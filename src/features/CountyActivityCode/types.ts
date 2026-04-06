import type { UseFormReturn } from "react-hook-form"

import type { Department } from "@/features/department/types"

import type {
  ApiActivityType,
  CountyActivityAddPageMode,
  CountyActivityGridRowType,
} from "./enums/CountyActivity.enum"

export * from "./enums/CountyActivity.enum"

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
  /** IDs from activity–department links; names are resolved in `useCountyActivityCodes` from cached departments. */
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
  rowType: CountyActivityGridRowType
  parentId?: string | null
}

export type CountyActivityFilterFormValues = {
  search: string
  inactive: boolean
}

export type CountyActivityAddFormValues = {
  /** Add primary only: when true, Activity Code / Name / Description come from selected master code (read-only). */
  copyCode: boolean
  countyActivityCode: string
  countyActivityName: string
  description: string
  department: string
  masterCodeType: string
  masterCode: number
  match: MatchStatus
  percentage: number
  active: boolean
  leaveCode: boolean
  docRequired: boolean
  multipleJobPools: boolean
}

/** Nested on `GET /activities/hierarchy` and `GET /activities/:id` (backend `ActivityNestedDepartmentResDto`). */
export type ApiActivityNestedDepartmentResDto = {
  id: number
  code: string
  name: string
  status: string
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
  parentId?: number | null
  /** Present when API hydrates links (join to `department` master). */
  departments?: ApiActivityNestedDepartmentResDto[]
}

export type ApiActivityTreeResDto = ApiActivityResDto & {
  children?: ApiActivityTreeResDto[]
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
}

export type CountyActivityEditPayload = {
  activity: ApiActivityResDto
  departmentNames: string[]
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
  values: CountyActivityAddFormValues
  rowType: CountyActivityGridRowType
  masterCatalog?: { code: string; type: string }
  /** Resolved department IDs for primary rows — synced via activity-departments API after PUT. */
  departmentLinks?: { id: number }[]
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
  onSubmit: (tab: CountyActivityGridRowType) => void
  onClose: () => void
  mode?: CountyActivityAddPageMode
  tab?: CountyActivityGridRowType
  onTabChange?: (tab: CountyActivityGridRowType) => void
  primaryActivityCodeOptions?: ReadonlyArray<CountyActivityPrimaryActivityOption>
  selectedPrimaryId?: string | null
  onSelectedPrimaryIdChange?: (id: string) => void
  disabledTabs?: Partial<Record<CountyActivityGridRowType, boolean>>
  masterCodeOptions?: ReadonlyArray<CountyActivityMasterCodeOption>
  isMasterCodeOptionsLoading?: boolean
  departmentNames?: readonly string[]
  /** When true, primary-activity picker is disabled (e.g. sub-activity edit; parent is not updatable via API). */
  readOnlyPrimaryPicker?: boolean
  /** Edit modal: `GET /activities/:id` in flight */
  isEditSourceLoading?: boolean
}

export type CountyActivityCodeTableProps = {
  rows: CountyActivityCodeRow[]
  primaryRows: CountyActivityCodeRow[]
  subRowsByParentId: Record<string, CountyActivityCodeRow[]>
  pagination: CountyActivityPagination
  totalItems: number
  /** Single shared list from `useGetDepartments` on the page (avoids duplicate department API calls). */
  departments: Department[]
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
