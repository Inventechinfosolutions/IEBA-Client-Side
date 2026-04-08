import { useQuery } from "@tanstack/react-query"

import { payrollKeys } from "../payrollKeys"
import { fetchPayrollFilterOptionsMock } from "../mock"

export function useGetPayrollFilterOptions() {
  return useQuery({
    queryKey: payrollKeys.filterOptions(),
    queryFn: fetchPayrollFilterOptionsMock,
  })
}
