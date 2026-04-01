import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"


import { apiUpdateMasterCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { UpdateMasterCodeInput } from "../types"

export function useUpdateMasterCode() {

  return useMutation({
    mutationFn: async (input: UpdateMasterCodeInput) => await apiUpdateMasterCode(input),
    onSuccess: async (updatedRow, variables) => {
      // Manually update the detail cache to avoid a redundant GET fetch
      queryClient.setQueryData(masterCodeKeys.detail(variables.id), updatedRow)
      
      // Invalidate lists to ensure consistency across the UI
      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
    },
  })
}
