import type { ApiResponseDto } from "@/features/user/types"
import { api } from "@/lib/api"

import { CostPoolRequestMethod, CostPoolStatus } from "../enums/cost-pool.enum"
import type {
  CostPoolActivityPickRow,
  CostPoolActivitySummaryResDto,
  CostPoolDetailResDto,
  CostPoolListQueryParams,
  CostPoolListResponseDto,
  CostPoolResDto,
  CostPoolRow,
  CostPoolUpsertFormValues,
  CreateCostPoolRequestDto,
  CreateCostPoolResponseDto,
  UpdateCostPoolRequestDto,
} from "../types"

function unwrapCostPoolListPayload(
  raw: ApiResponseDto<CostPoolListResponseDto | CostPoolResDto[]>,
): CostPoolListResponseDto {
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message || "Failed to load cost pools")
  }
  if (Array.isArray(raw.data)) {
    return {
      data: raw.data,
      meta: {
        totalItems: raw.data.length,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: raw.data.length,
        hasNextPage: false,
        hasPreviousPage: false,
        firstPage: 1,
        lastPage: 1,
        itemCount: raw.data.length,
      },
    }
  }
  return raw.data
}

function normalizeCostPoolDetailPayload(d: unknown): CostPoolDetailResDto {
  if (!d || typeof d !== "object") {
    throw new Error("Invalid cost pool detail payload")
  }
  const o = d as Record<string, unknown>
  const assignedRaw = o.assignedActivities ?? o.assigned_activities
  const unassignedRaw = o.unassignedActivities ?? o.unassigned_activities
  const assignedActivities = Array.isArray(assignedRaw)
    ? (assignedRaw as CostPoolDetailResDto["assignedActivities"])
    : []
  const unassignedActivities = Array.isArray(unassignedRaw)
    ? (unassignedRaw as CostPoolDetailResDto["unassignedActivities"])
    : []
  return {
    ...(o as CostPoolResDto),
    assignedActivities,
    unassignedActivities,
  }
}

function unwrapDetail(
  raw: ApiResponseDto<CostPoolDetailResDto | CostPoolResDto>,
): CostPoolDetailResDto {
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message || "Failed to load cost pool")
  }
  return normalizeCostPoolDetailPayload(raw.data)
}

function buildListSearch(params: CostPoolListQueryParams): string {
  const search = new URLSearchParams()
  if (params.page != null) search.set("page", String(params.page))
  if (params.limit != null) search.set("limit", String(params.limit))
  if (params.search != null && params.search.trim() !== "") {
    search.set("search", params.search.trim())
  }
  if (params.departmentId != null) search.set("departmentId", String(params.departmentId))
  if (params.costpoolStatus != null) {
    search.set("costpoolStatus", params.costpoolStatus)
  }
  if (params.method != null) search.set("method", params.method)
  if (params.type != null) search.set("type", params.type)
  return search.toString()
}

export async function fetchCostPoolList(
  params: CostPoolListQueryParams,
): Promise<CostPoolListResponseDto> {
  const qs = buildListSearch(params)
  const raw = await api.get<ApiResponseDto<CostPoolListResponseDto | CostPoolResDto[]>>(
    `/costpool${qs ? `?${qs}` : ""}`,
  )
  return unwrapCostPoolListPayload(raw)
}

export async function fetchCostPoolDetail(id: number): Promise<CostPoolDetailResDto> {
  const search = new URLSearchParams()
  search.set("method", CostPoolRequestMethod.FETCH_CP_ASSIGNED_ACTIVITIES)
  const raw = await api.get<ApiResponseDto<CostPoolDetailResDto | CostPoolResDto>>(
    `/costpool/${id}?${search.toString()}`,
  )
  return unwrapDetail(raw)
}

export async function createCostPool(body: CreateCostPoolRequestDto): Promise<CreateCostPoolResponseDto> {
  const raw = await api.post<ApiResponseDto<CreateCostPoolResponseDto>>("/costpool", body)
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message || "Failed to create cost pool")
  }
  return raw.data
}

export async function updateCostPool(
  id: number,
  body: UpdateCostPoolRequestDto,
): Promise<CostPoolResDto> {
  const raw = await api.put<ApiResponseDto<CostPoolResDto>>(`/costpool/${id}`, body)
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message || "Failed to update cost pool")
  }
  return raw.data
}

function pickPositiveInt(...candidates: unknown[]): number {
  for (const c of candidates) {
    const n = Number(c)
    if (Number.isInteger(n) && n > 0) return n
  }
  return 0
}

function summaryActivityDepartmentId(s: CostPoolActivitySummaryResDto | Record<string, unknown>): number {
  const o = s as Record<string, unknown>
  return pickPositiveInt(
    o.activityDepartmentId,
    o.activitydepartmentId,
    o.activity_department_id,
    o.id,
  )
}

