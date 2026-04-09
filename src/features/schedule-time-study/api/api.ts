import type { JobClassificationTag, JobPoolRow } from "@/features/job-pool/types"
import type { ApiResponseDto, UserListItemApiDto, UserListResponseDto } from "@/features/user/types"
import { api } from "@/lib/api"

import type {
  CreateRmtsGroupPayload,
  CreateRmtsPayPeriodPayload,
  CreateRmtsPpGroupListBatchPayload,
  CreateRmtsPpGroupListBatchResult,
  HolidayCalendarApiDto,
  JobPoolJobClassificationResDto,
  JobPoolResDto,
  RmtsGroupApiDto,
  RmtsPayPeriodApiDto,
  RmtsPpGroupListEnrichedApiDto,
  PaginationMeta,
  ScheduleTimeStudyDepartmentUserApiDto,
  ScheduleTimeStudyFiscalYearOption,
  UpdateRmtsGroupPayload,
  UpdateRmtsPayPeriodPayload,
} from "../types"
import { compareMmDdYyyy } from "../utils/dates"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}

// -------------------------
// Fiscal years
// -------------------------

function normalizeFiscalYearsPayload(payload: unknown): ScheduleTimeStudyFiscalYearOption[] {
  const root = isRecord(payload) ? payload : null
  const data = root && "data" in root ? (root as { data?: unknown }).data : payload
  const list = Array.isArray(data) ? data : []

  const out: ScheduleTimeStudyFiscalYearOption[] = []
  for (const item of list) {
    if (typeof item === "string") {
      const s = item.trim()
      if (s) out.push({ id: s, label: s })
      continue
    }
    if (!isRecord(item)) continue
    const o = item
    const id =
      typeof o.id === "string"
        ? o.id.trim()
        : typeof o.value === "string"
          ? o.value.trim()
          : ""
    const label =
      typeof o.label === "string"
        ? o.label.trim()
        : typeof o.name === "string"
          ? o.name.trim()
          : typeof o.fiscalyear === "string"
            ? o.fiscalyear.trim()
            : typeof o.fiscalYear === "string"
              ? o.fiscalYear.trim()
              : id
    const start = typeof o.start === "string" ? o.start.trim() : undefined
    const end = typeof o.end === "string" ? o.end.trim() : undefined
    if (!id || !label) continue
    out.push({
      id,
      label,
      ...(start ? { start } : {}),
      ...(end ? { end } : {}),
    })
  }

  return out.sort((a, b) => b.label.localeCompare(a.label))
}

export async function fetchScheduleTimeStudyFiscalYears(): Promise<ScheduleTimeStudyFiscalYearOption[]> {
  const res = await api.get<ApiResponseDto<unknown>>("/setting/fiscalyear")
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to load fiscal years")
  }
  return normalizeFiscalYearsPayload(res.data)
}

// -------------------------
// Holidays
// -------------------------

function mapHolidayRow(item: unknown): HolidayCalendarApiDto | null {
  if (!isRecord(item)) return null
  const id = Number(item.id)
  if (!Number.isFinite(id)) return null
  const date = typeof item.date === "string" ? item.date.trim() : ""
  if (!date) return null
  return {
    id,
    date,
    description: typeof item.description === "string" ? item.description : "",
    optional: Boolean(item.optional),
  }
}

export async function fetchHolidayListByDateRange(
  startmonth: string,
  endmonth: string,
): Promise<HolidayCalendarApiDto[]> {
  const start = startmonth.trim()
  const end = endmonth.trim()
  const order = compareMmDdYyyy(start, end)
  if (Number.isNaN(order)) {
    throw new Error("startmonth and endmonth must be valid MM-DD-YYYY dates")
  }
  if (order > 0) {
    throw new Error("startmonth must be on or before endmonth")
  }
  const params = new URLSearchParams({
    type: "filter",
    startmonth: start,
    endmonth: end,
  })
  const raw = await api.get<ApiResponseDto<unknown>>(`/setting/holiday/list?${params.toString()}`)
  if (!raw?.success) {
    throw new Error(typeof raw?.message === "string" ? raw.message : "Failed to load holidays")
  }
  const data = raw.data
  if (!Array.isArray(data)) return []
  const out: HolidayCalendarApiDto[] = []
  for (const row of data) {
    const mapped = mapHolidayRow(row)
    if (mapped) out.push(mapped)
  }
  return out
}

// -------------------------
// RMTS (groups, pay periods, pp-group list)
// -------------------------

