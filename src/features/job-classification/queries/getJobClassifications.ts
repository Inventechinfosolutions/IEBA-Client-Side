import { useQuery } from "@tanstack/react-query"

import { jobClassificationKeys } from "../keys"
import { getJobClassifications, getJobClassificationGroupedByDepartment } from "../api/jobclassification"
import type { GetJobClassificationsParams } from "../types"

export function useGetJobClassifications(params: GetJobClassificationsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: jobClassificationKeys.list(params),
    queryFn: () => getJobClassifications(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
    ...options,
  })
}

export function useGetJobClassificationGroupedByDepartment(
  departmentId: number | string | undefined | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...jobClassificationKeys.all, "grouped-by-department", departmentId] as const,
    queryFn: () => getJobClassificationGroupedByDepartment(departmentId!),
    enabled: (options?.enabled ?? true) && !!departmentId,
    staleTime: 0,
    gcTime: 0,
  })
}
