import { useQuery } from "@tanstack/react-query"

import type { SettingsFiscalYearRow } from "@/features/settings/components/FiscalYear/types"
import { settingsKeys } from "@/features/settings/keys"
import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object"
}

function normalizeListFiscalYearsPayload(payload: unknown): SettingsFiscalYearRow[] {
  const root = isRecord(payload) ? payload : null
  const data = root && "data" in root ? root.data : payload
  const list = Array.isArray(data) ? data : []

  const out: SettingsFiscalYearRow[] = []
  for (const item of list) {
    if (typeof item === "string") {
      const s = item.trim()
      if (s) out.push({ id: s, label: s, start: "", end: "" })
      continue
    }
    if (!isRecord(item)) continue
    const o = item
    const id =
      typeof o.id === "string"
        ? o.id.trim()
        : typeof o.value === "string"
          ? o.value.trim()
          : ""
    const label =
      typeof o.label === "string"
        ? o.label.trim()
        : typeof o.name === "string"
          ? o.name.trim()
          : typeof o.fiscalyear === "string"
            ? o.fiscalyear.trim()
            : typeof o.fiscalYear === "string"
              ? o.fiscalYear.trim()
              : id
    const start = typeof o.start === "string" ? o.start.trim() : ""
    const end = typeof o.end === "string" ? o.end.trim() : ""
    if (!id || !label) continue
    out.push({ id, label, start, end })
  }

  return out.sort((a, b) => a.id.localeCompare(b.id))
}

export async function fetchListFiscalYears(): Promise<SettingsFiscalYearRow[]> {
  const res = await api.get<ApiResponseDto<unknown>>("/setting/fiscalyear")
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to load fiscal years")
  }
  return normalizeListFiscalYearsPayload(res.data)
}

export function useListFiscalYears() {
  return useQuery({
    queryKey: settingsKeys.fiscalYear.list(),
    queryFn: fetchListFiscalYears,
    staleTime: 30_000,
  })
}
