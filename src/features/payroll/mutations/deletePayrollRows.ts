import { useMutation, useQueryClient } from "@tanstack/react-query"

import { payrollKeys } from "../payrollKeys"
import { delayMockRequest, MOCK_NETWORK_DELAY_MS } from "../mock"
import type { GetPayrollRowsParams } from "../types"

async function mockDeletePayrollRows(): Promise<{ ok: true }> {
  if (import.meta.env.DEV) await delayMockRequest(MOCK_NETWORK_DELAY_MS)
  return { ok: true }
}

export function useDeletePayrollRows() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: mockDeletePayrollRows,
    onSuccess: (_data, params: GetPayrollRowsParams) => {
      queryClient.setQueryData(payrollKeys.rows(params), [])
    },
  })
}
