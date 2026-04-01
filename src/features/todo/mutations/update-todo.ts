import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/main"

import { useAuth } from "@/contexts/AuthContext"
import { todoKeys } from "../keys"
import { apiUpdateTodo } from "../api"
import type { UpdateTodoInput } from "../types"

async function updateTodo(input: UpdateTodoInput, userId: string) {
  return await apiUpdateTodo({
    id: input.id,
    title: input.values.title,
    description: input.values.description,
    userId,
    status: input.values.status,
  })
}

export function useUpdateTodo() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: UpdateTodoInput) => await updateTodo(input, user?.id ?? ""),
    onSuccess: async (updatedTodo, variables) => {
      // Manually update the detail cache to avoid a redundant GET fetch
      queryClient.setQueryData(todoKeys.detail(variables.id), updatedTodo)
      
      // Invalidate lists to ensure consistency across the UI
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  })
}
