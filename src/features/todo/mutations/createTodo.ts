import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"
import { todoKeys } from "../keys"
import { apiCreateTodo } from "../api"
import type { CreateTodoInput } from "../types"

async function createTodo(input: CreateTodoInput, userId: string) {
  return apiCreateTodo({
    title: input.values.title,
    description: input.values.description,
    userId,
    status: input.values.status,
  })
}

export function useCreateTodo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input, user?.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  })
}
