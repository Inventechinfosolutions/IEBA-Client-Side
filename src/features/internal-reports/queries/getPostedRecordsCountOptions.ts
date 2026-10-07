import { useQuery } from "@tanstack/react-query"

import { postedRecordsCountOptionsQueryOptions } from "../queryOptions"

export function usePostedRecordsCountOptions(enabled: boolean) {
  return useQuery({ ...postedRecordsCountOptionsQueryOptions(), enabled })
}
