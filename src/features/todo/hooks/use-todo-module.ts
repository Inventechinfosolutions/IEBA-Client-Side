import { useCreateTodo } from "../mutations/create-todo"
import { useUpdateTodo } from "../mutations/update-todo"
import { useGetTodos } from "../queries/queries"
import type { GetTodosParams } from "../types"

export function useTodoModule(params: GetTodosParams) {
  const query = useGetTodos(params)
  const createMutation = useCreateTodo()
  const updateMutation = useUpdateTodo()

  return {
    rows: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createTodo: createMutation.mutate,
    createTodoAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateTodo: updateMutation.mutate,
    updateTodoAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
