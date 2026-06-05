import { useQuery } from "@tanstack/react-query"

import { departmentKeys } from "../keys"
import { api } from "@/lib/api"

/** Users loaded for department contact pickers (real API; kept here so `features/users` can stay mock-only). */
export type DepartmentContactUser = {
  id: string
  name: string
  email: string
  phone: string
  location: string
}

function asString(x: unknown): string {
  return typeof x === "string" ? x : x == null ? "" : String(x)
}

async function fetchDepartmentUsers(): Promise<DepartmentContactUser[]> {
  const qs = new URLSearchParams()
  qs.set("method", "scheduletime")
  qs.set("status", "active")

  const res = await api.get<unknown>(`/users?${qs.toString()}`)
  if (!res || typeof res !== "object") throw new Error("Invalid users response")
  const env = res as Record<string, unknown>
  if (env.success !== true) {
    throw new Error(asString(env.message).trim() || "Failed to load users")
  }

  const data = env.data
  const rows = Array.isArray(data) ? data : []

  const mapped = rows
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null
      const o = item as Record<string, unknown>
      const id = asString(o.id).trim()
      const name =
        asString(o.name).trim() ||
        `${asString(o.firstName).trim()} ${asString(o.lastName).trim()}`.trim()
      return {
        id,
        name,
        email: "",
        phone: "",
        location: "",
      }
    })
    .filter((x): x is DepartmentContactUser => x != null && x.id !== "")

  return mapped.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}

export function useGetDepartmentUsers(enabled = true) {
  return useQuery({
    queryKey: departmentKeys.contactUsers(),
    queryFn: fetchDepartmentUsers,
    enabled,
    staleTime: 5 * 60_000, // Keep fresh for 5 minutes to prevent background refetches on form state changes
    gcTime: 30 * 60_000,   // Keep cache alive for 30 minutes
  })
}
