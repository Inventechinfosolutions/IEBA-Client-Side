import { useQuery } from "@tanstack/react-query"

import { apiGetReportCatalog } from "../api"
import { reportKeys } from "../keys"

export function useGetReportCatalog() {
  return useQuery({
    queryKey: reportKeys.catalog(),
    queryFn: async () => await apiGetReportCatalog(),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
