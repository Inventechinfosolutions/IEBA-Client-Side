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

type UserListContactItem = {
  type?: unknown
  value?: unknown
  phone?: unknown
  countryCode?: unknown
}

function asString(x: unknown): string {
  return typeof x === "string" ? x : x == null ? "" : String(x)
}

function pickContactValue(
  contacts: UserListContactItem[] | undefined,
  wantedTypes: string[],
): string {
  const list = contacts ?? []
  for (const c of list) {
    const t = asString(c.type).toLowerCase()
    if (!wantedTypes.includes(t)) continue
    const cc = asString(c.countryCode).trim()
    const value = asString(c.value).trim()
    if (value) return cc ? `${cc}${value}` : value
    const phone = asString(c.phone).trim()
    if (phone) return phone
  }
  return ""
}

function mapUserListItemToContactUser(item: unknown): DepartmentContactUser | null {
  if (!item || typeof item !== "object") return null
  const o = item as Record<string, unknown>

  const id = asString(o.id).trim()
  if (!id) return null

  const loginId =
    o.user && typeof o.user === "object"
      ? asString((o.user as Record<string, unknown>).loginId).trim()
      : ""

  const name =
    asString(o.name).trim() ||
    `${asString(o.firstName).trim()} ${asString(o.lastName).trim()}`.trim() ||
    loginId

  const contacts = Array.isArray(o.contacts) ? (o.contacts as UserListContactItem[]) : undefined
  const email = pickContactValue(contacts, ["email"]) || loginId
  let phone = pickContactValue(contacts, ["mobile", "phone"]) || asString(o.phone).trim()
  if (phone && (phone === email || phone.includes("@"))) {
    phone = ""
  }

  const location =
    o.location && typeof o.location === "object"
      ? asString(
          (o.location as Record<string, unknown>).name ??
            (o.location as Record<string, unknown>).locationName,
        ).trim()
      : ""

  return { id, name, email, phone, location }
}

type UsersPageResult = { items: DepartmentContactUser[]; totalItems: number }

async function fetchUsersPage(page: number, limit: number): Promise<UsersPageResult> {
  const qs = new URLSearchParams()
  qs.set("page", String(page))
  qs.set("limit", String(limit))
  qs.set("sort", "ASC")
  qs.set("status", "active")

  const res = await api.get<unknown>(`/users?${qs.toString()}`)
  if (!res || typeof res !== "object") throw new Error("Invalid users response")
  const env = res as Record<string, unknown>
  if (env.success !== true) {
    throw new Error(asString(env.message).trim() || "Failed to load users")
  }

  const data = env.data
  if (!data || typeof data !== "object") throw new Error("Invalid users payload")
  const payload = data as Record<string, unknown>
  const rows = Array.isArray(payload.data) ? payload.data : []
  const meta = payload.meta && typeof payload.meta === "object" ? (payload.meta as Record<string, unknown>) : {}
  const totalItemsRaw = meta.totalItems ?? meta.total ?? meta.itemCount
  const totalItems = Number.isFinite(Number(totalItemsRaw)) ? Number(totalItemsRaw) : rows.length

  const items = rows.map(mapUserListItemToContactUser).filter((x): x is DepartmentContactUser => x != null)
  return { items, totalItems }
}

async function fetchDepartmentUsers(): Promise<DepartmentContactUser[]> {
  const pageSize = 100
  let page = 1
  let totalItems: number | null = null
  const all: DepartmentContactUser[] = []

  while (totalItems == null || all.length < totalItems) {
    const res = await fetchUsersPage(page, pageSize)
    totalItems = res.totalItems
    if (res.items.length === 0) break
    all.push(...res.items)
    page += 1
    if (page > 10_000) break
  }

  return all
}

export function useGetDepartmentUsers() {
  return useQuery({
    queryKey: departmentKeys.contactUsers(),
    queryFn: fetchDepartmentUsers,
  })
}
