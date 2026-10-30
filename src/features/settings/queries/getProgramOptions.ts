import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { settingsKeys } from "@/features/settings/keys"

export type ProgramOption = {
  id: number
  code: string | null
  name: string
}

type ProgramOptionsResponse = {
  data?: {
    items?: ProgramOption[]
    meta?: { totalPages?: number }
  } | null
}

async function fetchProgramOptions(): Promise<ProgramOption[]> {
  const items: ProgramOption[] = []
  const limit = 200
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      method: "listtimestudyprogram",
      limit: String(limit),
      page: String(page),
      sort: "ASC",
      status: "active",
    })
    const response = await api.get<ProgramOptionsResponse>(`/timestudyrecords?${params.toString()}`)
    const pageData = response.data
    if (!pageData || !Array.isArray(pageData.items)) {
      throw new Error("The program lookup returned an invalid response.")
    }

    items.push(...pageData.items)
    if (pageData.meta?.totalPages != null ? page >= pageData.meta.totalPages : pageData.items.length < limit) {
      return items
    }
    page += 1
  }
}

export function useProgramOptions(enabled = true) {
  return useQuery({
    queryKey: [...settingsKeys.reports.all(), "programs"],
    queryFn: fetchProgramOptions,
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
