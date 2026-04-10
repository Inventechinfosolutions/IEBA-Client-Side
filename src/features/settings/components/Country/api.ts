import { settingsDeleteRequest } from "@/features/settings/api/settingsDeleteRequest"
import { api } from "@/lib/api"

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
