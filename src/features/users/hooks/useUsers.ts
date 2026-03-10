import { useGetUsers } from "../queries/getUsers"
import { useCreateUser } from "../mutations/createUser"

export function useUsers() {
  const usersQuery = useGetUsers()
  const createUserMutation = useCreateUser()

  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    createUser: createUserMutation.mutate,
    createUserAsync: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
    createError: createUserMutation.error,
  }
}
