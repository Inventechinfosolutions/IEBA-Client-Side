import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updatePayrollSettings } from "../api/payrollApi"
import { payrollKeys } from "../key"

export function useUpdatePayrollSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePayrollSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all })
    },
  })
}
