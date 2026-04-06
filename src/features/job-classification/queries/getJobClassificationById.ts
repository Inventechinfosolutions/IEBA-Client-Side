import { useQuery } from "@tanstack/react-query"

import { jobClassificationKeys } from "../keys"
import { getJobClassificationById } from "../api/jobclassification"

export function useGetJobClassificationById(id: string | null) {
  return useQuery({
    queryKey: id ? jobClassificationKeys.detail(id) : jobClassificationKeys.details(),
    queryFn: () => {
      if (!id) return Promise.reject(new Error("Missing job classification id"))
      return getJobClassificationById(id)
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  })
}

