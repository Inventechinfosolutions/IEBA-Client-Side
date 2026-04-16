import { settingsDeleteRequest } from "@/features/settings/api/settingsDeleteRequest"
import { api } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"
import { getToken } from "@/lib/api"

export type ApiResponseDto<T> = {
  success: boolean
  message: string
  data: T | null
  errorCode?: string | null
}

export type UpdateCountyClientBody = {
  name: string
  message: string
  timeRule: boolean
  startTime: string
  endTime: string
  autoApproval: boolean
  apportioning: boolean
  include_weekend: boolean
}

export type CountyLocationPayload = {
  name: string
  clientId: number
  street?: string
  city?: string
  state?: string
  zip?: string
  primary: boolean
  status: string
}

export type UploadClientDocumentResponseDto = {
  storageKey: string
  id: number
}

type ClientDocumentListItem = {
  storageKey: string
  mimeType?: string
  documentType?: string
  createdAt?: string
}

export async function updateCountyClient(
  clientId: number,
  body: UpdateCountyClientBody,
): Promise<void> {
  await api.put<ApiResponseDto<unknown>>(`/client/${clientId}`, body)
}

export async function deleteCountyLocation(locationId: number): Promise<void> {
  await settingsDeleteRequest<ApiResponseDto<null>>(`/location/${locationId}`)
}

export async function createCountyLocation(body: CountyLocationPayload): Promise<void> {
  await api.post<ApiResponseDto<unknown>>("/location", body)
}

export async function updateCountyLocation(
  locationId: number,
  body: CountyLocationPayload,
): Promise<void> {
  await api.put<ApiResponseDto<unknown>>(`/location/${locationId}`, body)
}

export async function uploadCountyLogo(clientId: number, dataUrl: string): Promise<UploadClientDocumentResponseDto> {
  const payload = dataUrl.trim()
  if (!payload.startsWith("data:")) {
    throw new Error("County logo must be a data URL")
  }

  const token = getToken()
  const blob = await fetch(payload).then(async (r) => await r.blob())
  if (!blob.size) throw new Error("County logo is empty")

  const ext = blob.type === "image/jpeg" ? "jpg" : "png"
  const file = new File([blob], `client-${clientId}-logo.${ext}`, {
    type: blob.type || "image/png",
  })

  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`${API_BASE_URL}/client/${encodeURIComponent(String(clientId))}/documents`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as
      | { message?: string | string[]; error?: string }
      | null
    const rawMessage = errorBody?.message ?? errorBody?.error
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : (rawMessage ?? res.statusText)
    throw new Error(message)
  }

  const body = (await res.json().catch(() => null)) as ApiResponseDto<UploadClientDocumentResponseDto> | null
  if (!body?.success || !body.data?.storageKey) {
    throw new Error(body?.message ?? "Failed to upload county logo")
  }
  return body.data
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

export async function deleteCountyLogo(clientId: number): Promise<void> {
  const listRes = await api.get<ApiResponseDto<ClientDocumentListItem[]>>(
    `/client/${clientId}/get-all-files?refType=${encodeURIComponent("client_logo")}`,
  )
  const rows = Array.isArray(listRes.data) ? listRes.data : []
  if (rows.length === 0) return

  const sorted = sortByNewestCreatedAt(rows)
  const candidates = sorted.filter(
    (r) =>
      typeof r.storageKey === "string" &&
      r.storageKey.trim().length > 0 &&
      ((r.mimeType ?? "").toLowerCase().startsWith("image/") ||
        r.documentType === "client_logo" ||
        r.documentType === "client"),
  )
  const target = candidates[0]?.storageKey?.trim()
  if (!target) return

  await settingsDeleteRequest<ApiResponseDto<null>>(`/client/documents/${encodeURIComponent(target)}`)
}
