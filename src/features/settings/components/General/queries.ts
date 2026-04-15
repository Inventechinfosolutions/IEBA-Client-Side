import { useQuery, useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

const STORAGE_KEY = "SCREEN_INACTIVITY_TIME_IN_MIN"

export const generalKeys = {
  all: ["general-settings"] as const,
  inactivityTime: ["general-settings", "inactivity-time"] as const,
}

export function useGetInactivityTime() {
  return useQuery({
    queryKey: generalKeys.inactivityTime,
    queryFn: () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? parseInt(saved, 10) : 120
    },
    staleTime: Infinity,
  })
}

export function useUpdateInactivityTime() {
  return useMutation({
    mutationFn: async (minutes: number) => {
      localStorage.setItem(STORAGE_KEY, String(minutes))
      window.dispatchEvent(new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: String(minutes),
      }))
      return minutes
    },
    onSuccess: (minutes) => {
      queryClient.setQueryData(generalKeys.inactivityTime, minutes)
    },
  })
}
