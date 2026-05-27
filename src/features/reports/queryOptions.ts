/** Shared TanStack Query options for Reports — always fetch fresh data. */
export const reportQueryOptions = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: "always" as const,
  refetchOnWindowFocus: "always" as const,
  refetchOnReconnect: true,
}
