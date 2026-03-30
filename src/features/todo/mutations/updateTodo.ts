import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"
import { todoKeys } from "../keys"
import { apiUpdateTodo } from "../api"
import type { UpdateTodoInput } from "../types"

async function updateTodo(input: UpdateTodoInput, userId: string) {
  return apiUpdateTodo({
    id: input.id,
    title: input.values.title,
    description: input.values.description,
    userId,
    status: input.values.status,
  })
}

export function useUpdateTodo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateTodoInput) => updateTodo(input, user?.id ?? ""),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) })
    },
  })
}
