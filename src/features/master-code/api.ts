import { api } from "@/lib/api"

import { ActivityStatusEnum } from "./enums/activity-status.enum"
import type {
  ApiActivityCode,
  ApiTenantMasterCode,
  MasterCodeFormValues,
  MasterCodeListResponse,
  MasterCodeRow,
  MasterCodeTab,
  TenantMasterCodeRow,
} from "./types"


function formatPercent(value: number): string {
  if (Number.isNaN(value)) return "0.00"
  return value.toFixed(2)
}

function normalizeMatch(raw: string | undefined): string {
  const value = String(raw ?? "").trim()
  if (!value) return ""
  if (/^[a-z]+$/i.test(value)) return value.toUpperCase()
  return value
}

export function normalizeActivityCodeRow(raw: ApiActivityCode): MasterCodeRow {
  return {
    id: String(raw.id),
    code: raw.code,
    name: raw.name,
    spmp: raw.spmp ?? false,
    allocable: raw.allocable ?? true,
    ffpPercent: formatPercent(raw.percent ?? 0),
    match: normalizeMatch(raw.match),
    status: raw.status === ActivityStatusEnum.ACTIVE,
    activityDescription: raw.description ?? "",
  }
}

function unwrapActivityListPayload(raw: unknown): {
  data: ApiActivityCode[]
  meta: { totalItems: number }
} {
  const root = raw as {
    data?: { data?: ApiActivityCode[]; meta?: { totalItems?: number } }
  }
  const inner = root?.data
  return {
    data: Array.isArray(inner?.data) ? inner.data : [],
    meta: {
      totalItems: Number(inner?.meta?.totalItems ?? 0),
    },
  }
}

/**
 * `GET /activity-codes` — matches `ActivityCodeListQueryDto` (page, limit, sort, sortField, type, status).
 */
export async function apiGetMasterCodesPage(params: {
  codeType: MasterCodeTab
  page: number
  pageSize: number
  inactiveOnly: boolean
}): Promise<MasterCodeListResponse> {
  const limit = Math.min(100, Math.max(1, params.pageSize))
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(limit),
    sort: "ASC",
    sortField: "code",
    type: params.codeType,
    status: params.inactiveOnly ? ActivityStatusEnum.INACTIVE : ActivityStatusEnum.ACTIVE,
  })

  const raw = await api.get<unknown>(`/activity-codes?${search.toString()}`)
  const { data, meta } = unwrapActivityListPayload(raw)
  return {
    items: data.map(normalizeActivityCodeRow),
    totalItems: meta.totalItems,
  }
}

function buildCreateBody(codeType: MasterCodeTab, values: MasterCodeFormValues) {
  const percent = Number.parseFloat(values.ffpPercent?.trim() || "0")
  const body: Record<string, unknown> = {
    code: values.code.trim(),
    type: codeType,
    name: values.name.trim(),
    // keep rich text (HTML) so bold/italic etc. are stored in DB
    description: (values.activityDescription ?? "").trim(),
    percent: Number.isNaN(percent) ? 0 : percent,
    spmp: values.spmp,
    allocable: values.allocable,
    status: values.active ? ActivityStatusEnum.ACTIVE : ActivityStatusEnum.INACTIVE,
  }
  const m = String(values.match ?? "").trim()
  if (m) body.match = /^[a-z]+$/i.test(m) ? m.toUpperCase() : m
  return body
}

function buildUpdateBody(codeType: MasterCodeTab, values: MasterCodeFormValues) {
  const percent = Number.parseFloat(values.ffpPercent?.trim() || "0")
  const body: Record<string, unknown> = {
    code: values.code.trim(),
    type: codeType,
    name: values.name.trim(),
    // keep rich text (HTML) so bold/italic etc. are stored in DB
    description: (values.activityDescription ?? "").trim(),
    percent: Number.isNaN(percent) ? 0 : percent,
    spmp: values.spmp,
    allocable: values.allocable,
    status: values.active ? ActivityStatusEnum.ACTIVE : ActivityStatusEnum.INACTIVE,
  }
  const m = String(values.match ?? "").trim()
  if (m) body.match = /^[a-z]+$/i.test(m) ? m.toUpperCase() : m
  return body
}

