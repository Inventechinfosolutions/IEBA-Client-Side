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
  users?: { id?: string; name?: string; firstName?: string; lastName?: string; status?: string }[]
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
  id?: number;
  name?: string;
  description?: string | null;
  status?: unknown;
  departmentId?: number;
  jobClassifications?: number[];
  activities?: number[];
  users?: string[];
  assigned?: JobPoolJobClassificationResDto[];
  assignedToOtherPoolsInDept?: JobPoolJobClassificationResDto[];
  unassigned?: JobPoolJobClassificationResDto[];
  jobClassificationDetails?: JobPoolJobClassificationResDto[];
  assignedJobClassificationDetails?: JobPoolJobClassificationResDto[];
  unassignedJobClassificationDetails?: JobPoolJobClassificationResDto[];
  activityDetails?: JobPoolActivityResDto[];
  assignedActivityDetails?: JobPoolActivityResDto[];
  unassignedActivityDetails?: JobPoolActivityResDto[];
  userDetails?: JobPoolUserResDto[];
  assignedUserDetails?: JobPoolUserResDto[];
  unassignedUserDetails?: JobPoolUserResDto[];
  department?: JobPoolDepartmentResDto;
};

type JobPoolListResponseDto = {
  data?: JobPoolResDto[];
  meta?: PaginationMeta;
};

type CreateJobPoolReqDto = {
  name: string;
  description?: string;
  status?: string;
  departmentId: number;
  jobClassifications?: number[];
  activities?: number[];
  users?: string[];
};

type UpdateJobPoolReqDto = Partial<CreateJobPoolReqDto>;

function toJobClassificationTag(dto: JobPoolJobClassificationResDto): JobClassificationTag {
  const id = dto.id == null ? "" : String(dto.id);
  const code = typeof dto.code === "string" ? dto.code : "";
  const name = typeof dto.name === "string" ? dto.name : "";

  return {
    id,
    name: code && name ? `${code} | ${name}` : code || name || id,
    status: typeof dto.status === "string" ? dto.status : undefined,
  };
}

function isActiveStatus(status: unknown): boolean {
  if (typeof status === "string") {
    return status.toLowerCase() === "active";
  }
  return true;
}

