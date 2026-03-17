import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createMasterCode, type CreateMasterCodeInput } from "../api"
import { masterCodeKeys } from "../keys"

export function useCreateMasterCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMasterCodeInput) => createMasterCode(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
    },
  })
}
