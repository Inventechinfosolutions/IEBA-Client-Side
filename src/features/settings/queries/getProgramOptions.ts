import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { settingsKeys } from "@/features/settings/keys"

async function fetchProgramOptions() {
  try {
    const params = new URLSearchParams({
      method: "listtimestudyprogram",
      limit: "200",
      page: "1",
      sort: "ASC",
    })
    const res = await api.get<any>(`/timestudyrecords?${params.toString()}`)
    return res.data?.data ?? []
  } catch (error) {
    console.error("Failed to fetch program options:", error)
    return []
  }
}

export function useProgramOptions() {
  return useQuery({
    queryKey: [...settingsKeys.reports.all(), "programs"],
    queryFn: fetchProgramOptions,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
