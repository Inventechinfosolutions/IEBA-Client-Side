import { useQuery } from "@tanstack/react-query"

import { payrollKeys } from "../key"
import { fetchPayrollFilterOptions } from "../api/payrollApi"

export function useGetPayrollFilterOptions() {
  return useQuery({
    queryKey: payrollKeys.filterOptions(),
    queryFn: fetchPayrollFilterOptions,
  })
}
