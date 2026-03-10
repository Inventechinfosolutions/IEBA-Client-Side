import { useMutation, useQueryClient } from "@tanstack/react-query"

import { userKeys } from "../keys"
import type { User } from "../queries/getUsers"

type CreateUserInput = {
  name: string
  email: string
}

async function createUser(input: CreateUserInput): Promise<User> {
  const response = await fetch("https://jsonplaceholder.typicode.com/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error("Failed to create user")
  }
  const data = await response.json()
  return {
    id: String(data.id),
    name: data.name,
    email: data.email,
  }
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
