import { useMutation, useQueryClient } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

export type UpsertFiscalYearInput = {
  id: string
  start: string
  end: string
}

type FiscalYearApiRow = {
  id: string
  start: string
  end: string
}

async function requestUpsertFiscalYear(input: UpsertFiscalYearInput): Promise<FiscalYearApiRow> {
  const res = await api.put<ApiResponseDto<FiscalYearApiRow>>("/setting/fiscal-year/update", {
    id: input.id.trim(),
    start: input.start.trim(),
    end: input.end.trim(),
  })
  if (!res?.success || res.data == null) {
    throw new Error(res?.message ?? "Failed to save fiscal year")
  }
  return res.data
}

export function useUpsertFiscalYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: requestUpsertFiscalYear,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.fiscalYear.list() })
    },
  })
}
