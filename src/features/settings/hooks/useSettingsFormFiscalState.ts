import { useMemo, useState } from "react"

import { normalizeFiscalDateToIso } from "@/features/settings/components/FiscalYear/fiscalYearDateUtils"
import type { SettingsFiscalYearUiValue } from "@/features/settings/components/FiscalYear/types"
import { useListFiscalYears } from "@/features/settings/queries/listFiscalYears"
import type { SettingsFormDerivedFiscalYear, SettingsFormValues } from "@/features/settings/types"

export function useSettingsFormFiscalState(): {
  derivedFiscalYear: SettingsFormDerivedFiscalYear
  fiscalYearUi: SettingsFiscalYearUiValue
} {
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string | undefined>(undefined)
  const fiscalYearsQuery = useListFiscalYears()

  const fiscalYearsComplete = useMemo(() => {
    const rows = fiscalYearsQuery.data ?? []
    return rows.filter((r) => r.start.trim() && r.end.trim())
  }, [fiscalYearsQuery.data])

  const derivedFiscalYear = useMemo((): SettingsFormDerivedFiscalYear => {
    if (fiscalYearsComplete.length === 0) {
      return {
        fiscalYearStartMonth: "",
        fiscalYearEndMonth: "",
        year: "",
        appliedYearRanges: [],
        holidays: [] as SettingsFormValues["fiscalYear"]["holidays"],
      }
    }
    const sorted = [...fiscalYearsComplete].sort((a, b) => a.id.localeCompare(b.id))
    const effectiveId =
      selectedFiscalYearId && sorted.some((x) => x.id === selectedFiscalYearId)
        ? selectedFiscalYearId
        : sorted[sorted.length - 1]!.id
    const row = sorted.find((x) => x.id === effectiveId)!
    return {
      fiscalYearStartMonth: normalizeFiscalDateToIso(row.start),
      fiscalYearEndMonth: normalizeFiscalDateToIso(row.end),
      year: effectiveId,
      appliedYearRanges: sorted.map((x) => x.id),
      holidays: [] as SettingsFormValues["fiscalYear"]["holidays"],
    }
  }, [fiscalYearsComplete, selectedFiscalYearId])

  const fiscalYearUi = useMemo(
    (): SettingsFiscalYearUiValue => ({
      fiscalYears: fiscalYearsComplete,
      selectedFiscalYearId,
      setSelectedFiscalYearId,
      isFiscalYearsPending: fiscalYearsQuery.isPending,
    }),
    [fiscalYearsComplete, selectedFiscalYearId, fiscalYearsQuery.isPending],
  )

  return { derivedFiscalYear, fiscalYearUi }
}
