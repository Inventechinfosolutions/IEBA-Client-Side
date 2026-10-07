import { queryOptions } from "@tanstack/react-query"

import { fetchInternalReportAccess, fetchPostedRecordsCountOptions } from "./api/postedRecordsCount"
import { internalReportKeys } from "./keys"

const FIVE_MINUTES = 5 * 60 * 1000

export function internalReportAccessQueryOptions() {
  return queryOptions({
    queryKey: internalReportKeys.access(),
    queryFn: fetchInternalReportAccess,
    staleTime: FIVE_MINUTES,
    retry: false,
  })
}

export function postedRecordsCountOptionsQueryOptions() {
  return queryOptions({
    queryKey: internalReportKeys.postedRecordsCountOptions(),
    queryFn: fetchPostedRecordsCountOptions,
    staleTime: FIVE_MINUTES,
  })
}
