import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateMasterCode, type UpdateMasterCodeInput } from "../api"
import { masterCodeKeys } from "../keys"

export function useUpdateMasterCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateMasterCodeInput) => updateMasterCode(input),
    onSuccess: (updatedRow) => {
      queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: masterCodeKeys.detail(updatedRow.id),
      })
    },
  })
}
