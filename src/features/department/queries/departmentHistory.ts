import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { departmentKeys } from "../keys"

export type DepartmentHistoryReportItem = {
  id?: number | string
  code?: string | null
  name?: string | null
}

export type DepartmentHistorySettingsSnapshot = {
  status?: string
  addresses?: unknown[]
  isDefault?: boolean
  reportIds?: number[]
  multiCodes?: string[]
  apportioning?: boolean
  supportingDoc?: boolean
  costallocation?: boolean
  startorEndTime?: boolean
  allowMultiCodes?: boolean
  autoApportioning?: boolean
  billingContactId?: string | null
  primaryContactId?: string | null
  secondaryContactId?: string | null
  moveSaveSubmitToTop?: boolean
  removeAutoFillEndTime?: boolean
  allowUserOrCostpoolDirect?: boolean
  removeDescriptionActivityNote?: boolean
  allowActivationStartDateAndEndDate?: boolean
  removeDescriptionActivityNoteAnchor?: boolean
  removeDescriptionActivityNoteMultiCode?: boolean
  [key: string]: unknown
}

export type DepartmentHistoryRecord = {
  id: number | string
  departmentId?: number | string | null
  departmentCode?: string | null
  departmentName?: string | null
  departmentEvent?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  settingsSnapshot?: DepartmentHistorySettingsSnapshot | null
  reports?: DepartmentHistoryReportItem[] | null
  code?: string | null
  name?: string | null
  department_event?: string | null
  effective_from?: string | null
  effective_to?: string | null
  event?: string | null
  operation?: string | null
  changeType?: string | null
  createdBy?: string | null
  createdByName?: string | null
  createdByUserName?: string | null
  created_by_name?: string | null
  createdAt?: string | null
  created_at?: string | null
  updatedBy?: string | null
  updatedByName?: string | null
  updatedByUserName?: string | null
  updated_by_name?: string | null
  updatedAt?: string | null
  updated_at?: string | null
}

export type DepartmentHistoryMeta = {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export type DepartmentHistoryResponse = {
  data: DepartmentHistoryRecord[]
  meta: DepartmentHistoryMeta
}

export type DepartmentHistoryParams = {
  page?: number
  limit?: number
  departmentCode?: string
  departmentName?: string
  enabled?: boolean
}

export type DepartmentHistoryByIdParams = {
  departmentId: string
  page?: number
  limit?: number
}

function defaultHistoryMeta(
  items: DepartmentHistoryRecord[],
  page = 1,
  limit = 10,
): DepartmentHistoryMeta {
  const totalItems = items.length
  return {
    totalItems,
    itemCount: items.length,
    itemsPerPage: limit,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    currentPage: page,
  }
}

function unwrapDepartmentHistoryResponse(
  res: unknown,
  page = 1,
  limit = 10,
): DepartmentHistoryResponse {
  const root = res as { data?: unknown }
  const payload = root?.data ?? res

  if (Array.isArray(payload)) {
    return {
      data: payload as DepartmentHistoryRecord[],
      meta: defaultHistoryMeta(payload as DepartmentHistoryRecord[], page, limit),
    }
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Partial<DepartmentHistoryResponse>
    const rows = Array.isArray(obj.data) ? obj.data : []
    return {
      data: rows,
      meta: obj.meta ?? defaultHistoryMeta(rows, page, limit),
    }
  }

  return { data: [], meta: defaultHistoryMeta([], page, limit) }
}

export async function fetchDepartmentHistoryById(
  departmentId: string,
  params: Pick<DepartmentHistoryByIdParams, "page" | "limit"> = {},
): Promise<DepartmentHistoryResponse> {
  const { page = 1, limit = 10 } = params
  const searchParams = new URLSearchParams()
  searchParams.set("page", String(page))
  searchParams.set("limit", String(limit))

  const res = await api.get<unknown>(
    `/departments/history/${encodeURIComponent(departmentId)}?${searchParams.toString()}`,
  )
  return unwrapDepartmentHistoryResponse(res, page, limit)
}

export function useDepartmentHistoryByIdQuery(params: DepartmentHistoryByIdParams) {
  const { departmentId, page = 1, limit = 10 } = params
  const trimmedId = departmentId.trim()

  return useQuery({
    queryKey: departmentKeys.historyById(trimmedId, { page, limit }),
    queryFn: () => fetchDepartmentHistoryById(trimmedId, { page, limit }),
    enabled: trimmedId.length > 0,
    staleTime: 0,
  })
}

export function useDepartmentHistoryQuery(params: DepartmentHistoryParams) {
  const {
    page = 1,
    limit = 10,
    departmentCode = "",
    departmentName = "",
    enabled = true,
  } = params

  return useQuery({
    queryKey: departmentKeys.history({
      page,
      limit,
      departmentCode,
      departmentName,
    }),
    enabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (departmentCode.trim()) searchParams.set("departmentCode", departmentCode.trim())
      if (departmentName.trim()) searchParams.set("departmentName", departmentName.trim())

      const res = await api.get<unknown>(`/departments/history?${searchParams.toString()}`)
      return unwrapDepartmentHistoryResponse(res, page, limit)
    },
    staleTime: 0,
  })
}
