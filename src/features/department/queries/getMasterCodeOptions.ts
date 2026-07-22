import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

async function fetchMasterCodeOptions(): Promise<string[]> {
  const res = await api.get<{ data: string[] }>("/client/master-codes/multicode-options")
  return res.data ?? []
}

export function useGetMasterCodeOptions(enabled = true) {
  return useQuery({
    queryKey: ["master-codes", "options", "allowMultiOnly"],
    queryFn: fetchMasterCodeOptions,
    enabled,
    // Always refetch on mount so different tenants (Trinity/Touloume)
    // don't reuse each other's cached master-code list.
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: 30 * 60_000,
  })
}
