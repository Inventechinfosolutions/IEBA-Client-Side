import { useMutation, useQueryClient } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

export type AddHolidayInput = {
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

async function requestAddHoliday(input: AddHolidayInput): Promise<HolidayApiRow> {
  const res = await api.post<ApiResponseDto<HolidayApiRow>>("/setting/holiday/add", {
    date: input.date.trim(),
    description: input.description.trim(),
    optional: Boolean(input.optional),
  })
  if (!res?.success || res.data == null) {
    throw new Error(res?.message ?? "Failed to add holiday")
  }
  return res.data
}

export function useAddHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: requestAddHoliday,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.fiscalYear.all() })
    },
  })
}
