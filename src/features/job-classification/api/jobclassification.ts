import { api } from "@/lib/api"
import type {
  CreateJobClassificationReqDto,
  CreateJobClassificationResponseDto,
  GetJobClassificationsParams,
  JobClassificationApiEnvelope,
  JobClassificationFormValues,
  JobClassificationListResponse,
  JobClassificationListResponseDto,
  JobClassificationResDto,
  JobClassificationRow,
  UpdateJobClassificationReqDto,
} from "../types"

function toJobClassificationRow(dto: JobClassificationResDto): JobClassificationRow {
  const idRaw = dto.id
  const codeRaw = dto.code
  const nameRaw = dto.name
  const descriptionRaw =
    typeof dto.description === "string"
      ? dto.description
      : typeof (dto as { activityDescription?: unknown }).activityDescription === "string"
        ? ((dto as { activityDescription: string }).activityDescription as string)
        : null

  const active =
    typeof dto.active === "boolean"
      ? dto.active
      : typeof dto.status === "boolean"
        ? dto.status
        : typeof dto.status === "string"
          ? dto.status.toLowerCase() === "active"
          : true

  return {
    id: idRaw == null ? "" : String(idRaw),
    code: typeof codeRaw === "string" ? codeRaw : "",
    name: typeof nameRaw === "string" ? nameRaw : "",
    active,
    activityDescription: descriptionRaw ?? "",
  }
}

function toCreateUpdateDto(values: JobClassificationFormValues): CreateJobClassificationReqDto {
  const description =
    values.activityDescription && values.activityDescription.trim()
      ? values.activityDescription.trim()
      : null

  return {
    code: values.code.trim(),
    name: values.name.trim(),
    status: values.active ? "active" : "inactive",
    ...(description ? { description } : {}),
  }
}

export async function getJobClassifications(
  params: GetJobClassificationsParams,
): Promise<JobClassificationListResponse> {
  const { page, pageSize, search, inactiveOnly } = params

  const searchParams = new URLSearchParams()
  searchParams.set("page", String(page))
  // Backend enforces an upper bound of 100 for `limit`.
  const safeLimit = Math.min(pageSize, 100)
  searchParams.set("limit", String(safeLimit))

  if (search.trim()) {
    searchParams.set("search", search.trim())
  }

  // Mirror Department behaviour: always send explicit status.
  searchParams.set("status", inactiveOnly ? "inactive" : "active")

  const res = await api.get<
    JobClassificationApiEnvelope<JobClassificationListResponseDto> | JobClassificationListResponseDto
  >(`/jobclassification?${searchParams.toString()}`)

  const payload =
    (res as JobClassificationApiEnvelope<JobClassificationListResponseDto>).data ??
    (res as JobClassificationListResponseDto | undefined)

  const list = Array.isArray(payload?.data) ? payload.data : []
  const items: JobClassificationRow[] = list.map((item) => toJobClassificationRow(item as JobClassificationResDto))

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

export async function createJobClassification(
  values: JobClassificationFormValues,
): Promise<JobClassificationRow> {
  const body: CreateJobClassificationReqDto = toCreateUpdateDto(values)

  const res = await api.post<
    JobClassificationApiEnvelope<CreateJobClassificationResponseDto> | CreateJobClassificationResponseDto
  >("/jobclassification", body)

  const payload =
    (res as JobClassificationApiEnvelope<CreateJobClassificationResponseDto>).data ??
    (res as CreateJobClassificationResponseDto | undefined) ??
    {}

  return toJobClassificationRow(payload as JobClassificationResDto)
}

export async function updateJobClassification(
  id: string,
  values: JobClassificationFormValues,
): Promise<JobClassificationRow> {
  const body: UpdateJobClassificationReqDto = toCreateUpdateDto(values)

  const res = await api.put<JobClassificationApiEnvelope<JobClassificationResDto> | JobClassificationResDto>(
    `/jobclassification/${id}`,
    body,
  )

  const payload =
    (res as JobClassificationApiEnvelope<JobClassificationResDto>).data ??
    (res as JobClassificationResDto | undefined) ??
    {}

  return toJobClassificationRow(payload as JobClassificationResDto)
}

