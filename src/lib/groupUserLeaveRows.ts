/**
 * Groups user-leave rows for expandable UI: parent row + multicode children.
 * Supports (1) flat rows with `parentId` pointing at the parent `id`, and/or
 * (2) `multiCodeRecords` on the parent when the API nests children on the parent.
 */

export type UserLeaveMultiCodeFragment = {
  id?: number
  programid?: number | string | null
  activityid?: number | string | null
  programcode?: string
  programname?: string
  activitycode?: string
  activityname?: string
  leaveTotalTime?: number
  requestcomment?: string | null
  supervisorcomment?: string | null
}

export type UserLeaveGroupable = {
  id: number
  parentId?: number | null
  multiCodeRecords?: readonly UserLeaveMultiCodeFragment[] | null
}

export type GroupedUserLeaveRow<T extends UserLeaveGroupable> = {
  parent: T
  children: T[]
}

/**
 * When the API returns multiple rows for the same user + date + start/end without
 * `parentId`, treat the lowest `id` in each slot as parent and assign synthetic
 * `parentId` on the rest so grouping + chevrons work.
 */
export function assignSyntheticParentIdsByTimeSlot<
  T extends {
    id: number
    userId: string
    parentId?: number | null
    startdt: string
    starttime: string
    endtime: string
  },
>(leaves: readonly T[]): T[] {
  if (!leaves.length) return []

  const normalizeTime = (t: string) => {
    const s = String(t ?? "").trim()
    if (s.length >= 5) return s.slice(0, 5)
    return s
  }

  const slotKey = (l: T) =>
    `${l.userId}|${l.startdt}|${normalizeTime(l.starttime)}|${normalizeTime(l.endtime)}`

  const slotFirstParentId = new Map<string, number>()
  for (const l of leaves) {
    const raw = l.parentId
    if (raw != null && Number(raw) > 0) continue
    const key = slotKey(l)
    const prev = slotFirstParentId.get(key)
    if (prev === undefined || l.id < prev) slotFirstParentId.set(key, l.id)
  }

  return leaves.map((l) => {
    const raw = l.parentId
    if (raw != null && Number(raw) > 0) return l
    const key = slotKey(l)
    const anchorId = slotFirstParentId.get(key)
    if (anchorId === undefined || anchorId === l.id) return l
    return { ...l, parentId: anchorId }
  })
}

export function groupUserLeaveRows<T extends UserLeaveGroupable>(
  leaves: readonly T[],
  options?: {
    synthesizeChild?: (parent: T, mc: UserLeaveMultiCodeFragment, index: number) => T
  },
): GroupedUserLeaveRow<T>[] {
  if (!leaves.length) return []

  const list = [...leaves]
  const byId = new Map<number, T>()
  for (const l of list) {
    byId.set(l.id, l)
  }

  const isChildRow = (l: T) => {
    const raw = l.parentId
    if (raw === undefined || raw === null) return false
    const p = Number(raw)
    if (!Number.isFinite(p) || p <= 0) return false
    if (p === l.id) return false
    return byId.has(p)
  }

  const roots = list.filter((l) => !isChildRow(l))
  const synth = options?.synthesizeChild

  return roots.map((parent) => {
    const fromFlat = list.filter((l) => Number(l.parentId) === parent.id && l.id !== parent.id)
    const nested = parent.multiCodeRecords
    const fromNested: T[] = []
    if (nested?.length && synth) {
      nested.forEach((mc, i) => {
        fromNested.push(synth(parent, mc, i))
      })
    }

    const seen = new Set<number>()
    const children: T[] = []
    for (const c of [...fromFlat, ...fromNested]) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      children.push(c)
    }

    return { parent, children }
  })
}
