import { useMemo } from "react"

import type { SettingsFiscalYearRow } from "@/features/settings/components/FiscalYear/types"
import { sortFiscalYearIdsDesc } from "@/lib/utils"

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
    const withSelected =
      selectedYear?.trim() && !merged.includes(selectedYear) ? [...merged, selectedYear] : merged
    return sortFiscalYearIdsDesc(withSelected)
  }, [fiscalYears, appliedYearRanges, selectedYear])
}
