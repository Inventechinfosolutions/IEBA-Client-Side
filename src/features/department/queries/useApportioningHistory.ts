import { useQuery } from "@tanstack/react-query"
import { getApportioningHistory } from "../api/departments"

export function useApportioningHistory(departmentId?: string, isOpen?: boolean) {
  return useQuery({
    queryKey: ["apportioning-history", departmentId],
    queryFn: () => getApportioningHistory(departmentId!),
    enabled: !!departmentId && isOpen,
  })
}
