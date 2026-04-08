import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

import { fteAllocationKeys } from "../keys"
import type { FiscalYear } from "../types"

function normalizeFiscalYearsPayload(payload: unknown): FiscalYear[] {
  const root =
    payload !== null && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null
  const data = root && "data" in root ? (root as { data?: unknown }).data : payload
  const list = Array.isArray(data) ? data : []

  const out: FiscalYear[] = []
  for (const item of list) {
    if (typeof item === "string") {
      const s = item.trim()
      if (s) out.push({ id: s, label: s })
      continue
    }
    if (item === null || typeof item !== "object") continue
    const o = item as Record<string, unknown>
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
    if (!id || !label) continue
    out.push({ id, label })
  }

  // newest first if it's "YYYY-YYYY" strings
  return out.sort((a, b) => b.label.localeCompare(a.label))
}

async function fetchFiscalYears(): Promise<FiscalYear[]> {
  const res = await api.get<ApiResponseDto<unknown>>("/setting/fiscalyear")
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to load fiscal years")
  }
  return normalizeFiscalYearsPayload(res.data)
}

export function useGetFiscalYears() {
  return useQuery({
    queryKey: fteAllocationKeys.fiscalYears(),
    queryFn: fetchFiscalYears,
  })
}
