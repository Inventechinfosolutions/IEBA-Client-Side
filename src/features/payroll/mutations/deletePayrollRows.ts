import { useMutation, useQueryClient } from "@tanstack/react-query"

import { payrollKeys } from "../key"
import type { GetPayrollRowsParams } from "../types"

async function dummyDeleteRow(): Promise<{ ok: true }> {
  return new Promise(resolve => setTimeout(() => resolve({ ok: true }), 500))
}

export function useDeletePayrollRows() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dummyDeleteRow,
    onSuccess: (_data, params: GetPayrollRowsParams) => {
      queryClient.setQueryData(payrollKeys.rows(params), [])
    },
  })
}
