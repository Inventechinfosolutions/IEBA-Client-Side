import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

type ApiResponseDto<T> = {
  success: boolean
  message: string
  data: T | null
  errorCode?: string | null
}

type ClientListItem = {
  id: number
  name: string
}

type ClientListResponseDto = {
  data: ClientListItem[]
  meta?: unknown
}

const resolvedClientIdByCountyKey = new Map<string, number>()

type ClientDocument = {
  id: number
  name?: string
  refId?: string
  refType?: string
  type?: string
  mimeType?: string
  content?: string
  url?: string | null
  status?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export type ClientLocation = {
  id: number
  name: string
  clientId: number
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  primary?: boolean
  status?: string
}

/** Client detail from `GET /client/:id` (county settings + locations). */
export type CountyClientDetailModel = {
  id: number
  name: string
  message?: string | null
  logo?: string | null
  timeRule?: boolean | null
  startTime?: string | null
  endTime?: string | null
  autoApproval?: boolean | null
  apportioning?: boolean | null
  include_weekend?: boolean | null
  startFromValue?: boolean | null
  document?: ClientDocument | null
  locations?: ClientLocation[] | null
}


function normalizeBase64ToDataUrl(content: string, mimeType?: string): string {
  const trimmed = content.trim()
  if (trimmed.startsWith("data:")) return trimmed
  const mt = mimeType?.trim() || "image/png"
  return `data:${mt};base64,${trimmed}`
}

function normalizePossibleLogoToSrc(value: string, mimeType?: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  // Already a URL or data URL
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed
  }
  // Looks like base64 (backend sometimes stores raw base64 without prefix)
  return normalizeBase64ToDataUrl(trimmed, mimeType)
}

type ClientDocumentListItem = {
  id: number
  name: string
  mimeType: string
  storageKey: string
  documentType?: string
  content?: string
  url?: string | null
  createdAt?: string
}

function sortByNewestCreatedAt(rows: ClientDocumentListItem[]): ClientDocumentListItem[] {
  return [...rows].sort((a, b) => {
    const at = Date.parse(a.createdAt ?? "")
    const bt = Date.parse(b.createdAt ?? "")
    if (Number.isNaN(at) && Number.isNaN(bt)) return 0
    if (Number.isNaN(at)) return 1
    if (Number.isNaN(bt)) return -1
    return bt - at
  })
}

async function fetchClientLogoObjectUrlFromClientDocuments(clientId: number): Promise<string | null> {
  // Backend: GET /client/:id/get-all-files?refType=client_logo (client_logo accepted as alias)
  const refType = "client_logo"
  const pathsToTry = [
    `/client/${clientId}/get-all-files?refType=${encodeURIComponent(refType)}`,
    `/client/${clientId}/get-all-files`,
    `/client/get-all-files?entityType=client&entityId=${encodeURIComponent(String(clientId))}&refType=${encodeURIComponent(
      refType,
    )}`,
    `/client/get-all-files?entityType=client&entityId=${encodeURIComponent(String(clientId))}`,
  ]

  let rows: ClientDocumentListItem[] = []
  let lastError: unknown = null
  for (const p of pathsToTry) {
    try {
      const res = await api.get<ApiResponseDto<ClientDocumentListItem[]>>(p)
      if (!res?.success || !Array.isArray(res.data)) continue
      rows = res.data
      break
    } catch (e) {
      lastError = e
    }
  }

  if (rows.length === 0) {
    if (lastError instanceof Error) throw lastError
    return null
  }

  const sorted = sortByNewestCreatedAt(rows)
  const preferred = sorted.filter(
    (r) =>
      (r.mimeType ?? "").toLowerCase().startsWith("image/") &&
      (r.documentType === "client_logo" || r.documentType === "client" || r.documentType === "client_file"),
  )
  const candidates = preferred.length > 0 ? preferred : sorted

  for (const doc of candidates) {
    const inlineContent = typeof doc.content === "string" ? doc.content.trim() : ""
    if (inlineContent) {
      return normalizePossibleLogoToSrc(inlineContent, doc.mimeType)
    }

    const directUrl = typeof doc.url === "string" ? doc.url.trim() : ""
    if (directUrl) {
      return directUrl
    }

    const storageKey = doc.storageKey?.trim() ?? ""
    if (!storageKey) continue

    // Silent fallback: try preview by storage key; ignore failures and try next candidate.
    const { API_BASE_URL } = await import("@/lib/config")
    const { getToken } = await import("@/lib/api")
    const token = getToken()
    const url = `${API_BASE_URL}/client/documents/preview/${encodeURIComponent(storageKey)}`
    const res = await fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    })
    if (!res.ok) continue
    const blob = await res.blob()
    if (!blob.size) continue
    return URL.createObjectURL(blob)
  }

  return null
}

