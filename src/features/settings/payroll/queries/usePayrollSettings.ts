import { useQuery } from "@tanstack/react-query"
import { getPayrollSettings } from "../api/payrollApi"
import { payrollKeys } from "../key"

export function usePayrollSettings() {
  return useQuery({
    queryKey: payrollKeys.all,
    queryFn: getPayrollSettings,
    // Always refresh when user navigates back to Payroll (or any screen using this hook).
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })
}
