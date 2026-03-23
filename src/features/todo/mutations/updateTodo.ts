import { useMutation, useQueryClient } from "@tanstack/react-query"

import { todoKeys } from "../keys"
import { updateMockTodo } from "../mock"
import type { UpdateTodoInput } from "../types"

async function updateTodo(input: UpdateTodoInput) {
  return updateMockTodo(input)
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateTodoInput) => updateTodo(input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) })
    },
  })
}
