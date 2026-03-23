import { useMutation, useQueryClient } from "@tanstack/react-query"

import { countyActivityCodeKeys } from "../keys"
import type { CountyActivityCodeRow } from "../types"
import type { CountyActivityAddFormValues } from "../types"

type UpdateCountyActivityCodeInput = {
  id: string
  values: CountyActivityAddFormValues
}

export function useUpdateCountyActivityCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateCountyActivityCodeInput) => input,
    onSuccess: ({ id, values }) => {
      queryClient.setQueryData<CountyActivityCodeRow[]>(
        countyActivityCodeKeys.lists(),
        (prev) => {
          if (!prev) return prev
          return prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  ...values,
                }
              : row
          )
        }
      )
    },
  })
}

