import type { MasterCodeTransferRow } from "@/features/settings/components/Reports/reportsTransfer.api.types"

import type { ReportsTransferItem } from "./reportsTransfer.types"

export function masterCodeRowToTransferItem(row: MasterCodeTransferRow): ReportsTransferItem {
  return { id: String(row.id), name: row.name }
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

/**
 * Update the active picker bucket when moving items between excluded/included panels.
 * - include mode: picker = included; right arrow adds, left arrow removes
 * - exclude mode: picker = excluded; right arrow removes, left arrow adds
 */
export function applyTransferPickerMove(
  mode: "include" | "exclude",
  selectedIds: string[],
  idsToMove: string[],
  direction: "toIncludedPanel" | "toExcludedPanel",
): string[] {
  const moveSet = new Set(idsToMove)
  if (direction === "toIncludedPanel") {
    return mode === "include"
      ? [...new Set([...selectedIds, ...idsToMove])]
      : selectedIds.filter((id) => !moveSet.has(id))
  }
  return mode === "include"
    ? selectedIds.filter((id) => !moveSet.has(id))
    : [...new Set([...selectedIds, ...idsToMove])]
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
