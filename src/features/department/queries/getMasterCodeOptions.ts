import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

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
  const res = await api.get<unknown>("/master-codes?page=1&limit=100")
  const items =
    res &&
    typeof res === "object" &&
    Array.isArray((res as { data?: { data?: unknown[] } }).data?.data)
      ? ((res as { data: { data: unknown[] } }).data.data)
      : []

  const unique = new Set<string>()
  for (const item of items) {
    const opt = extractOption(item)
    if (opt) unique.add(opt)
  }

  return [...unique].sort((a, b) => a.localeCompare(b))
}

export function useGetMasterCodeOptions(enabled = true) {
  return useQuery({
    queryKey: ["master-codes", "options"],
    queryFn: fetchMasterCodeOptions,
    enabled,
    // Always refetch on mount so different tenants (Trinity/Touloume)
    // don't reuse each other's cached master-code list.
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: 30 * 60_000,
  })
}

