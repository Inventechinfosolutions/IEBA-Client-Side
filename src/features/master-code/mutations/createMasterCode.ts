import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { countyActivityCodeKeys } from "@/features/CountyActivityCode/keys"

import { apiCreateMasterCode } from "../api"
import { masterCodeKeys } from "../keys"
import type { CreateMasterCodeInput } from "../types"

export function useCreateMasterCode() {
  return useMutation({
    mutationFn: (input: CreateMasterCodeInput) => apiCreateMasterCode(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: masterCodeKeys.lists() })
      await queryClient.invalidateQueries({
        queryKey: masterCodeKeys.activityCodesCatalogEnrichment(),
      })
      await queryClient.invalidateQueries({
        queryKey: masterCodeKeys.activityCodesCatalogAll(),
      })
      await queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.lists() })
      // Paginated county table and top-level use their own cache keys — must also be
      // invalidated so rows are rebuilt with the updated enrichment (spmp / match / %).
      await queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
      await queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.topLevel() })
    },
  })
}
