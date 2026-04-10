import { useMutation, useQueryClient } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

export type UpdateHolidayInput = {
  id: number
  date: string
  description: string
  optional: boolean
}

type HolidayApiRow = {
  id: number
  date: string
  description: string
  optional: boolean
}

async function requestUpdateHoliday(input: UpdateHolidayInput): Promise<HolidayApiRow> {
  const res = await api.put<ApiResponseDto<HolidayApiRow>>(
    `/setting/holiday/update/${input.id}`,
    {
      date: input.date.trim(),
      description: input.description.trim(),
      optional: Boolean(input.optional),
    },
  )
  if (!res?.success || res.data == null) {
    throw new Error(res?.message ?? "Failed to update holiday")
  }
  return res.data
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: requestUpdateHoliday,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.fiscalYear.all() })
    },
  })
}
