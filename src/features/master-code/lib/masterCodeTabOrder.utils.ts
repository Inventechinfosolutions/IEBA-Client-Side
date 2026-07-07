/** Fixed tab order for Master Code UI (matches backend priority). */
const MASTER_CODE_TAB_PRIORITY = ["FFP", "MAA", "TCM", "INTERNAL", "CDSS"] as const

function priorityIndex(name: string): number {
  const normalized = name.trim().toUpperCase()
  const idx = (MASTER_CODE_TAB_PRIORITY as readonly string[]).indexOf(normalized)
  return idx === -1 ? MASTER_CODE_TAB_PRIORITY.length : idx
}

export function sortMasterCodeTabNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const byPriority = priorityIndex(a) - priorityIndex(b)
    if (byPriority !== 0) return byPriority
    return a.localeCompare(b, undefined, { sensitivity: "base" })
  })
}

export function sortMasterCodeSelectOptions<T extends { label: string }>(options: T[]): T[] {
  return [...options].sort((a, b) => {
    const byPriority = priorityIndex(a.label) - priorityIndex(b.label)
    if (byPriority !== 0) return byPriority
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  })
}
