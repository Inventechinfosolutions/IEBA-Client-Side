import { useMutation, useQueryClient } from "@tanstack/react-query"

import { settingsDeleteRequest } from "@/features/settings/api/settingsDeleteRequest"
import { settingsKeys } from "@/features/settings/keys"

async function requestDeleteHoliday(id: number): Promise<void> {
  await settingsDeleteRequest(`/setting/holiday/delete/${id}`)
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: requestDeleteHoliday,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.fiscalYear.all() })
    },
  })
}
