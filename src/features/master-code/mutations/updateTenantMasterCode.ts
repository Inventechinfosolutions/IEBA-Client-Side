import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiUpdateTenantMasterCode } from "../api"
import { masterCodeKeys } from "../keys"

export function useUpdateTenantMasterCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiUpdateTenantMasterCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...masterCodeKeys.all, "tenant-by-name"] })
    },
  })
}
