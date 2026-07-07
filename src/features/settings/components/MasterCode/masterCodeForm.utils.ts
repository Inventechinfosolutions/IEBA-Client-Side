import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"

/** Normalize multi-select stored value for change detection on save. */
export function normalizeMasterCodeSelection(raw: string | undefined): string {
  return parseMultiSelectStoredValues(raw ?? "")
    .slice()
    .sort()
    .join(",")
}

export function parseMasterCodeIdsFromSelection(raw: string | undefined): number[] {
  return parseMultiSelectStoredValues(raw ?? "")
    .map((value) => Number(value))
    .filter((id) => Number.isFinite(id) && id >= 1)
}
