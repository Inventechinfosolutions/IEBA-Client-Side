import { useMemo } from "react"

import type { SettingsFiscalYearRow } from "@/features/settings/components/FiscalYear/types"

/** Builds merged year dropdown options from API fiscal years and form `appliedYearRanges`. */
export function useFiscalYearYearOptions(
  fiscalYears: readonly SettingsFiscalYearRow[],
  appliedYearRanges: string[] | undefined,
  selectedYear: string | undefined,
): string[] {
  return useMemo(() => {
    const fromApi = fiscalYears.map((fy) => fy.id)
    const uniqueTail = Array.from(new Set((appliedYearRanges ?? []).filter((r) => Boolean(r?.trim()))))
    const merged = [...fromApi.filter((y) => !uniqueTail.includes(y)), ...uniqueTail]
    if (selectedYear?.trim() && !merged.includes(selectedYear)) return [...merged, selectedYear]
    return merged
  }, [fiscalYears, appliedYearRanges, selectedYear])
}
