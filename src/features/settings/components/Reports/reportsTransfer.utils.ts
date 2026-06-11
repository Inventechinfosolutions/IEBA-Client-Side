import type {
  MasterCodeActivityTransferItem,
  MasterCodeTransferRow,
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

export function flattenActivityBucketRows(rows: MasterCodeTransferRow[]): ReportsTransferItem[] {
  const items: ReportsTransferItem[] = []
  for (const row of rows) {
    for (const act of row.activities ?? []) {
      const code = String(act.code ?? "").trim()
      if (!code) continue
      items.push({
        id: code,
        name: String(act.displayLabel ?? "").trim() || act.name || code,
        code,
      })
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

/** Assigned = include bucket; unassigned = exclude bucket. */
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
