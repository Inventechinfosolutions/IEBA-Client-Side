import { useQuery } from "@tanstack/react-query"

export type SupervisorApportioningDept = {
  id: string
  name: string
  code?: string
}

export type SupervisorApportioningConfig = {
  apportioningRequired: boolean
  autoApportioning?: boolean
  departments: SupervisorApportioningDept[]
}

const userApportioningKeys = {
  config: (userId: string) => ["user", "apportioning-config", userId] as const,
}

/**
 * Supervisor apportioning settings for Personal Time Study.
 * Returns null until a backend endpoint is wired; callers treat null as “not required”.
 */
export function useGetUserApportioningConfig(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: userApportioningKeys.config(userId),
    queryFn: async (): Promise<SupervisorApportioningConfig | null> => null,
    enabled: enabled && userId.length > 0,
    staleTime: 60_000,
  })
}