function summaryToPickRow(s: CostPoolActivitySummaryResDto | Record<string, unknown>): CostPoolActivityPickRow {
  const o = s as Record<string, unknown>
  const activityDepartmentId = summaryActivityDepartmentId(s)
  const code = typeof o.code === "string" ? o.code.trim() : ""
  const name = typeof o.name === "string" ? o.name.trim() : ""
  const displayName = code ? `(${code})${name}` : name
  return { activityDepartmentId, displayName }
}

/**
 * For new cost pools: one GET — activity–department rows in the department not yet on any cost pool
 * (backend mirrors prior client-side activity-departments + N×get-by-id logic).
 */
export async function fetchActivityPicklistForNewPool(
  departmentId: number,
): Promise<CostPoolActivityPickRow[]> {
  const raw = await api.get<ApiResponseDto<CostPoolActivitySummaryResDto[]>>(
    `/costpool/unassigned-activities/${departmentId}`,
  )
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message || "Failed to load activity picklist")
  }
  const list = Array.isArray(raw.data) ? raw.data : []
  return list.map((s) => summaryToPickRow(s))
}

/** Deduplicate; each id is an `activitydepartment` row id (not a bare `activityId`). */
export function uniqueActivityDepartmentIds(ids: number[]): number[] {
  return [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))]
}

/**
 * Call right before POST /costpool. The DB enforces that each activity–department row
 * (`activitydepartmentId`) appears at most once across assignments, so duplicates in the payload
 * or links already tied to another pool cause "Duplicate entry … for key …".
 */
export async function assertAssignableActivityDepartmentIdsForCreate(
  departmentId: number,
  requested: number[],
  /** When set (e.g. from React Query cache), skips a duplicate GET /costpool/unassigned-activities/:id on Save. */
  picklistOverride?: CostPoolActivityPickRow[],
): Promise<number[]> {
  const unique = uniqueActivityDepartmentIds(requested)
  const allowedRows =
    picklistOverride !== undefined
      ? picklistOverride
      : await fetchActivityPicklistForNewPool(departmentId)
  const allowed = new Set(allowedRows.map((r) => r.activityDepartmentId))
  const rejected = unique.filter((id) => !allowed.has(id))
  if (rejected.length > 0) {
    throw new Error(
      `These activity–department links are already assigned to another cost pool, or the list is out of date (ids: ${rejected.join(
        ", ",
      )}). Refresh the page and select activities again.`,
    )
  }
  return unique
}

/**
 * Before PUT /costpool/:id — allowed links must appear in GET-by-id `assignedActivities` ∪ `unassignedActivities`
 * (same payload the edit UI uses; no extra picklist request).
 */
export async function assertAssignableActivityDepartmentIdsForUpdate(
  costPoolId: number,
  _departmentId: number,
  requested: number[],
): Promise<number[]> {
  const unique = uniqueActivityDepartmentIds(requested)
  const detail = await fetchCostPoolDetail(costPoolId)
  const allowed = new Set(
    mergeDetailActivitiesToPickRows(detail).map((r) => r.activityDepartmentId),
  )
  const rejected = unique.filter((id) => !allowed.has(id))
  if (rejected.length > 0) {
    throw new Error(
      `Cannot use activity–department link(s) ${rejected.join(
        ", ",
      )}: each link may exist on only one cost pool. They are already assigned elsewhere or the screen is out of date — refresh the page and pick activities again.`,
    )
  }
  return unique
}

/** Build dual-list rows from GET /costpool/:id with `method` = FETCH_CP_ASSIGNED_ACTIVITIES (`assignedActivities` + `unassignedActivities`). */
export function mergeDetailActivitiesToPickRows(detail: CostPoolDetailResDto): CostPoolActivityPickRow[] {
  const assigned = detail.assignedActivities ?? []
  const unassigned = detail.unassignedActivities ?? []
  const map = new Map<number, CostPoolActivityPickRow>()
  for (const s of [...assigned, ...unassigned]) {
    const row = summaryToPickRow(s)
    if (row.activityDepartmentId > 0) {
      map.set(row.activityDepartmentId, row)
    }
  }
  return [...map.values()]
}

export function detailToUpsertFormValues(detail: CostPoolDetailResDto): CostPoolUpsertFormValues {
  return {
    costPool: detail.name ?? "",
    departmentId: detail.departmentId,
    active: detail.status === CostPoolStatus.ACTIVE,
    assignedActivityDepartmentIds: (detail.assignedActivities ?? [])
      .map((a) => summaryActivityDepartmentId(a))
      .filter((id) => id > 0),
  }
}

export function listItemToTableRow(dto: CostPoolResDto): CostPoolRow {
  return {
    id: dto.id,
    costPool: dto.name,
    department: dto.department?.name ?? "",
    departmentId: dto.departmentId,
    active: dto.status === CostPoolStatus.ACTIVE,
  }
}
