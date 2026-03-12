import { useQuery } from "@tanstack/react-query"

import { userKeys } from "../keys"
import type { User } from "./getUsers"

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
  if (!response.ok) {
    throw new Error("Failed to fetch user")
  }
  const data = await response.json()
  return {
    id: String(data.id),
    name: data.name,
    email: data.email,
  }
}

export function useGetUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => fetchUser(id!),
    enabled: !!id,
  })
}
