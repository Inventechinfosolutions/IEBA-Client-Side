import { useQuery } from "@tanstack/react-query"

import { settingsKeys } from "@/features/settings/keys"
import { ACTIVITY_OPTIONS } from "@/features/settings/constants"
import type { ActivityOption } from "@/features/settings/types"

async function fetchActivityOptions(): Promise<ActivityOption[]> {
  return ACTIVITY_OPTIONS
}

export function useActivityOptions() {
  return useQuery({
    queryKey: settingsKeys.reports.activities(),
    queryFn: fetchActivityOptions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