function unwrapRmtsArray<T>(raw: unknown): T[] {
  if (!isRecord(raw)) return []
  const data = raw.data
  return Array.isArray(data) ? (data as T[]) : []
}

function unwrapApiData<T>(raw: unknown): T {
  if (!isRecord(raw)) {
    throw new Error("Invalid API response")
  }
  if ("success" in raw && raw.success === false) {
    const msg = typeof raw.message === "string" ? raw.message : "Request failed"
    throw new Error(msg)
  }
  if (!("data" in raw)) {
    throw new Error("Invalid API response")
  }
  return raw.data as T
}

function buildFiscalYearDeptQuery(fiscalyear: string, departmentId: number): string {
  const params = new URLSearchParams()
  params.set("fiscalyear", fiscalyear)
  params.set("departmentId", String(departmentId))
  return params.toString()
}

export async function fetchRmtsPayPeriods(params: {
  fiscalyear: string
  departmentId: number
}): Promise<RmtsPayPeriodApiDto[]> {
  const qs = buildFiscalYearDeptQuery(params.fiscalyear, params.departmentId)
  const raw = await api.get<unknown>(`/rmtspayperiods?${qs}`)
  return unwrapRmtsArray<RmtsPayPeriodApiDto>(raw)
}

export async function fetchRmtsPayPeriodById(id: number): Promise<RmtsPayPeriodApiDto> {
  const raw = await api.get<ApiResponseDto<RmtsPayPeriodApiDto>>(`/rmtspayperiods/${id}`)
  const data = unwrapApiData<RmtsPayPeriodApiDto>(raw)
  if (data == null) {
    throw new Error("Invalid pay period response")
  }
  return data
}

/** List groups for a department and fiscal year. Each item should include `isUsed` (or `is_used`) when locked by scheduling. */
export async function fetchRmtsGroups(params: {
  fiscalyear: string
  departmentId: number
}): Promise<RmtsGroupApiDto[]> {
  const qs = buildFiscalYearDeptQuery(params.fiscalyear, params.departmentId)
  const raw = await api.get<unknown>(`/rmtsgroup?${qs}`)
  return unwrapRmtsArray<RmtsGroupApiDto>(raw)
}

export async function fetchRmtsGroupById(id: number): Promise<RmtsGroupApiDto> {
  const raw = await api.get<ApiResponseDto<RmtsGroupApiDto>>(`/rmtsgroup/${id}`)
  const data = unwrapApiData<RmtsGroupApiDto>(raw)
  if (data == null) {
    throw new Error("Invalid group response")
  }
  return data
}

function isNotFoundMessage(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes("not found") || m.includes("404") || m.includes("rmtsppgrouplist")
}

export async function fetchRmtsPpGroupListEnriched(params: {
  fiscalyear: string
  departmentId: number
}): Promise<RmtsPpGroupListEnrichedApiDto[]> {
  const qs = buildFiscalYearDeptQuery(params.fiscalyear, params.departmentId)
  try {
    const raw = await api.get<ApiResponseDto<RmtsPpGroupListEnrichedApiDto[]>>(`/rmtsppgrouplist?${qs}`)
    const list = raw.data
    return Array.isArray(list) ? list : []
  } catch (e) {
    if (e instanceof Error && isNotFoundMessage(e.message)) {
      return []
    }
    throw e
  }
}

export async function createRmtsPayPeriod(body: CreateRmtsPayPeriodPayload): Promise<RmtsPayPeriodApiDto> {
  const raw = await api.post<ApiResponseDto<RmtsPayPeriodApiDto>>("/rmtspayperiods", body)
  const data = unwrapApiData<RmtsPayPeriodApiDto>(raw)
  if (data == null) {
    throw new Error("Invalid create pay period response")
  }
  return data
}

export async function updateRmtsPayPeriod(
  id: number,
  body: UpdateRmtsPayPeriodPayload,
): Promise<RmtsPayPeriodApiDto> {
  const raw = await api.put<ApiResponseDto<RmtsPayPeriodApiDto>>(`/rmtspayperiods/${id}`, body)
  const data = unwrapApiData<RmtsPayPeriodApiDto>(raw)
  if (data == null) {
    throw new Error("Invalid update pay period response")
  }
  return data
}

export async function deleteRmtsPayPeriod(id: number): Promise<void> {
  const raw = await api.delete<ApiResponseDto<null>>(`/rmtspayperiods/${id}`)
  unwrapApiData<null>(raw)
}

