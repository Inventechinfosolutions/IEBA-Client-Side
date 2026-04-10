import { useQuery } from "@tanstack/react-query"

import { payrollKeys } from "../key"
import { fetchPayrollRows } from "../api/payrollApi"
import type { GetPayrollRowsParams } from "../types"

export function useGetPayrollRows(activeParams: GetPayrollRowsParams | null) {
  return useQuery({
    queryKey:
      activeParams === null
        ? payrollKeys.rowsIdle()
        : payrollKeys.rows(activeParams),
    queryFn: () => {
      if (activeParams === null) throw new Error("No params")
      return fetchPayrollRows(activeParams)
    },
    enabled: activeParams !== null,
  })
}
