import { useQuery } from "@tanstack/react-query"

import { personalTimeStudyKeys } from "../keys"
import type { PersonalTimeStudyRow } from "../types"

/**
 * Placeholder list query — disabled until API exists.
 */
export function useGetPersonalTimeStudy(filters?: { search?: string }) {
  return useQuery({
    queryKey: personalTimeStudyKeys.list(filters),
    queryFn: async (): Promise<PersonalTimeStudyRow[]> => [],
    enabled: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
