import { useQuery } from "@tanstack/react-query"

import { todoKeys } from "../keys"
import { getMockTodos } from "../mock"
import type { GetTodosParams } from "../types"

export function useGetTodos(params: GetTodosParams) {
  return useQuery({
    queryKey: todoKeys.list(params),
    queryFn: () => getMockTodos(params),
  })
}
