import { useQueries } from "@tanstack/react-query"
import { apiGetProgramActivityRelationActivities } from "@/features/program/api"

/**
 * Fetches program-activity relations (assigned activities) for multiple program-department pairs.
 */
export function useGetProgramActivityRelations(
  programQueries: { departmentId: number; programId: string }[],
  enabled = true
) {
  return useQueries({
    queries: programQueries.map((item) => ({
      queryKey: ["programActivityRelation", "activities", item.departmentId, item.programId],
      queryFn: () => apiGetProgramActivityRelationActivities(item.departmentId, item.programId),
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      enabled:
        enabled &&
        Number.isFinite(item.departmentId) &&
        item.departmentId > 0 &&
        String(item.programId ?? "").trim().length > 0,
    })),
  })
}
