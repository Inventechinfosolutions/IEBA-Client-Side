import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

/**
 * API may return either `{ data: rows[] }` or `{ data: { data: rows[], meta } }` under the success envelope.
 * Matches {@link fetchMulticodeMasterCodes} in add-employee.
 */
function extractMasterCodeListItems(res: unknown): unknown[] {
  if (!res || typeof res !== "object") return []
  const root = res as Record<string, unknown>
  const d = root.data
  if (Array.isArray(d)) return d
  if (d !== null && typeof d === "object") {
    const inner = (d as Record<string, unknown>).data
    if (Array.isArray(inner)) return inner
  }
  return []
}

/** Only master codes flagged for multi-code selection appear in the department dropdown. */
function isEligibleForMultiCodePicker(item: unknown): boolean {
  if (!item || typeof item !== "object") return false
  const o = item as Record<string, unknown>
  // Backend DTO uses `allowMulticode` (see master-code types & add-employee fetch).
  const v =
    o.allowMulticode ??
    o.allowMultiCode ??
    o.allowMultiCodes ??
    o.allow_multicode
  if (typeof v === "boolean") return v
  if (typeof v === "string") return v.toLowerCase() === "true" || v === "1"
  return false
}

function isActiveMasterCodeForPicker(item: unknown): boolean {
  if (!item || typeof item !== "object") return true
  const s = (item as Record<string, unknown>).status
  if (typeof s === "string") {
    const t = s.trim().toLowerCase()
    if (!t) return true
    return t === "active"
  }
  if (typeof s === "boolean") return s
  return true
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
  const res = await api.get<unknown>("/master-codes?page=1&limit=100")
  const items = extractMasterCodeListItems(res)

  const unique = new Set<string>()
  for (const item of items) {
    if (!isActiveMasterCodeForPicker(item)) continue
    if (!isEligibleForMultiCodePicker(item)) continue
    const opt = extractOption(item)
    if (opt) unique.add(opt)
  }

  return [...unique].sort((a, b) => a.localeCompare(b))
}

export function useGetMasterCodeOptions(enabled = true) {
  return useQuery({
    queryKey: ["master-codes", "options", "allowMultiOnly"],
    queryFn: fetchMasterCodeOptions,
    enabled,
    // Always refetch on mount so different tenants (Trinity/Touloume)
    // don't reuse each other's cached master-code list.
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: 30 * 60_000,
  })
}

