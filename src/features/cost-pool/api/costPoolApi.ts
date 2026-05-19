import type { ApiResponseDto } from "@/features/user/types"
import { api } from "@/lib/api"

import { CostPoolStatus } from "../enums/cost-pool.enum"
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

  const assignedUsersRaw = o.assignedUsers ?? o.assigned_users
  const unassignedUsersRaw = o.unassignedUsers ?? o.unassigned_users
  const assignedUsers = Array.isArray(assignedUsersRaw)
    ? (assignedUsersRaw as CostPoolDetailResDto["assignedUsers"])
    : []
  const unassignedUsers = Array.isArray(unassignedUsersRaw)
    ? (unassignedUsersRaw as CostPoolDetailResDto["unassignedUsers"])
    : []

  return {
    ...(o as CostPoolResDto),
    assignedActivities,
    unassignedActivities,
    assignedUsers,
    unassignedUsers,
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
  const parts: string[] = []
  if (params.page != null) parts.push(`page=${params.page}`)
  if (params.limit != null) parts.push(`limit=${params.limit}`)
  if (params.search != null && params.search.trim() !== "") {
    parts.push(`search=${encodeURIComponent(params.search.trim())}`)
  }
  if (params.departmentId != null) {
    // We intentionally do NOT encode commas here to satisfy the requirement
    parts.push(`departmentId=${params.departmentId}`)
  }
  if (params.costpoolStatus != null) {
    parts.push(`costpoolStatus=${params.costpoolStatus}`)
  }
  if (params.method != null) parts.push(`method=${params.method}`)
  if (params.type != null) parts.push(`type=${params.type}`)
  return parts.join("&")
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
  const raw = await api.get<ApiResponseDto<CostPoolDetailResDto | CostPoolResDto>>(
    `/costpool/${id}`,
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

export async function updateCostPool(id: number, body: Partial<CreateCostPoolRequestDto>): Promise<CostPoolResDto> {
  const raw = await api.put<ApiResponseDto<CostPoolResDto>>(`/costpool/${id}`, body)
  if (!raw.success || raw.data == null) {
    throw new Error(raw.message || "Failed to update cost pool")
  }
  return raw.data
}

export async function createUsersOnCostPool(payload: {
  costPoolId: number
  departmentId: number
  users: string[]
}): Promise<ApiResponseDto<any>> {
  const raw = await api.post<ApiResponseDto<any>>("/costpooluserassignment", payload)
  if (!raw.success) {
    throw new Error(raw.message || "Failed to assign users to cost pool")
  }
  return raw
}

export async function updateUsersOnCostPool(payload: {
  costPoolId: number
  departmentId: number
  users: string[]
}): Promise<ApiResponseDto<any>> {
  const raw = await api.put<ApiResponseDto<any>>("/costpooluserassignment", payload)
  if (!raw.success) {
    throw new Error(raw.message || "Failed to update user assignments")
  }
  return raw
}

export async function unassignUserFromCostPool(assignmentId: number): Promise<ApiResponseDto<any>> {
  const raw = await api.delete<ApiResponseDto<any>>(`/costpooluserassignment/${assignmentId}`)
  if (!raw.success) {
    throw new Error(raw.message || "Failed to unassign user")
  }
  return raw
}

export async function updateActivitiesOnCostPool(payload: {
  costPoolId: number
  departmentId: number
  activityDepartmentIds: number[]
}): Promise<ApiResponseDto<any>> {
  const raw = await api.put<ApiResponseDto<any>>("/costpoolactivityassignment", payload)
  if (!raw.success) {
    throw new Error(raw.message || "Failed to update activity assignments")
  }
  return raw
}

export async function unassignActivityFromCostPool(assignmentId: number): Promise<ApiResponseDto<any>> {
  const raw = await api.delete<ApiResponseDto<any>>(`/costpoolactivityassignment/${assignmentId}`)
  if (!raw.success) {
    throw new Error(raw.message || "Failed to unassign activity")
  }
  return raw
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

export function summaryToPickRow(s: CostPoolActivitySummaryResDto | Record<string, unknown>): CostPoolActivityPickRow {
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

export function detailToUpsertFormValues(detail: CostPoolDetailResDto): CostPoolUpsertFormValues {
  return {
    costPool: detail.name ?? "",
    departmentId: detail.departmentId,
    active: detail.status === CostPoolStatus.ACTIVE,
    assignedActivityDepartmentIds: (detail.assignedActivities ?? [])
      .map((a) => summaryActivityDepartmentId(a))
      .filter((id) => id > 0),
    assignedUserIds: (detail.assignedUsers ?? []).map((u) => String(u.id)).filter(Boolean),
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
