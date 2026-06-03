export type MasterCodeSelectOption = { value: string; label: string }

function extractMasterCodeListItems(res: unknown): unknown[] {
  if (!res || typeof res !== "object") return []
  const root = res as Record<string, unknown>
  const d = root.data
  if (Array.isArray(d)) return d
  if (d !== null && typeof d === "object") {
    const inner = (d as Record<string, unknown>).data
    if (Array.isArray(inner)) return inner
  }
  return []
}

function isActiveMasterCodeRow(item: unknown): boolean {
  if (!item || typeof item !== "object") return true
  const s = (item as Record<string, unknown>).status
  if (typeof s === "string") {
    const t = s.trim().toLowerCase()
    if (!t) return true
    return t === "active"
  }
  if (typeof s === "boolean") return s
  return true
}

function masterCodeLabel(item: Record<string, unknown>): string | null {
  const name = item.name != null ? String(item.name).trim() : ""
  const code = item.code != null ? String(item.code).trim() : ""
  if (name && code) return `${name} (${code})`
  if (name) return name
  if (code) return code
  const type = item.type != null ? String(item.type).trim() : ""
  return type.length > 0 ? type : null
}

function masterCodeValue(item: Record<string, unknown>): string | null {
  const id = item.id != null ? Number(item.id) : NaN
  if (Number.isFinite(id) && id >= 1) return String(id)
  const name = item.name != null ? String(item.name).trim() : ""
  if (name) return name
  return null
}

export function mapMasterCodesResponseToOptions(res: unknown): MasterCodeSelectOption[] {
  const items = extractMasterCodeListItems(res)
  const seen = new Set<string>()
  const options: MasterCodeSelectOption[] = []

  for (const item of items) {
    if (!isActiveMasterCodeRow(item)) continue
    const row = item as Record<string, unknown>
    const value = masterCodeValue(row)
    const label = masterCodeLabel(row)
    if (!value || !label || seen.has(value)) continue
    seen.add(value)
    options.push({ value, label })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label))
}
