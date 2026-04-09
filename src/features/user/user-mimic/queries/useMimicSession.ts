import { useQuery } from "@tanstack/react-query"

import { mimicKeys } from "../keys"
import { getStoredMimicSession } from "../storage"
import type { MimicSession } from "../types"

export function useMimicSession() {
  return useQuery<MimicSession | null>({
    queryKey: mimicKeys.all,
    queryFn: async () => getStoredMimicSession(),
    initialData: getStoredMimicSession(),
    staleTime: Number.POSITIVE_INFINITY,
  })
}

