import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

/** Nest-style envelope from `ApiResponseDto.success(result, …)`. */
type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

type MasterCodeListResponseDto = {
  data: unknown[]
  meta?: { total?: number }
}

function extractOption(item: unknown): string | null {
  if (!item || typeof item !== "object") return null
  const obj = item as Record<string, unknown>
  const candidate =
    (obj.codeType ??
      obj.code_type ??
      obj.type ??
      obj.masterCodeType ??
      obj.master_code_type ??
      obj.code ??
      obj.name) as unknown
  if (candidate == null) return null
  const value = String(candidate).trim()
  return value.length > 0 ? value : null
}

async function fetchMasterCodeOptions(): Promise<string[]> {
  // Backend validates `limit <= 100`
  const res = await api.get<ApiEnvelope<MasterCodeListResponseDto>>("/master-codes?page=1&limit=100")
  const payload = (res?.data ?? res) as MasterCodeListResponseDto
  const items = Array.isArray(payload?.data) ? payload.data : []

  const unique = new Set<string>()
  for (const item of items) {
    const opt = extractOption(item)
    if (opt) unique.add(opt)
  }

  return [...unique].sort((a, b) => a.localeCompare(b))
}

export function useGetMasterCodeOptions() {
  return useQuery({
    queryKey: ["master-codes", "options"],
    queryFn: fetchMasterCodeOptions,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

