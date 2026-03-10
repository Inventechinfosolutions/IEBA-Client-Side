import { useQuery } from "@tanstack/react-query"

import { userKeys } from "../keys"

export type User = {
  id: string
  name: string
  email: string
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("https://jsonplaceholder.typicode.com/users")
  if (!response.ok) {
    throw new Error("Failed to fetch users")
  }
  const data = await response.json()
  return data.map((user: { id: number; name: string; email: string }) => ({
    id: String(user.id),
    name: user.name,
    email: user.email,
  }))
}

export function useGetUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
  })
}