function toJobPoolRow(dto: JobPoolResDto): JobPoolRow {
  const idRaw = dto.id;
  const nameRaw = dto.name;

  const departmentName =
    typeof dto.department?.name === "string"
      ? dto.department.name
      : dto.departmentId != null
        ? String(dto.departmentId)
        : "";

  // ── Job Classifications ────────────────────────────────────────────────────
  const assignedClassifications = Array.isArray(dto.assigned) ? dto.assigned : []

  const jobClassifications: JobClassificationTag[] = assignedClassifications.map((item) =>
    toJobClassificationTag(item),
  )

  const jobClassificationName = assignedClassifications.map((item) => ({
    name: typeof item.name === "string" ? item.name : "",
    status: typeof item.status === "string" ? item.status : "active",
  }))

  // ── Activities ─────────────────────────────────────────────────────────────
  const assignedActivityDetails = Array.isArray(dto.assignedActivityDetails)
    ? dto.assignedActivityDetails.map((a) => ({
        id: String(a.id ?? ""),
        name: a.name ?? "",
        code: a.code ?? "",
      }))
    : undefined

  const unassignedActivityDetails = Array.isArray(dto.unassignedActivityDetails)
    ? dto.unassignedActivityDetails.map((a) => ({
        id: String(a.id ?? ""),
        name: a.name ?? "",
        code: a.code ?? "",
      }))
    : undefined

  // ── Users (nested inside classification buckets) ───────────────────────────
  const assignedUsersMap = new Map<string, { id: string; name?: string; firstName?: string; lastName?: string; status?: string }>()
  for (const jc of assignedClassifications) {
    for (const u of (jc.users ?? [])) {
      const uid = String(u.id ?? "")
      if (uid && !assignedUsersMap.has(uid)) {
        assignedUsersMap.set(uid, {
          id: uid,
          name: u.name ?? "",
          firstName: u.firstName,
          lastName: u.lastName,
          status: u.status,
        })
      }
    }
  }
  const assignedUserDetails = Array.from(assignedUsersMap.values())

  const allUsersMap = new Map<string, { id: string; name?: string; firstName?: string; lastName?: string; status?: string }>()
  const assignedToOther = Array.isArray(dto.assignedToOtherPoolsInDept) ? dto.assignedToOtherPoolsInDept : []
  const unassignedClassifications = Array.isArray(dto.unassigned) ? dto.unassigned : []
  for (const jc of [...assignedClassifications, ...assignedToOther, ...unassignedClassifications]) {
    for (const u of (jc.users ?? [])) {
      const uid = String(u.id ?? "")
      if (uid && !allUsersMap.has(uid)) {
        allUsersMap.set(uid, {
          id: uid,
          name: u.name ?? "",
          firstName: u.firstName,
          lastName: u.lastName,
          status: u.status,
        })
      }
    }
  }
  const assignedUserIdSet = new Set(assignedUserDetails.map((u) => u.id))
  const unassignedUserDetails = Array.from(allUsersMap.values()).filter((u) => !assignedUserIdSet.has(u.id))

  const userprofiles = assignedUserDetails.map((u) => ({
    id: u.id,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    status: u.status,
  }))

  return {
    id: idRaw == null ? "" : String(idRaw),
    name: typeof nameRaw === "string" ? nameRaw : "",
    department: departmentName,
    active: isActiveStatus(dto.status),
    jobClassifications,
    assignedJobClassificationIds: assignedClassifications.map((jc) => String(jc.id ?? "")),
    assignedActivityIds: (assignedActivityDetails ?? []).map((a) => a.id),
    assignedEmployeeIds: assignedUserDetails.map((u) => u.id),
    departmentId: dto.departmentId != null ? String(dto.departmentId) : undefined,
    departmentName,
    jobClassificationName,
    userprofiles,
    assignedActivityDetails,
    unassignedActivityDetails,
    assignedJobClassificationDetails: assignedClassifications.map((jc) => ({
      id: String(jc.id ?? ""),
      name: jc.name ?? "",
      code: jc.code ?? "",
      status: typeof jc.status === "string" ? jc.status : "active",
    })),
    unassignedJobClassificationDetails: unassignedClassifications.map((jc) => ({
      id: String(jc.id ?? ""),
      name: jc.name ?? "",
      code: jc.code ?? "",
      status: typeof jc.status === "string" ? jc.status : "active",
    })),
    assignedUserDetails,
    unassignedUserDetails,
    assigned: assignedClassifications.map((jc) => ({
      id: String(jc.id ?? ""),
      name: jc.name ?? "",
      code: jc.code ?? "",
      status: typeof jc.status === "string" ? jc.status : "active",
      users: (jc.users ?? []).map((u) => ({
        id: String(u.id ?? ""),
        name: u.name ?? "",
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
      })),
    })),
    assignedToOtherPoolsInDept: assignedToOther.map((jc) => ({
      id: String(jc.id ?? ""),
      name: jc.name ?? "",
      code: jc.code ?? "",
      status: typeof jc.status === "string" ? jc.status : "active",
      users: (jc.users ?? []).map((u) => ({
        id: String(u.id ?? ""),
        name: u.name ?? "",
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
      })),
    })),
    unassigned: unassignedClassifications.map((jc) => ({
      id: String(jc.id ?? ""),
      name: jc.name ?? "",
      code: jc.code ?? "",
      status: typeof jc.status === "string" ? jc.status : "active",
      users: (jc.users ?? []).map((u) => ({
        id: String(u.id ?? ""),
        name: u.name ?? "",
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
      })),
    })),
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

export async function getJobPoolActivitiesByDepartment(
  departmentId: number,
  search?: string
): Promise<{ id: string; name: string; code: string }[]> {
  const params = new URLSearchParams({
    departmentId: String(departmentId),
    status: "active",
  })
  if (search?.trim()) {
    params.set("search", search.trim())
  }
  
  const raw = await api.get<{ data?: { id: number; name: string; code: string; status?: string }[] }>(
    `/activity-departments/all?${params.toString()}`
  )
  
  const list = Array.isArray(raw?.data) ? raw.data : []
  return list
    .filter(a => !a.status || a.status.toLowerCase() === "active")
    .map(a => ({
      id: String(a.id),
      name: a.name,
      code: a.code,
    }))
}