export async function createRmtsGroup(body: CreateRmtsGroupPayload): Promise<RmtsGroupApiDto> {
  const raw = await api.post<ApiResponseDto<RmtsGroupApiDto>>("/rmtsgroup", body)
  const data = unwrapApiData<RmtsGroupApiDto>(raw)
  if (data == null) {
    throw new Error("Invalid create group response")
  }
  return data
}

export async function updateRmtsGroup(
  id: number,
  body: UpdateRmtsGroupPayload,
): Promise<RmtsGroupApiDto> {
  const raw = await api.put<ApiResponseDto<RmtsGroupApiDto>>(`/rmtsgroup/${id}`, body)
  const data = unwrapApiData<RmtsGroupApiDto>(raw)
  if (data == null) {
    throw new Error("Invalid update group response")
  }
  return data
}

export async function deleteRmtsGroup(id: number): Promise<void> {
  await api.delete<void>(`/rmtsgroup/${id}`)
}

export async function deleteRmtsPpGroupList(id: number): Promise<void> {
  await api.delete<void>(`/rmtsppgrouplist/${id}`)
}

export async function createRmtsPpGroupListBatch(
  body: CreateRmtsPpGroupListBatchPayload,
): Promise<CreateRmtsPpGroupListBatchResult> {
  const raw = await api.post<ApiResponseDto<CreateRmtsPpGroupListBatchResult>>("/rmtsppgrouplist", body)
  const data = unwrapApiData<CreateRmtsPpGroupListBatchResult>(raw)
  if (!data?.created) {
    throw new Error("Invalid create schedule batch response")
  }
  return data
}

// -------------------------
// Schedule job pools
// -------------------------

/**
 * Supports Nest `ApiResponseDto` + paginated body, or a raw `{ data: [], meta }` list payload.
 */
function normalizeJobPoolListFromResponse(res: unknown): {
  list: JobPoolResDto[]
  meta?: PaginationMeta
} {
  if (res == null || typeof res !== "object") {
    return { list: [] }
  }
  const r = res as Record<string, unknown>
  const outerData = r.data

  if (outerData !== null && typeof outerData === "object" && !Array.isArray(outerData)) {
    const page = outerData as Record<string, unknown>
    if (Array.isArray(page.data)) {
      return {
        list: page.data as JobPoolResDto[],
        meta: page.meta as PaginationMeta | undefined,
      }
    }
  }

  if (Array.isArray(r.data)) {
    return {
      list: r.data as JobPoolResDto[],
      meta: r.meta as PaginationMeta | undefined,
    }
  }

  if (Array.isArray(outerData)) {
    return { list: outerData as JobPoolResDto[] }
  }

  return { list: [] }
}

function toJobClassificationTag(dto: JobPoolJobClassificationResDto): JobClassificationTag {
  const id = dto.id == null ? "" : String(dto.id)
  const code = typeof dto.code === "string" ? dto.code : ""
  const name = typeof dto.name === "string" ? dto.name : ""
  return {
    id,
    name: code && name ? `${code} | ${name}` : code || name || id,
  }
}

function isActiveStatus(status: unknown): boolean {
  if (typeof status === "string") {
    return status.toLowerCase() === "active"
  }
  return true
}

function mapJobPoolDtoToRow(dto: JobPoolResDto): JobPoolRow {
  const departmentName =
    typeof dto.department?.name === "string"
      ? dto.department.name
      : dto.departmentId != null
        ? String(dto.departmentId)
        : ""

  const jobClassificationDetails = Array.isArray(dto.jobClassificationDetails)
    ? dto.jobClassificationDetails
    : []

  const jobClassifications = jobClassificationDetails.map((item) => toJobClassificationTag(item))
  const jobClassificationName = jobClassificationDetails.map((item) => ({
    name: typeof item.name === "string" ? item.name : "",
    status: typeof item.status === "string" ? item.status : "active",
  }))

  const activities = Array.isArray(dto.activities) ? dto.activities : []
  const users = Array.isArray(dto.users) ? dto.users : []
  const userDetails = Array.isArray(dto.userDetails) ? dto.userDetails : []

  const fromUserDetails = userDetails.map((user) => ({
    id: typeof user.id === "string" ? user.id : "",
    name: user.name ?? undefined,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
  }))
  const detailIds = new Set(fromUserDetails.map((u) => u.id).filter((id) => id !== ""))

  const fromAssignmentsOnly = users
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter((id) => id !== "" && !detailIds.has(id))
    .map((id) => ({
      id,
      name: undefined as string | undefined,
      firstName: undefined as string | undefined,
      lastName: undefined as string | undefined,
    }))

  const userprofiles = [...fromUserDetails, ...fromAssignmentsOnly]

  const deptNumericId =
    dto.departmentId != null
      ? dto.departmentId
      : typeof dto.department?.id === "number"
        ? dto.department.id
        : undefined

  const idRaw = dto.id
  const nameRaw = dto.name

  return {
    id: idRaw == null ? "" : String(idRaw),
    name: typeof nameRaw === "string" ? nameRaw : "",
    department: departmentName,
    active: isActiveStatus(dto.status),
    jobClassifications,
    assignedActivityIds: activities.map((id) => String(id)),
    assignedEmployeeIds: users.map((id) => String(id)),
    departmentId: deptNumericId != null ? String(deptNumericId) : undefined,
    departmentName,
    jobClassificationName,
    userprofiles,
  }
}

