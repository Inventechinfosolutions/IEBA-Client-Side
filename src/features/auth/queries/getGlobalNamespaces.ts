import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

import { authKeys } from "../keys"

/** Nest `GlobalUserController`: `@Controller("global")` + `@Get("user")` → `/global/user` */
const GLOBAL_NAMESPACE_LIST_PATH =
  (import.meta.env.VITE_GLOBAL_NAMESPACE_LIST_PATH as string | undefined)?.trim() ||
  "/global/user"

/**
 * OTP dropdown query. `""` → namespaces (`global` defaults to `"users"` on the API).
 * e.g. `?global=list&page=1&limit=500` for paginated global user rows (`VITE_GLOBAL_USER_LIST_QUERY_SUFFIX`).
 */
const GLOBAL_USER_LIST_QUERY_SUFFIX =
  (import.meta.env.VITE_GLOBAL_USER_LIST_QUERY_SUFFIX as string | undefined)?.trim() ?? ""
import type { GlobalNamespaceItem } from "../types"

type RawGlobalNamespace = {
  nameSpace?: string
  namespace?: string
  name_space?: string
  countyName?: string
  county_name?: string
}

type GlobalNamespaceListBody = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: unknown
}

function buildListUrl(): string {
  const base = GLOBAL_NAMESPACE_LIST_PATH.startsWith("/")
    ? GLOBAL_NAMESPACE_LIST_PATH
    : `/${GLOBAL_NAMESPACE_LIST_PATH}`
  if (!GLOBAL_USER_LIST_QUERY_SUFFIX) return base
  const q = GLOBAL_USER_LIST_QUERY_SUFFIX.startsWith("?")
    ? GLOBAL_USER_LIST_QUERY_SUFFIX
    : `?${GLOBAL_USER_LIST_QUERY_SUFFIX}`
  return `${base}${q}`
}

const LIST_URL = buildListUrl()

function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return []
  const o = payload as Record<string, unknown>
  const inner = o.data ?? o.items ?? o.records ?? o.results ?? o.rows
  if (Array.isArray(inner)) return inner
  return []
}

function pickLabel(r: Record<string, unknown>): string | null {
  const candidates = [
    r.displayName,
    r.userName,
    r.name,
    r.fullName,
    r.loginId,
    r.login_id,
    r.email,
    r.countyName,
    r.county_name,
    r.nameSpace,
    r.namespace,
  ]
  for (const c of candidates) {
    if (c == null) continue
    const s = String(c).trim()
    if (s) return s
  }
  return null
}

function pickValue(r: Record<string, unknown>): string | null {
  const candidates = [
    r.nameSpace,
    r.namespace,
    r.name_space,
    r.id,
    r.userId,
    r.user_id,
    r.loginId,
    r.login_id,
  ]
  for (const c of candidates) {
    if (c == null) continue
    const s = String(c).trim()
    if (s) return s
  }
  return null
}

function parseItem(raw: unknown): GlobalNamespaceItem | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as RawGlobalNamespace & Record<string, unknown>

  const ns = r.nameSpace ?? r.namespace ?? r.name_space
  const cn = r.countyName ?? r.county_name
  if (ns != null && cn != null) {
    const nameSpace = String(ns).trim()
    const countyName = String(cn).trim()
    if (!nameSpace || !countyName) return null
    return { nameSpace, countyName }
  }

  const value = pickValue(r)
  const label = pickLabel(r)
  if (!value || !label) return null
  return { nameSpace: value, countyName: label }
}

export async function fetchGlobalNamespaces(): Promise<GlobalNamespaceItem[]> {
  const res = await api.get<GlobalNamespaceListBody>(LIST_URL)
  if (res.success === false) {
    throw new Error(res.message ?? "Failed to load users")
  }
  if (typeof res.statusCode === "number" && res.statusCode !== 0) {
    throw new Error(res.message ?? "Failed to load users")
  }
  const rows = extractRows(res.data)
  return rows.map(parseItem).filter((item): item is GlobalNamespaceItem => item != null)
}

export function useGlobalNamespaces(enabled: boolean) {
  return useQuery({
    queryKey: [...authKeys.globalNamespaces(), LIST_URL] as const,
    queryFn: fetchGlobalNamespaces,
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
