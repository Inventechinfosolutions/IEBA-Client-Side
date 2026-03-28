import { useQuery } from "@tanstack/react-query"

import { fteAllocationKeys } from "../keys"
import type { FiscalYear } from "../types"

const MOCK_FISCAL_YEARS: FiscalYear[] = [
  { id: "fy-2018-2019", label: "2018-2019" },
  { id: "fy-2019-2020", label: "2019-2020" },
  { id: "fy-2020-2021", label: "2020-2021" },
  { id: "fy-2021-2022", label: "2021-2022" },
  { id: "fy-2022-2023", label: "2022-2023" },
  { id: "fy-2023-2024", label: "2023-2024" },
  { id: "fy-2024-2025", label: "2024-2025" },
  { id: "fy-2025-2026", label: "2025-2026" },
  { id: "fy-2026-2027", label: "2026-2027" },
  { id: "fy-2027-2028", label: "2027-2028" },
]

async function fetchFiscalYears(): Promise<FiscalYear[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_FISCAL_YEARS
}

export function useGetFiscalYears() {
  return useQuery({
    queryKey: fteAllocationKeys.fiscalYears(),
    queryFn: fetchFiscalYears,
  })
}
