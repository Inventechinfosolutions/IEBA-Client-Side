import { useQuery } from "@tanstack/react-query"

import { apiGetActivityCodesAllForType } from "@/features/master-code/api"
import { isMasterCodeType } from "@/features/master-code/enums/masterCodeType"
import type { MasterCodeTab } from "@/features/master-code/types"

import { countyActivityCodeKeys } from "../keys"

export function useCountyActivityMasterCodes(codeType: string, enabled: boolean) {
  const typeOk = isMasterCodeType(codeType)

  return useQuery({
    queryKey: [...countyActivityCodeKeys.all, "activityCodes", codeType] as const,
    queryFn: () =>
      apiGetActivityCodesAllForType({
        codeType: codeType as MasterCodeTab,
        inactiveOnly: false,
      }),
    enabled: enabled && typeOk,
    staleTime: 60_000,
  })
}
