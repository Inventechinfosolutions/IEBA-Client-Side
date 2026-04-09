import { useQuery } from "@tanstack/react-query"

import { getProfileDetail } from "../api"
import { profileKeys } from "../keys"

export function useGetProfileDetail(userId: string | undefined) {
  const id = userId?.trim() ?? ""
  return useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: async () => await getProfileDetail(id),
    enabled: id.length > 0,
  })
}
