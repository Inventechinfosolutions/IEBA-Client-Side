import { useMutation, useQueryClient } from "@tanstack/react-query"

import { todoKeys } from "../keys"
import { createMockTodo } from "../mock"
import type { CreateTodoInput } from "../types"

async function createTodo(input: CreateTodoInput) {
  return createMockTodo(input)
}

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  })
}
