import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"


import { apiUpdateActivityCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { UpdateMasterCodeInput } from "../types"

export function useUpdateMasterCode() {

  return useMutation({
    mutationFn: (input: UpdateMasterCodeInput) => apiUpdateActivityCode(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.detail(variables.id) })
    },
  })
}
