import { useQuery } from "@tanstack/react-query"

import { apiGetReportCatalog } from "../api"
import { reportKeys } from "../keys"

export function useGetReportCatalog() {
  return useQuery({
    queryKey: reportKeys.catalog(),
    queryFn: async () => await apiGetReportCatalog(),
    staleTime: 0,
    gcTime: 0,
  })
}
