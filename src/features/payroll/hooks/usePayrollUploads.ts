import { useQuery } from "@tanstack/react-query"

import { fetchPayrollUploads } from "../api/payrollApi"
import { payrollKeys } from "../key"

export function usePayrollUploads(page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: payrollKeys.uploads(page, limit),
    queryFn: () => fetchPayrollUploads(page, limit),
    enabled,
  })
}
