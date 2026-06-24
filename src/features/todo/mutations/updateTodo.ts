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
    onSuccess: async () => {
      // Invalidate lists so the table reflects the update.
      // Note: we do NOT invalidate the detail key here — that would trigger
      // an unnecessary GET /todos/:id while the modal is still mounted.
      // staleTime:0 on useGetTodoById guarantees fresh data on the next edit open.
      await queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    },
  })
}
