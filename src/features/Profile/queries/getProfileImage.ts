import { useQuery } from "@tanstack/react-query"

import { getProfileImageObjectUrl } from "../api"
import { profileKeys } from "../keys"

export function useGetProfileImage(userId: string | undefined) {
  const id = userId?.trim() ?? ""
  return useQuery({
    queryKey: profileKeys.profileImage(id),
    queryFn: async () => await getProfileImageObjectUrl(id),
    enabled: id.length > 0,
  })
}

