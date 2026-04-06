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
  })
}
