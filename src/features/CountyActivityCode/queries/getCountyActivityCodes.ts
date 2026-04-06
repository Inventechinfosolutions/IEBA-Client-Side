import { useQuery, useQueryClient } from "@tanstack/react-query"

import { masterCodeKeys } from "@/features/master-code/keys"

import {
  apiGetCountyActivityCatalogEnrichmentMap,
  apiGetCountyActivityCodeTableRows,
} from "../api/countyActivityApi"
import { countyActivityCodeKeys } from "../keys"

const CATALOG_ENRICHMENT_STALE_MS = 10 * 60_000

export function useGetCountyActivityCodes() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: countyActivityCodeKeys.lists(),
    queryFn: async () => {
      const enrichment = await queryClient.ensureQueryData({
        queryKey: masterCodeKeys.activityCodesCatalogEnrichment(),
        queryFn: apiGetCountyActivityCatalogEnrichmentMap,
        staleTime: CATALOG_ENRICHMENT_STALE_MS,
        gcTime: 30 * 60_000,
      })
      return apiGetCountyActivityCodeTableRows(enrichment)
    },
    
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}
