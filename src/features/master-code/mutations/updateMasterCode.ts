import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { countyActivityCodeKeys } from "@/features/CountyActivityCode/keys"

import { apiUpdateMasterCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { UpdateMasterCodeInput } from "../types"

export function useUpdateMasterCode() {
  return useMutation({
    mutationFn: (input: UpdateMasterCodeInput) => apiUpdateMasterCode(input),
    onSuccess: async (updatedRow, variables) => {
      queryClient.setQueryData(masterCodeKeys.detail(variables.id), updatedRow)

      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      await queryClient.invalidateQueries({
        queryKey: masterCodeKeys.activityCodesCatalogEnrichment(),
      })
      await queryClient.invalidateQueries({
        queryKey: masterCodeKeys.activityCodesCatalogAll(),
      })
      await queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.lists() })
    },
  })
}
