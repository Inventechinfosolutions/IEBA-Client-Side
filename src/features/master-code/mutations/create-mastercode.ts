import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"


import { apiCreateActivityCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { CreateMasterCodeInput } from "../types"

export function useCreateMasterCode() {

  return useMutation({
    mutationFn: (input: CreateMasterCodeInput) => apiCreateActivityCode(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
    },
  })
}
