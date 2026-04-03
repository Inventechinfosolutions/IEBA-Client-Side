import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"


import { apiCreateMasterCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { CreateMasterCodeInput } from "../types"

export function useCreateMasterCode() {

  return useMutation({
    mutationFn: async (input: CreateMasterCodeInput) => await apiCreateMasterCode(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
    },
  })
}
