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
/** Converts ID/Name rows to select options. */
export function mapIdNameRowsToSelectOptions<T extends { id: string | number; name?: string; label?: string; code?: string }>(
  rows: readonly T[],
) {
  return [...rows]
    .map((row) => ({ 
      value: String(row.id), 
      label: row.label ?? row.name ?? String(row.id) 
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
}
