import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function capitalize(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**Converts the first letter of each word to uppercase.*/
export function toTitleCase(value: string): string {
  if (!value) return ""
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}
/** Case- and numeric-aware sort for `{ value, label }` dropdown rows. */
export function sortSelectOptionsByLabel<T extends { label: string }>(options: readonly T[]): T[] {
  return [...options].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base", numeric: true }),
  )
}

/** Fiscal year labels/ids like `2025-2026` — newest first for dropdowns. */
export function compareFiscalYearLabelsDesc(a: string, b: string): number {
  return b.localeCompare(a, undefined, { sensitivity: "base", numeric: true })
}

export function sortFiscalYearSelectOptionsByLabel<T extends { label: string }>(
  options: readonly T[],
): T[] {
  return [...options].sort((a, b) => compareFiscalYearLabelsDesc(a.label, b.label))
}

export function sortFiscalYearIdsDesc(ids: readonly string[]): string[] {
  return [...ids].sort(compareFiscalYearLabelsDesc)
}

export function sortFiscalYearRowsByIdDesc<T extends { id: string }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => compareFiscalYearLabelsDesc(a.id, b.id))
}

/** Converts ID/Name rows to select options. */
export function mapIdNameRowsToSelectOptions<T extends { id: string | number; name?: string; label?: string; code?: string }>(
  rows: readonly T[],
) {
  return sortSelectOptionsByLabel(
    [...rows].map((row) => ({
      value: String(row.id),
      label: row.label ?? row.name ?? String(row.id),
    })),
  )
}
