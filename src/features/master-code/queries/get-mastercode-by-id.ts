import { useQuery } from "@tanstack/react-query"

import { apiGetActivityCodeById } from "../api"
import { masterCodeKeys } from "../keys"

export function useGetMasterCodeById(id: string | null) {
  return useQuery({
    queryKey: masterCodeKeys.detail(id || ""),
    queryFn: async () => await apiGetActivityCodeById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
