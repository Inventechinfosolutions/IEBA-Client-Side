import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { useAuth } from "@/contexts/AuthContext"
import { todoKeys } from "../keys"
import { apiCreateTodo } from "../api"
import type { CreateTodoInput } from "../types"

async function createTodo(input: CreateTodoInput, userId: string) {
  return await apiCreateTodo({
    title: input.values.title,
    description: input.values.description,
    userId,
    status: input.values.status,
  })
}

export function useCreateTodo() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateTodoInput) => await createTodo(input, user?.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  })
}
