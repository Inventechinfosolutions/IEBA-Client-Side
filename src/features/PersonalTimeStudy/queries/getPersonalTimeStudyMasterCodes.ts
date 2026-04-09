import { useQuery } from "@tanstack/react-query"

import { personalTimeStudyKeys } from "../keys"

/**
 * Placeholder master-code lookup — disabled until API exists.
 */
export function useGetPersonalTimeStudyMasterCodes() {
  return useQuery({
    queryKey: personalTimeStudyKeys.masterCodes(),
    queryFn: async (): Promise<readonly string[]> => [],
    enabled: false,
  })
}
