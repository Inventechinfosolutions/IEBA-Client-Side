import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiUpdateActivityCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { UpdateMasterCodeInput } from "../types"

export function useUpdateMasterCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateMasterCodeInput) => apiUpdateActivityCode(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.detail(variables.id) })
    },
  })
}
