import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { settingsKeys } from "@/features/settings/keys"

export type MasterCodeActivityOption = {
  code: string
  label: string
  masterCodeId?: number
  masterCodeName?: string
}

type MasterCodeActivitiesItem = {
  masterCode: { id: number; name: string }
  activities: Array<{
    code?: string
    name?: string
    id?: number
    displayLabel?: string
  }>
}

function unwrapItems(res: unknown): MasterCodeActivitiesItem[] {
  const root = res as { data?: { items?: unknown[] } | unknown[] }
  const d = root?.data
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const items = (d as { items?: unknown[] }).items
    if (Array.isArray(items)) return items as MasterCodeActivitiesItem[]
  }
  if (Array.isArray(d)) return d as MasterCodeActivitiesItem[]
  return []
}

function formatActivityLabelFallback(
  masterCodeName: string,
  code: string,
  name: string,
): string {
  const prefix = masterCodeName.trim()
  const activityPart = name ? (code ? `${code} ${name}` : name) : code
  return prefix ? `${prefix} - ${activityPart}` : activityPart
}

function mapToActivityOptions(items: MasterCodeActivitiesItem[]): MasterCodeActivityOption[] {
  const seen = new Set<string>()
  const options: MasterCodeActivityOption[] = []
  for (const group of items) {
    const masterCodeName = String(group.masterCode?.name ?? "").trim()
    const masterCodeId = group.masterCode?.id
    for (const act of group.activities ?? []) {
      const code = String(act.code ?? act.id ?? "").trim()
      if (!code || seen.has(code)) continue
      seen.add(code)
      const name = String(act.name ?? "").trim()
      const displayLabel = String(act.displayLabel ?? "").trim()
      options.push({
        code,
        label:
          displayLabel ||
          formatActivityLabelFallback(masterCodeName, code, name),
        masterCodeId,
        masterCodeName: masterCodeName || undefined,
      })
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label))
}

export async function fetchMasterCodeActivities(
  masterCodeIds: number[],
): Promise<MasterCodeActivityOption[]> {
  const ids = [...new Set(masterCodeIds)].filter((id) => id >= 1)
  if (ids.length === 0) return []
  /** Plain commas in the URL (URLSearchParams encodes them as %2C). */
  const qs = `ids=${ids.join(",")}&status=active`
  const res = await api.get<unknown>(`/master-codes/activities?${qs}`)
  return mapToActivityOptions(unwrapItems(res))
}

export function useMasterCodeActivities(
  masterCodeIds: string[],
  enabled: boolean,
) {
  const numericIds = masterCodeIds
    .map((id) => Number(id))
    .filter((n) => Number.isFinite(n) && n >= 1)
  const key = numericIds.slice().sort((a, b) => a - b).join(",")

  return useQuery({
    queryKey: [...settingsKeys.reports.activities(), key] as const,
    queryFn: () => fetchMasterCodeActivities(numericIds),
    enabled: enabled && numericIds.length > 0,
    staleTime: 0,
    gcTime: 5 * 60_000,
  })
}