async function fetchClientForCurrentCounty(countyName?: string, namespace?: string): Promise<CountyClientDetailModel> {
  const name = countyName?.trim()
  if (!name) {
    throw new Error("County name is required to load county settings.")
  }

  const cacheKey = `${(namespace ?? "").trim().toLowerCase()}::${name.toLowerCase()}`
  const cachedId = resolvedClientIdByCountyKey.get(cacheKey)
  if (cachedId) {
    return fetchCountyClientById(cachedId)
  }

  // Resolve the correct clientId for the logged-in county, then fetch the detail.
  // We can't hardcode `1` because different counties map to different client records (e.g. Trinity is id=3).
  const target = name.toLowerCase()
  const limit = 100 

  // Paginate until we find the county (or run out of pages).
  for (let page = 1; page <= 20; page++) {
    const search = new URLSearchParams()
    search.set("page", String(page))
    search.set("limit", String(limit))
    search.set("sort", "ASC")
    const listRes = await api.get<ApiResponseDto<ClientListResponseDto>>(`/client?${search.toString()}`)
    const rows = listRes.data?.data ?? []
    const match = rows.find((c) => c.name.trim().toLowerCase() === target)
    if (match?.id) {
      resolvedClientIdByCountyKey.set(cacheKey, match.id)
      return fetchCountyClientById(match.id)
    }

    if (rows.length < limit) break
    const totalPages = (listRes.data as { meta?: { totalPages?: number } } | null | undefined)?.meta?.totalPages
    if (typeof totalPages === "number" && page >= totalPages) break
  }

  throw new Error(`Client not found for county "${name}"`)
}

/** Single client detail (includes `locations`). Use before save/delete diffing so the list matches the DB. */
export async function fetchCountyClientById(clientId: number): Promise<CountyClientDetailModel> {
  const detailRes = await api.get<ApiResponseDto<CountyClientDetailModel>>(`/client/${clientId}`)
  const client = detailRes.data
  if (!client) throw new Error("Client not found")

  // Ensure we have a logo document even if `/client/:id` doesn't embed it.
  if (!client.document?.content && !client.document?.url) {
    const logoObjectUrl = await fetchClientLogoObjectUrlFromClientDocuments(clientId)
    if (logoObjectUrl) {
      client.document = {
        id: 0,
        content: logoObjectUrl,
      }
    }
  }

  if (client.document?.content) {
    const c = client.document.content.trim()
    client.document = {
      ...client.document,
      content: c.startsWith("blob:") ? c : normalizeBase64ToDataUrl(c, client.document.mimeType),
    }
  }

  if (typeof client.logo === "string" && client.logo.trim()) {
    client.logo = normalizePossibleLogoToSrc(client.logo, client.document?.mimeType)
  }
  return client
}

export const settingsCountyClientQueryKey = ["settings", "county", "client"] as const

export function useGetCountyClient(enabled: boolean) {
  const { user, isAuthenticated } = useAuth()
  const canRun = enabled && isAuthenticated

  return useQuery({
    queryKey: [...settingsCountyClientQueryKey, user?.countyName ?? "", user?.namespace ?? ""],
    queryFn: () => fetchClientForCurrentCounty(user?.countyName, user?.namespace),
    enabled: canRun,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

