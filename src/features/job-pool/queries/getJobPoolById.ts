import { useQuery } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { getJobPoolById } from "../api/jobpool"

export function useGetJobPoolById(id?: string) {
  return useQuery({
    queryKey: jobPoolKeys.detail(id || ""),
    queryFn: () => getJobPoolById(id!),
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 0,
  })
}
