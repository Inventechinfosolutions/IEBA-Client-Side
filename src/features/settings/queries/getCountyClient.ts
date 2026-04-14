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


function normalizeBase64ToDataUrl(content: string, mimeType?: string): string {
  const trimmed = content.trim()
  if (trimmed.startsWith("data:")) return trimmed
  const mt = mimeType?.trim() || "image/png"
  return `data:${mt};base64,${trimmed}`
}

async function fetchClientForCurrentCounty(_countyName?: string): Promise<CountyClientDetailModel> {
  // Directly fetch client ID 1, as agreed that the list call is redundant
  // and we primarily deal with the main county client in settings.
  return fetchCountyClientById(1)
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

