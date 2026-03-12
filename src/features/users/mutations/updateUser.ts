import { useMutation, useQueryClient } from "@tanstack/react-query"

import { userKeys } from "../keys"
import type { User } from "../queries/getUsers"

type UpdateUserInput = {
  id: string
  name: string
  email: string
}

async function updateUser(input: UpdateUserInput): Promise<User> {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users/${input.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
      }),
    }
  )
  if (!response.ok) {
    throw new Error("Failed to update user")
  }
  const data = await response.json()
  return {
    id: String(data.id),
    name: data.name,
    email: data.email,
  }
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) })
    },
  })
}
