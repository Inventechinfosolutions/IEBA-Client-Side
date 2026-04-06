import { useQuery } from "@tanstack/react-query"

import { jobClassificationKeys } from "../keys"
import { getJobClassificationUsers } from "../api/jobclassification"
import type { GetJobClassificationUsersBody } from "../api/jobclassification"

export function useGetJobClassificationUsers(body: GetJobClassificationUsersBody | null) {
  return useQuery({
    queryKey: [...jobClassificationKeys.lists(), "users", body],
    queryFn: () => {
      if (!body) return Promise.resolve([])
      return getJobClassificationUsers(body)
    },
    enabled: !!body,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  })
}

