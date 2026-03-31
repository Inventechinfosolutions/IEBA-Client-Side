import { API_BASE_URL } from "@/lib/config"

import { ActivityStatusEnum } from "@/features/master-code/enums/activity-status.enum"
import type {
  MasterCodeFormValues,
  MasterCodeListResponse,
  MasterCodeRow,
  MasterCodeTab,
  TenantMasterCodeRow,
} from "./types"

type ApiActivityCode = {
  id: number
  code: string
  type: string
  name: string
  description: string
  percent: number
  spmp?: boolean
  allocable?: boolean
  match?: string
  status: string
  createdAt?: string
  updatedAt?: string
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as { message?: string; error?: string }
      message = data?.message || data?.error || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function htmlToPlainDescription(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return text.length > 0 ? text : " "
}

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
export async function apiGetActivityCodesPage(params: {
  codeType: MasterCodeTab
  page: number
  pageSize: number
  inactiveOnly: boolean
}): Promise<MasterCodeListResponse> {
  const limit = Math.min(100, Math.max(1, params.pageSize))
  const url = new URL(`${API_BASE_URL}/activity-codes`, window.location.origin)
  url.searchParams.set("page", String(params.page))
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("sort", "ASC")
  url.searchParams.set("sortField", "code")
  url.searchParams.set("type", params.codeType)
  url.searchParams.set(
    "status",
    params.inactiveOnly ? ActivityStatusEnum.INACTIVE : ActivityStatusEnum.ACTIVE
  )

  const raw = await fetchJson<unknown>(url)
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
    description: htmlToPlainDescription(values.activityDescription ?? ""),
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
    description: htmlToPlainDescription(values.activityDescription ?? ""),
    percent: Number.isNaN(percent) ? 0 : percent,
    spmp: values.spmp,
    allocable: values.allocable,
    status: values.active ? ActivityStatusEnum.ACTIVE : ActivityStatusEnum.INACTIVE,
  }
  const m = String(values.match ?? "").trim()
  if (m) body.match = /^[a-z]+$/i.test(m) ? m.toUpperCase() : m
  return body
}

export async function apiCreateActivityCode(input: {
  codeType: MasterCodeTab
  values: MasterCodeFormValues
}): Promise<MasterCodeRow> {
  const raw = await fetchJson<{ data?: { id: number } }>(`${API_BASE_URL}/activity-codes`, {
    method: "POST",
    body: JSON.stringify(buildCreateBody(input.codeType, input.values)),
  })
  const createdId = (raw as { data?: { id: number } })?.data?.id
  if (createdId == null) {
    throw new Error("Create response missing id")
  }
  const detail = await fetchJson<{ data?: ApiActivityCode }>(
    `${API_BASE_URL}/activity-codes/${encodeURIComponent(String(createdId))}`
  )
  const entity = (detail as { data?: ApiActivityCode })?.data
  if (!entity) throw new Error("Failed to load created activity code")
  return normalizeActivityCodeRow(entity)
}

export async function apiUpdateActivityCode(input: {
  id: string
  codeType: MasterCodeTab
  values: MasterCodeFormValues
}): Promise<MasterCodeRow> {
  const raw = await fetchJson<{ data?: ApiActivityCode }>(
    `${API_BASE_URL}/activity-codes/${encodeURIComponent(input.id)}`,
    {
      method: "PUT",
      body: JSON.stringify(buildUpdateBody(input.codeType, input.values)),
    }
  )
  const entity = (raw as { data?: ApiActivityCode })?.data
  if (!entity) throw new Error("Update response missing data")
  return normalizeActivityCodeRow(entity)
}

// ─── Tenant master-codes: `/master-codes` (tabs + allowMulticode) ─────────────

type ApiTenantMasterCode = {
  id: number
  name: string
  allowMulticode: boolean
  status: string
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

function unwrapMasterCodeListPayload(raw: unknown): {
  data: ApiTenantMasterCode[]
  meta: { totalItems: number; hasNextPage: boolean }
} {
  const root = raw as {
    data?: { data?: ApiTenantMasterCode[]; meta?: { totalItems?: number; hasNextPage?: boolean } }
  }
  const inner = root?.data
  return {
    data: Array.isArray(inner?.data) ? inner.data : [],
    meta: {
      totalItems: Number(inner?.meta?.totalItems ?? 0),
      hasNextPage: Boolean(inner?.meta?.hasNextPage),
    },
  }
}

export async function apiListTenantMasterCodes(params: {
  page: number
  limit: number
}): Promise<{ items: TenantMasterCodeRow[]; totalItems: number }> {
  const url = new URL(`${API_BASE_URL}/master-codes`, window.location.origin)
  url.searchParams.set("page", String(params.page))
  url.searchParams.set("limit", String(Math.min(100, params.limit)))
  const raw = await fetchJson<unknown>(url)
  const { data, meta } = unwrapMasterCodeListPayload(raw)
  return {
    items: data.map(normalizeTenantMasterCode),
    totalItems: meta.totalItems,
  }
}

/** Fetch all master-code rows (tabs) — backend list is paginated. */
export async function apiListAllTenantMasterCodes(): Promise<TenantMasterCodeRow[]> {
  const out: TenantMasterCodeRow[] = []
  let page = 1
  const limit = 100
  let guard = 0
  while (guard < 500) {
    guard++
    const { items, totalItems } = await apiListTenantMasterCodes({ page, limit })
    out.push(...items)
    if (items.length < limit || out.length >= totalItems) break
    page++
  }
  return out
}

export async function apiUpdateTenantMasterCode(input: {
  id: number
  body: Partial<{
    name: string
    allowMulticode: boolean
    status: (typeof ActivityStatusEnum)[keyof typeof ActivityStatusEnum]
  }>
}): Promise<TenantMasterCodeRow> {
  const raw = await fetchJson<{ data?: ApiTenantMasterCode }>(
    `${API_BASE_URL}/master-codes/${encodeURIComponent(String(input.id))}`,
    {
      method: "PUT",
      body: JSON.stringify(input.body),
    }
  )
  const entity = (raw as { data?: ApiTenantMasterCode })?.data
  if (!entity) throw new Error("Master code update response missing data")
  return normalizeTenantMasterCode(entity)
}
