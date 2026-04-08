import { api } from "@/lib/api"

import { ActivityStatusEnum } from "./enums/activityStatus"
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

/** Normalizes activity-code `match` from API/forms (letters uppercased; slashes preserved). */
export function normalizeMatch(raw: string | undefined): string {
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

/** Backend rejects `limit` above this value (`ActivityCodeListQueryDto`) for typed tab lists. */
const ACTIVITY_CODES_API_MAX_LIMIT = 100

/**
 * Single-stream `GET /activity-codes` without `type` (county catalog / enrichment).
 * Align with backend max if this DTO caps lower than 1000.
 */
export const ACTIVITY_CODES_CATALOG_ALL_LIMIT = 1000

/**
 * `GET /activity-codes` — matches `ActivityCodeListQueryDto` (page, limit, sort, sortField, type, status).
 */
export async function apiGetMasterCodesPage(params: {
  codeType: MasterCodeTab
  page: number
  pageSize: number
  inactiveOnly: boolean
}): Promise<MasterCodeListResponse> {
  const limit = Math.min(ACTIVITY_CODES_API_MAX_LIMIT, Math.max(1, params.pageSize))
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

/**
 * Loads every activity code for a type by paging with {@link ACTIVITY_CODES_API_MAX_LIMIT} per request.
 */
export async function apiGetActivityCodesAllForType(params: {
  codeType: MasterCodeTab
  inactiveOnly: boolean
}): Promise<MasterCodeListResponse> {
  const limit = ACTIVITY_CODES_API_MAX_LIMIT
  const items: MasterCodeRow[] = []
  let page = 1
  let totalItems = 0

  while (true) {
    const res = await apiGetMasterCodesPage({
      codeType: params.codeType,
      page,
      pageSize: limit,
      inactiveOnly: params.inactiveOnly,
    })
    totalItems = res.totalItems
    items.push(...res.items)

    if (res.items.length === 0) break
    if (totalItems > 0 && items.length >= totalItems) break
    if (res.items.length < limit) break
    page += 1
  }

  return { items, totalItems }
}

const ACTIVITY_CODES_CATALOG_MAX_PAGES = 20

/**
 * All activity codes in one API shape: `GET /activity-codes` with **no** `type` filter.
 * Pages with {@link ACTIVITY_CODES_CATALOG_ALL_LIMIT} until the API reports no more rows.
 */
export async function apiFetchActivityCodesCatalogAll(options?: {
  inactiveOnly?: boolean
}): Promise<ApiActivityCode[]> {
  const inactiveOnly = options?.inactiveOnly ?? false
  const limit = ACTIVITY_CODES_CATALOG_ALL_LIMIT
  const all: ApiActivityCode[] = []
  let page = 1

  while (page <= ACTIVITY_CODES_CATALOG_MAX_PAGES) {
    const search = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort: "ASC",
      sortField: "code",
      status: inactiveOnly ? ActivityStatusEnum.INACTIVE : ActivityStatusEnum.ACTIVE,
    })

    const raw = await api.get<unknown>(`/activity-codes?${search.toString()}`)
    const { data, meta } = unwrapActivityListPayload(raw)
    all.push(...data)

    if (data.length === 0) break
    if (meta.totalItems > 0 && all.length >= meta.totalItems) break
    if (data.length < limit) break
    page += 1
  }

  return all
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
