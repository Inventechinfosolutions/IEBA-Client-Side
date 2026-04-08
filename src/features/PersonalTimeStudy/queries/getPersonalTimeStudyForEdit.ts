import { useQuery } from "@tanstack/react-query"

import { personalTimeStudyKeys } from "../keys"

/**
 * Placeholder detail query for edit flows — disabled until API exists.
 */
export function useGetPersonalTimeStudyForEdit(id: string | null) {
  return useQuery({
    queryKey:
      id != null && id !== ""
        ? personalTimeStudyKeys.detail(id)
        : personalTimeStudyKeys.detail("__none__"),
    queryFn: async () => null,
    enabled: false,
  })
}
