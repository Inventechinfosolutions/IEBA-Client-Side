import type {
  MasterCodeActivityTransferItem,
  MasterCodeTransferRow,
  ReportTransferBucketMode,
} from "@/features/settings/components/Reports/reportsTransfer.api.types"

import type { ReportsTransferItem } from "./reportsTransfer.types"

export function masterCodeRowToTransferItem(row: MasterCodeTransferRow): ReportsTransferItem {
  return { id: String(row.id), name: row.name }
}

export function activityItemsToTransferItems(
  items: MasterCodeActivityTransferItem[],
): ReportsTransferItem[] {
  const mapped: ReportsTransferItem[] = []
  for (const act of items) {
    const code = String(act.code ?? "").trim()
    if (!code) continue
    mapped.push({
      id: code,
      name: String(act.displayLabel ?? "").trim() || act.name || code,
      code,
    })
  }
  return mapped.sort((a, b) => a.name.localeCompare(b.name))
}

export function applyTransferBucketMove(
  assignedIds: string[],
  unassignedIds: string[],
  idsToMove: string[],
  direction: "toAssigned" | "toUnassigned",
): { assignedIds: string[]; unassignedIds: string[] } {
  const moveSet = new Set(idsToMove)
  if (direction === "toAssigned") {
    return {
      assignedIds: [...new Set([...assignedIds, ...idsToMove])],
      unassignedIds: unassignedIds.filter((id) => !moveSet.has(id)),
    }
  }
  return {
    assignedIds: assignedIds.filter((id) => !moveSet.has(id)),
    unassignedIds: [...new Set([...unassignedIds, ...idsToMove])],
  }
}

function uniqActivityCodes(codes: string[]): string[] {
  return [...new Set(codes.map((c) => c.trim()).filter(Boolean))]
}

export type ActivityTransferQueryParams = {
  queryActivityMode: ReportTransferBucketMode
  selectedActivityCodes: string[]
  excludedActivityCodes: string[]
}

export function buildActivityTransferQueryParams(
  activityMode: ReportTransferBucketMode,
  includedActivityCodes: string[],
  excludedActivityCodes: string[],
): ActivityTransferQueryParams {
  const included = uniqActivityCodes(includedActivityCodes)
  const excluded = uniqActivityCodes(excludedActivityCodes)
  const bothExplicit = activityMode === "exclude" && included.length > 0 && excluded.length > 0

  return {
    queryActivityMode: bothExplicit ? "include" : activityMode,
    selectedActivityCodes: activityMode === "exclude" && !bothExplicit ? [] : included,
    excludedActivityCodes: excluded,
  }
}

export function filterReportsTransferItems(
  items: ReportsTransferItem[],
  search: string,
): ReportsTransferItem[] {
  const q = search.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      (item.code ?? "").toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q),
  )
}
