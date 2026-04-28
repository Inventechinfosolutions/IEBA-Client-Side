import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { settingsKeys } from "@/features/settings/keys"
import type { ActivityOption } from "@/features/settings/types"

async function fetchActivityOptions(): Promise<ActivityOption[]> {
  try {
    const res = await api.get<any>("/activity-codes?limit=1000&status=active")
    const items = res.data?.data ?? []
    
    // Deduplicate by code since activity codes can have multiple types
    const uniqueMap = new Map<string, ActivityOption>()
    for (const a of items) {
      if (!uniqueMap.has(a.code)) {
        uniqueMap.set(a.code, {
          code: a.code,
          label: a.name,
        })
      }
    }
    
    return Array.from(uniqueMap.values())
  } catch (error) {
    console.error("Failed to fetch activity options:", error)
    return []
  }
}

export function useActivityOptions() {
  return useQuery({
    queryKey: settingsKeys.reports.activities(),
    queryFn: fetchActivityOptions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
