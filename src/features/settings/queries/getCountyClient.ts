import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

type ApiResponseDto<T> = {
  success: boolean
  message: string
  data: T | null
  errorCode?: string | null
}

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

type ClientListResponse = {
  data: Array<{ id: number; name: string }>
  meta?: unknown
}

function normalizeBase64ToDataUrl(content: string, mimeType?: string): string {
  const trimmed = content.trim()
  if (trimmed.startsWith("data:")) return trimmed
  const mt = mimeType?.trim() || "image/png"
  return `data:${mt};base64,${trimmed}`
}

async function fetchClientForCurrentCounty(countyName?: string): Promise<CountyClientDetailModel> {
  const wanted = (countyName ?? "").trim().toLowerCase()
  const LIMIT = 100

  let page = 1
  let firstRow: { id: number; name: string } | undefined
  let match: { id: number; name: string } | undefined


  for (;;) {
    const listRes = await api.get<ApiResponseDto<ClientListResponse>>(
      `/client?page=${page}&limit=${LIMIT}&sort=ASC`,
    )
    const rows = listRes.data?.data ?? []
    if (!firstRow) firstRow = rows[0]

    if (wanted) {
      match = rows.find((c) => c.name.trim().toLowerCase() === wanted)
      if (match) break
    }

    if (rows.length < LIMIT) break
    page += 1
    if (page > 100) break
  }

  const resolved = match ?? firstRow

  if (!resolved) {
    throw new Error("No client found for this county/tenant")
  }

  return fetchCountyClientById(resolved.id)
}

/** Single client detail (includes `locations`). Use before save/delete diffing so the list matches the DB. */
export async function fetchCountyClientById(clientId: number): Promise<CountyClientDetailModel> {
  const detailRes = await api.get<ApiResponseDto<CountyClientDetailModel>>(`/client/${clientId}`)
  const client = detailRes.data
  if (!client) throw new Error("Client not found")

  if (client.document?.content) {
    client.document = {
      ...client.document,
      content: normalizeBase64ToDataUrl(client.document.content, client.document.mimeType),
    }
  }
  return client
}

export const settingsCountyClientQueryKey = ["settings", "county", "client"] as const

export function useGetCountyClient(enabled: boolean) {
  const { user, isAuthenticated } = useAuth()
  const canRun = enabled && isAuthenticated

  return useQuery({
    queryKey: [...settingsCountyClientQueryKey, user?.countyName ?? "", user?.namespace ?? ""],
    queryFn: () => fetchClientForCurrentCounty(user?.countyName),
    enabled: canRun,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