async function fetchJobPoolsPage(params: {
  page: number
  pageSize: number
}): Promise<{ items: JobPoolRow[]; totalItems: number }> {
  const searchParams = new URLSearchParams()
  searchParams.set("page", String(params.page))
  searchParams.set("limit", String(params.pageSize))
  searchParams.set("status", "active")

  const res = await api.get<unknown>(`/jobpool?${searchParams.toString()}`)
  const { list, meta } = normalizeJobPoolListFromResponse(res)
  const items = list.map((dto) => mapJobPoolDtoToRow(dto))
  const totalItems =
    typeof meta?.totalItems === "number"
      ? meta.totalItems
      : typeof meta?.total === "number"
        ? meta.total
        : typeof meta?.itemCount === "number"
          ? meta.itemCount
          : items.length

  return { items, totalItems }
}

/** Schedule Time Study: paginate `GET /jobpool`, parse both envelope shapes, filter by department. */
export async function fetchScheduleTimeStudyJobPoolsByDepartment(params: {
  departmentId: number
  pageSize?: number
  maxPages?: number
}): Promise<JobPoolRow[]> {
  const pageSize = params.pageSize ?? 100
  const maxPages = params.maxPages ?? 30
  const targetDept = Number(params.departmentId)
  const out: JobPoolRow[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxPages) {
    const res = await fetchJobPoolsPage({ page, pageSize })
    for (const item of res.items) {
      const rowDept = Number(item.departmentId ?? "")
      if (Number.isFinite(rowDept) && rowDept === targetDept) {
        out.push(item)
      }
    }
    totalPages = Math.max(1, Math.ceil(res.totalItems / pageSize))
    page += 1
  }

  return out
}

// -------------------------
// Department users
// -------------------------

function asUserListResponse(payload: ApiResponseDto<UserListResponseDto>): UserListResponseDto {
  if (!payload?.success || !payload.data) {
    throw new Error(payload?.message || "Failed to load users")
  }
  return payload.data
}

function isUserInDepartment(user: UserListItemApiDto, departmentId: number): boolean {
  return (user.departments ?? []).some((d) => d.id === departmentId)
}

function mapUserListItemToDepartmentUser(user: UserListItemApiDto): ScheduleTimeStudyDepartmentUserApiDto {
  return {
    id: user.id,
    name: user.name ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    user: { loginId: user.user?.loginId ?? null },
  }
}

export async function fetchScheduleTimeStudyDepartmentUsers(params: {
  departmentId: number
}): Promise<ScheduleTimeStudyDepartmentUserApiDto[]> {
  const departmentId = params.departmentId
  const limit = 100
  const maxPages = 50
  const filtered: ScheduleTimeStudyDepartmentUserApiDto[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxPages) {
    const search = new URLSearchParams()
    search.set("page", String(page))
    search.set("limit", String(limit))
    search.set("sort", "ASC")
    search.set("status", "active")

    const res = await api.get<ApiResponseDto<UserListResponseDto>>(`/users?${search.toString()}`)
    const dto = asUserListResponse(res)
    const rows = Array.isArray(dto.data) ? dto.data : []
    for (const user of rows) {
      if (isUserInDepartment(user, departmentId)) {
        filtered.push(mapUserListItemToDepartmentUser(user))
      }
    }
    const meta = dto.meta
    totalPages = typeof meta?.totalPages === "number" && meta.totalPages > 0 ? meta.totalPages : page
    page += 1
  }

  return filtered
}
