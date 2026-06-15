import { useQuery } from "@tanstack/react-query"
import { todoKeys } from "../keys"
import { apiGetTodos, apiGetTodoById } from "../api"
import type { GetTodosParams } from "../types"

export function useGetTodos(params: GetTodosParams) {
  return useQuery({
    queryKey: todoKeys.list(params),
    queryFn: async () => await apiGetTodos(params),
  })
}

export function useGetTodoById(id: string | undefined) {
  return useQuery({
    queryKey: todoKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required")
      return await apiGetTodoById(id)
    },
    enabled: !!id,
    // Override global staleTime — edit modal must always fetch fresh data.
    // Without this, the global 1-minute staleTime causes React Query to reuse
    // a cached (possibly partial) record and skip the API call on reopen.
    staleTime: 0,
  })
}
