import { useQuery } from "@tanstack/react-query"
import { getPayrollSettings } from "../api/payrollApi"
import { payrollKeys } from "../key"

export function usePayrollSettings() {
  return useQuery({
    queryKey: payrollKeys.all,
    queryFn: getPayrollSettings,
  })
}
