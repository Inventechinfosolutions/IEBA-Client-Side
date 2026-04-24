import { api } from "@/lib/api"
import type {
  GetJobPoolsParams,
  JobPoolFormValues,
  JobPoolListResponse,
  JobPoolRow,
  JobClassificationTag,
} from "../types"

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

type PaginationMeta = {
  total?: number
  totalItems?: number
  page?: number
  limit?: number
  itemsPerPage?: number
  currentPage?: number
  itemCount?: number
  totalPages?: number
}

type JobPoolJobClassificationResDto = {
  id?: number
  code?: string
  name?: string
  status?: unknown
}

type JobPoolActivityResDto = {
  id?: number
  code?: string
  name?: string
}

type JobPoolUserResDto = {
  id?: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  status?: string | null
}

type JobPoolDepartmentResDto = {
  id?: number
  code?: string
  name?: string
}

type JobPoolResDto = {
  id?: number
  name?: string
  description?: string | null
  status?: unknown
  departmentId?: number
  jobClassifications?: number[]
  activities?: number[]
  users?: string[]
  jobClassificationDetails?: JobPoolJobClassificationResDto[]
  activityDetails?: JobPoolActivityResDto[]
  userDetails?: JobPoolUserResDto[]
  department?: JobPoolDepartmentResDto
}

type JobPoolListResponseDto = {
  data?: JobPoolResDto[]
  meta?: PaginationMeta
}

type CreateJobPoolReqDto = {
  name: string
  description?: string
  status?: string
  departmentId: number
  jobClassifications?: number[]
  activities?: number[]
  users?: string[]
}

type UpdateJobPoolReqDto = Partial<CreateJobPoolReqDto>

function toJobClassificationTag(dto: JobPoolJobClassificationResDto): JobClassificationTag {
  const id = dto.id == null ? "" : String(dto.id)
  const code = typeof dto.code === "string" ? dto.code : ""
  const name = typeof dto.name === "string" ? dto.name : ""

  return {
    id,
    name: code && name ? `${code} | ${name}` : code || name || id,
    status: typeof dto.status === "string" ? dto.status : undefined,
  }
}

function isActiveStatus(status: unknown): boolean {
  if (typeof status === "string") {
    return status.toLowerCase() === "active"
  }
  return true
}

function toJobPoolRow(dto: JobPoolResDto): JobPoolRow {
  const idRaw = dto.id
  const nameRaw = dto.name

  const departmentName =
    typeof dto.department?.name === "string"
      ? dto.department.name
      : dto.departmentId != null
        ? String(dto.departmentId)
        : ""

  const jobClassificationDetails = Array.isArray(dto.jobClassificationDetails)
    ? dto.jobClassificationDetails
    : []

  const jobClassifications: JobClassificationTag[] = jobClassificationDetails.map((item) =>
    toJobClassificationTag(item),
  )

  const jobClassificationName = jobClassificationDetails.map((item) => ({
    name: typeof item.name === "string" ? item.name : "",
    status:
      typeof item.status === "string"
        ? item.status
        : "active",
  }))

  const activities = Array.isArray(dto.activities) ? dto.activities : []
  const users = Array.isArray(dto.users) ? dto.users : []
  const userDetails = Array.isArray(dto.userDetails) ? dto.userDetails : []

  const userprofiles = userDetails.map((user) => ({
    id: user.id ?? "",
    name: user.name ?? undefined,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    status: user.status ?? undefined,
  }))

  return {
    id: idRaw == null ? "" : String(idRaw),
    name: typeof nameRaw === "string" ? nameRaw : "",
    department: departmentName,
    active: isActiveStatus(dto.status),
    jobClassifications,
    assignedJobClassificationIds: jobClassifications.map((jc) => jc.id),
    assignedActivityIds: activities.map((id) => String(id)),
    assignedEmployeeIds: users.map((id) => String(id)),
    departmentId: dto.departmentId != null ? String(dto.departmentId) : undefined,
    departmentName,
    jobClassificationName,
    userprofiles,
  }
}

export async function getJobPools(params: GetJobPoolsParams): Promise<JobPoolListResponse> {
  const { page, pageSize, search, inactiveOnly, departmentId } = params

  const parts: string[] = []
  parts.push(`page=${page}`)
  parts.push(`limit=${pageSize}`)
  if (search.trim()) {
    parts.push(`search=${encodeURIComponent(search.trim())}`)
  }
  parts.push(`status=${inactiveOnly ? "inactive" : "active"}`)
  if (departmentId) {
    parts.push(`departmentId=${departmentId}`)
  }

  const res = await api.get<ApiEnvelope<JobPoolListResponseDto> | JobPoolListResponseDto>(
    `/jobpool?${parts.join("&")}`,
  )

  const payload =
    (res as ApiEnvelope<JobPoolListResponseDto>).data ??
    (res as JobPoolListResponseDto | undefined)

  const list = Array.isArray(payload?.data) ? payload.data : []
  const items: JobPoolRow[] = list.map((item) => toJobPoolRow(item as JobPoolResDto))

  const meta = payload?.meta
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

function normalizeDepartmentId(value: string): number {
  const trimmed = value.trim()
  const parsed = Number(trimmed)
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }
  return 0
}

function toCreateUpdateDto(values: JobPoolFormValues): CreateJobPoolReqDto {
  const description = undefined
  const departmentId = normalizeDepartmentId(values.department)

  return {
    name: values.name.trim(),
    description,
    status: values.active ? "active" : "inactive",
    departmentId,
    jobClassifications: values.assignedJobClassificationIds.map((id) => Number(id)),
    activities: values.assignedActivityIds.map((id) => Number(id)),
    users: values.assignedEmployeeIds,
  }
}

export async function createJobPool(values: JobPoolFormValues): Promise<JobPoolRow> {
  const body: CreateJobPoolReqDto = toCreateUpdateDto(values)

  const res = await api.post<ApiEnvelope<JobPoolResDto> | JobPoolResDto>("/jobpool", body)

  const payload =
    (res as ApiEnvelope<JobPoolResDto>).data ??
    (res as JobPoolResDto | undefined) ??
    {}

  return toJobPoolRow(payload as JobPoolResDto)
}

export async function updateJobPool(id: string, values: JobPoolFormValues): Promise<JobPoolRow> {
  const body: UpdateJobPoolReqDto = toCreateUpdateDto(values)

  const res = await api.put<ApiEnvelope<JobPoolResDto> | JobPoolResDto>(
    `/jobpool/${id}`,
    body,
  )

  const payload =
    (res as ApiEnvelope<JobPoolResDto>).data ??
    (res as JobPoolResDto | undefined) ??
    {}

  return toJobPoolRow(payload as JobPoolResDto)
}

export async function getJobPoolById(id: string): Promise<JobPoolRow> {
  const res = await api.get<ApiEnvelope<JobPoolResDto> | JobPoolResDto>(`/jobpool/${id}`)

  const payload =
    (res as ApiEnvelope<JobPoolResDto>).data ??
    (res as JobPoolResDto | undefined) ??
    {}

  return toJobPoolRow(payload as JobPoolResDto)
}