export async function apiCreateMasterCode(input: {
  codeType: MasterCodeTab
  values: MasterCodeFormValues
}): Promise<MasterCodeRow> {
  const raw = await api.post<{ data?: { id: number } }>(
    "/activity-codes",
    buildCreateBody(input.codeType, input.values)
  )
  const createdId = (raw as { data?: { id: number } })?.data?.id
  if (createdId == null) {
    throw new Error("Create response missing id")
  }
  const detail = await api.get<{ data?: ApiActivityCode }>(
    `/activity-codes/${encodeURIComponent(String(createdId))}`
  )
  const entity = (detail as { data?: ApiActivityCode })?.data
  if (!entity) throw new Error("Failed to load created activity code")
  return normalizeActivityCodeRow(entity)
}

export async function apiUpdateMasterCode(input: {
  id: string
  codeType: MasterCodeTab
  values: MasterCodeFormValues
}): Promise<MasterCodeRow> {
  const raw = await api.put<{ data?: ApiActivityCode }>(
    `/activity-codes/${encodeURIComponent(input.id)}`,
    buildUpdateBody(input.codeType, input.values)
  )
  const entity = (raw as { data?: ApiActivityCode })?.data
  if (!entity) throw new Error("Update response missing data")
  return normalizeActivityCodeRow(entity)
}

export async function apiGetMasterCodeById(id: string): Promise<MasterCodeRow> {
  const raw = await api.get<{ data?: ApiActivityCode }>(
    `/activity-codes/${encodeURIComponent(id)}`
  )
  const entity = (raw as { data?: ApiActivityCode })?.data
  if (!entity) throw new Error("Activity code not found")
  return normalizeActivityCodeRow(entity)
}

// ─── Tenant master-codes: by-name + PUT ───────────────────────────────────────


function normalizeTenantMasterCode(raw: ApiTenantMasterCode): TenantMasterCodeRow {
  return {
    id: raw.id,
    name: raw.name,
    allowMulticode: raw.allowMulticode,
    status:
      raw.status === ActivityStatusEnum.INACTIVE
        ? ActivityStatusEnum.INACTIVE
        : ActivityStatusEnum.ACTIVE,
  }
}

function unwrapTenantMasterDetail(raw: unknown): ApiTenantMasterCode | null {
  if (raw == null || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const inner = o.data
  if (inner && typeof inner === "object" && "id" in (inner as object)) {
    return inner as ApiTenantMasterCode
  }
  if ("id" in o && typeof (o as { id?: unknown }).id === "number") {
    return o as unknown as ApiTenantMasterCode
  }
  return null
}

/**
 * `GET /master-codes/by-name?name=` — exact name (e.g. FFP). Returns null if not found (404).
 */
export async function apiGetTenantMasterCodeByName(
  name: MasterCodeTab
): Promise<TenantMasterCodeRow | null> {
  const search = new URLSearchParams({ name })
  try {
    const raw = await api.get<unknown>(`/master-codes/by-name?${search.toString()}`)
    const entity = unwrapTenantMasterDetail(raw)
    if (!entity) return null
    return normalizeTenantMasterCode(entity)
  } catch (e) {
    if (e instanceof Error && /not found|404/i.test(e.message)) return null
    throw e
  }
}

export async function apiUpdateTenantMasterCode(input: {
  id: number
  body: Partial<{
    name: string
    allowMulticode: boolean
    status: (typeof ActivityStatusEnum)[keyof typeof ActivityStatusEnum]
  }>
}): Promise<TenantMasterCodeRow> {
  const raw = await api.put<{ data?: ApiTenantMasterCode }>(
    `/master-codes/${encodeURIComponent(String(input.id))}`,
    input.body
  )
  const entity = (raw as { data?: ApiTenantMasterCode })?.data
  if (!entity) throw new Error("Master code update response missing data")
  return normalizeTenantMasterCode(entity)
}
