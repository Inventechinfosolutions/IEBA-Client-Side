import { useMutation, useQueryClient } from "@tanstack/react-query"

import { payrollKeys } from "../key"
import type { GetPayrollRowsParams } from "../types"
import { deletePayrollRow } from "../api/payrollApi"

type DeleteDisplayedRowsInput = {
  params: GetPayrollRowsParams
  rowIds: readonly (string | number)[]
}

export function useDeletePayrollRows() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ rowIds }: DeleteDisplayedRowsInput) => {
      await Promise.all(rowIds.map((id) => deletePayrollRow(id)))
      return { ok: true as const }
    },
    onSuccess: (_data, input: DeleteDisplayedRowsInput) => {
      queryClient.setQueryData(payrollKeys.rows(input.params), [])
    },
  })
}
