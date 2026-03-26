import { useQuery } from "@tanstack/react-query"

import { profileKeys } from "../keys"
import { delay, mockProfileDetail, MOCK_NETWORK_DELAY_MS } from "../mock"
import type { ProfileDetailData } from "../types"

async function fetchProfileDetail(): Promise<ProfileDetailData> {
  if (import.meta.env.DEV) await delay(MOCK_NETWORK_DELAY_MS)
  // Return a shallow clone so RHF defaultValues are stable.
  return {
    ...mockProfileDetail,
    emergencyContact: { ...mockProfileDetail.emergencyContact },
    onRecords: { ...mockProfileDetail.onRecords },
  }
}

export function useGetProfileDetail() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: fetchProfileDetail,
  })
}

