import { useQuery } from "@tanstack/react-query"

import { payrollKeys } from "../payrollKeys"
import { fetchPayrollRowsMock } from "../mock"
import type { GetPayrollRowsParams } from "../types"

export function useGetPayrollRows(activeParams: GetPayrollRowsParams | null) {
  return useQuery({
    queryKey:
      activeParams === null
        ? payrollKeys.rowsIdle()
        : payrollKeys.rows(activeParams),
    queryFn: () => {
      if (activeParams === null) {
        return Promise.resolve([])
      }
      return fetchPayrollRowsMock(activeParams)
    },
    enabled: activeParams !== null,
  })
}
