import { api } from "@/lib/api"
import { mapMasterCodesResponseToOptions } from "@/features/settings/lib/masterCodeOptions.utils"
import type { MasterCodeSelectOption } from "@/features/settings/lib/masterCodeOptions.utils"

export type ClientMasterCodeListPayload = {
  masterCodes: unknown[]
  selectedIds: number[]
}

function serializeSelectedIds(ids: number[]): string {
  return [...new Set(ids)].filter((id) => Number.isFinite(id) && id >= 1).map(String).join(", ")
}

function unwrapClientMasterCodeList(res: unknown): ClientMasterCodeListPayload {
  if (!res || typeof res !== "object") {
    return { masterCodes: [], selectedIds: [] }
  }
  const data = (res as { data?: ClientMasterCodeListPayload }).data
  return {
    masterCodes: Array.isArray(data?.masterCodes) ? data.masterCodes : [],
    selectedIds: Array.isArray(data?.selectedIds) ? data.selectedIds : [],
  }
}

/** `GET /client/:clientId/master-codes` */
export async function apiGetClientMasterCodes(clientId: number): Promise<{
  options: MasterCodeSelectOption[]
  selectedMasterCodeIds: string
  selectedIds: number[]
}> {
  const res = await api.get<unknown>(`/client/${encodeURIComponent(String(clientId))}/master-codes`)
  const payload = unwrapClientMasterCodeList(res)
  return {
    options: mapMasterCodesResponseToOptions({ data: payload.masterCodes }),
    selectedMasterCodeIds: serializeSelectedIds(payload.selectedIds),
    selectedIds: payload.selectedIds,
  }
}

/** `PUT /client/:clientId/master-codes` */
export async function apiSaveClientMasterCodes(
  clientId: number,
  masterCodeIds: number[],
): Promise<number[]> {
  const res = await api.put<{ data?: number[] }>(
    `/client/${encodeURIComponent(String(clientId))}/master-codes`,
    { masterCodeIds },
  )
  return Array.isArray(res.data) ? res.data : masterCodeIds
}

/** `GET /client/:clientId/master-codes/tabs` — tab names for Master Code page. */
export async function apiGetClientMasterCodeTabs(clientId: number): Promise<string[]> {
  const res = await api.get<{ data?: string[] }>(
    `/client/${encodeURIComponent(String(clientId))}/master-codes/tabs`,
  )
  return Array.isArray(res.data) ? res.data : []
}
