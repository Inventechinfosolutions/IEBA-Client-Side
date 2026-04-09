import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteCountyLocation } from "@/features/settings/components/Country/api"
import { settingsCountyClientQueryKey } from "@/features/settings/queries/getCountyClient"

export function useDeleteCountyLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (locationId: number) => deleteCountyLocation(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsCountyClientQueryKey })
    },
  })
}
