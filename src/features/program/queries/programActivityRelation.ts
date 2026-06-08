import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api } from "@/lib/api"

import {
  apiGetProgramActivityRelationActivities,
  apiGetProgramActivityRelationTimeStudyPrograms,
} from "../api"
import { programActivityRelationKeys } from "../keys"
import type {
  ProgramActivityRelationActivitiesPayload,
  ProgramActivityRelationActivityNode,
  ProgramActivityRelationActivityRoots,
  TransferItem,
} from "../types"

function activityNumericId(node: ProgramActivityRelationActivityNode): string {
  const lastPart = String(node.key ?? "").split("-").at(-1) ?? ""
  const num = Number(lastPart)
  if (!Number.isNaN(num) && num > 0 && Number.isInteger(num)) {
    return String(num)
  }
  return ""
}

/**
 * Collect selectable activity nodes from structured `assignedActivities` / `unassignedActivities`.
 * Walks every root and every `activity[]` shell (not only `roots[0].activity[0]`), then DFS `children`,
 * so leave + PTS match backend trees that nest under a different index than `[0][0]`.
 */
function collectActivityChildren(
  roots: ProgramActivityRelationActivityRoots | undefined,
): ProgramActivityRelationActivityNode[] {
  if (!Array.isArray(roots) || roots.length === 0) return []
  const acc: ProgramActivityRelationActivityNode[] = []
  const seenIds = new Set<string>()

  const visit = (node: ProgramActivityRelationActivityNode | undefined) => {
    if (!node || typeof node !== "object") return
    const id = activityNumericId(node)
    if (id && id !== "NaN" && !seenIds.has(id)) {
      seenIds.add(id)
      acc.push(node)
    }
    if (Array.isArray(node.children)) {
      for (const ch of node.children) {
        visit(ch)
      }
    }
  }

  for (const tree of roots) {
    if (!tree || typeof tree !== "object") continue
    const t = tree as Record<string, unknown>
    const activityArr = (Array.isArray(t.activity)
      ? t.activity
      : Array.isArray(t.activities)
        ? t.activities
        : null) as ProgramActivityRelationActivityNode[] | null
    if (Array.isArray(activityArr) && activityArr.length > 0) {
      for (const shell of activityArr) {
        if (!shell) continue
        visit(shell as ProgramActivityRelationActivityNode)
      }
      continue
    }
    // Some responses omit the `activity` shell and return activity nodes as roots.
    const asNode = tree as ProgramActivityRelationActivityNode
    const keyStr = String(asNode.key ?? "")
    const looksLikeCompositeActivityKey = keyStr.includes("-")
    if (
      looksLikeCompositeActivityKey ||
      (Array.isArray(asNode.children) && asNode.children.length > 0)
    ) {
      visit(asNode)
    }
  }
  return acc
}

function activityNodeToTransferItem(node: ProgramActivityRelationActivityNode): TransferItem {
  return {
    id: activityNumericId(node),
    name: String(node.title ?? ""),
    code: node.code ? String(node.code) : undefined,
    parentId: (node as any).parentId ? String((node as any).parentId) : undefined,
    activityId: (node as any).activityId ? String((node as any).activityId) : undefined,
  }
}

export function mergeProgramActivityRelationTransferItems(
  payload: ProgramActivityRelationActivitiesPayload,
): TransferItem[] {
  const unassignedChildren = collectActivityChildren(payload.unassignedActivities)
  const assignedChildren = collectActivityChildren(payload.assignedActivities)

  const byId = new Map<string, TransferItem>()
  for (const node of unassignedChildren) {
    const item = activityNodeToTransferItem(node)
    if (item.id) byId.set(item.id, item)
  }
  for (const node of assignedChildren) {
    const item = activityNodeToTransferItem(node)
    if (item.id) byId.set(item.id, item)
  }

  const itemsList = Array.from(byId.values())

  // Enrich with isChild, level, parentName
  const enriched = itemsList.map((item) => {
    let parentName = undefined
    let isChild = false
    let level = 0

    if (item.parentId) {
      // Find parent in the list using activityId
      const parent = itemsList.find((x) => x.activityId === item.parentId)
      if (parent) {
        parentName = parent.name
        isChild = true
        level = 1

        let currentParentId = item.parentId
        const visited = new Set<string>([item.activityId || item.id])
        while (currentParentId) {
          if (visited.has(currentParentId)) break
          visited.add(currentParentId)
          const p = itemsList.find((x) => x.activityId === currentParentId)
          if (p && p.parentId) {
            level++
            currentParentId = p.parentId
          } else {
            break
          }
        }
      }
    }

    return {
      ...item,
      isChild,
      level,
      parentName,
    }
  })

  // Sort hierarchically using DFS
  const idMap = new Map<string, typeof enriched[0]>()
  for (const a of enriched) {
    if (a.activityId) {
      idMap.set(a.activityId, a)
    }
  }

  const parentToChildren = new Map<string, typeof enriched[0][]>()
  const roots: typeof enriched[0][] = []

  for (const a of enriched) {
    if (a.parentId && idMap.has(a.parentId)) {
      if (!parentToChildren.has(a.parentId)) {
        parentToChildren.set(a.parentId, [])
      }
      parentToChildren.get(a.parentId)!.push(a)
    } else {
      roots.push(a)
    }
  }

  // Sort roots alphabetically
  roots.sort((x, y) => {
    const xCode = x.code ?? ""
    const yCode = y.code ?? ""
    const xName = xCode ? `(${xCode})${x.name}` : x.name
    const yName = yCode ? `(${yCode})${y.name}` : y.name
    return xName.localeCompare(yName)
  })

  // Sort children alphabetically
  for (const [_, childrenList] of parentToChildren.entries()) {
    childrenList.sort((x, y) => {
      const xCode = x.code ?? ""
      const yCode = y.code ?? ""
      const xName = xCode ? `(${xCode})${x.name}` : x.name
      const yName = yCode ? `(${yCode})${y.name}` : y.name
      return xName.localeCompare(yName)
    })
  }

  const result: TransferItem[] = []
  const visited = new Set<string>()

  function traverse(node: typeof enriched[0]) {
    result.push(node)
    visited.add(node.id)
    const children = parentToChildren.get(node.activityId || node.id) || []
    for (const child of children) {
      if (!visited.has(child.id)) {
        traverse(child)
      }
    }
  }

  for (const root of roots) {
    traverse(root)
  }

  return result
}

export function assignedIdsFromProgramActivityRelationPayload(
  payload: ProgramActivityRelationActivitiesPayload,
): string[] {
  return collectActivityChildren(payload.assignedActivities)
    .map((node) => activityNumericId(node))
    .filter((id) => id.length > 0)
}

export function patchProgramActivityRelationActivitiesOptimistic(
  data: ProgramActivityRelationActivitiesPayload,
  ids: string[],
  direction: "toAssigned" | "toUnassigned",
): ProgramActivityRelationActivitiesPayload {
  const next = structuredClone(data) as ProgramActivityRelationActivitiesPayload
  const uRoots = next.unassignedActivities
  if (!uRoots?.[0]?.activity?.[0]) return next

  let aRoots = next.assignedActivities
  if (!aRoots?.length) {
    next.assignedActivities = structuredClone(uRoots)
    const shell = next.assignedActivities[0].activity?.[0]
    if (shell) shell.children = []
    aRoots = next.assignedActivities
  }

  const uAct = uRoots[0].activity![0]
  const aAct = aRoots![0].activity![0]
  if (!aAct) return next

  uAct.children = uAct.children ?? []
  aAct.children = aAct.children ?? []
  const uChildren = uAct.children
  const aChildren = aAct.children
  const idSet = new Set(ids)

  if (direction === "toAssigned") {
    const moving: ProgramActivityRelationActivityNode[] = []
    const stayU: ProgramActivityRelationActivityNode[] = []
    for (const n of uChildren) {
      if (idSet.has(activityNumericId(n))) {
        moving.push({ ...n, assigned: true })
      } else {
        stayU.push(n)
      }
    }
    uAct.children = stayU
    const seenA = new Set(aChildren.map(activityNumericId))
    for (const n of moving) {
      const id = activityNumericId(n)
      if (id && !seenA.has(id)) {
        aChildren.push(n)
        seenA.add(id)
      }
    }
    aAct.children = aChildren
  } else {
    const moving: ProgramActivityRelationActivityNode[] = []
    const stayA: ProgramActivityRelationActivityNode[] = []
    for (const n of aChildren) {
      if (idSet.has(activityNumericId(n))) {
        moving.push({ ...n, assigned: false })
      } else {
        stayA.push(n)
      }
    }
    aAct.children = stayA
    const seenU = new Set(uChildren.map(activityNumericId))
    for (const n of moving) {
      const id = activityNumericId(n)
      if (id && !seenU.has(id)) {
        uChildren.push(n)
        seenU.add(id)
      }
    }
    uAct.children = uChildren
  }

  return next
}

export function filterProgramActivityRelationItems(
  items: TransferItem[],
  assignedIds: string[],
  search: string,
  wantAssigned: boolean,
): TransferItem[] {
  const idSet = new Set(assignedIds)
  const list = wantAssigned
    ? items.filter((i) => idSet.has(i.id))
    : items.filter((i) => !idSet.has(i.id))
  const q = search.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (i) =>
      i.name.toLowerCase().includes(q) || (i.code ?? "").toLowerCase().includes(q),
  )
}

export function useProgramActivityRelationTimeStudyProgramsQuery(departmentId: number | undefined) {
  return useQuery({
    queryKey: programActivityRelationKeys.timeStudyPrograms(departmentId),
    enabled: typeof departmentId === "number",
    queryFn: () => apiGetProgramActivityRelationTimeStudyPrograms(departmentId!),
    staleTime: 0,
  })
}

export function useProgramActivityRelationActivitiesQuery(
  departmentId: number | undefined,
  programId: number | undefined,
) {
  const enabled = typeof departmentId === "number" && typeof programId === "number"
  return useQuery({
    queryKey: programActivityRelationKeys.activitiesScope(departmentId, programId),
    enabled,
    queryFn: () => apiGetProgramActivityRelationActivities(departmentId!, programId!),
    staleTime: 0,
  })
}

type ProgramActivityRelationMutationsArgs = {
  departmentId: number | undefined
  programId: number | undefined
  activitiesQueryKey: readonly unknown[]
}

export function useProgramActivityRelationMutations({
  departmentId,
  programId,
  activitiesQueryKey,
}: ProgramActivityRelationMutationsArgs) {
  const queryClient = useQueryClient()

  const invalidateActivities = () => {
    void queryClient.invalidateQueries({ queryKey: activitiesQueryKey })
  }

  const assignMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!departmentId || !programId || ids.length === 0) return
      await api.post(`/timestudyprograms/assign-activities-to-program`, {
        departmentId,
        programId,
        activityIds: ids.map((id) => Number(id)),
      })
    },
    onSuccess: () => {
      toast.success("Activities assigned successfully")
      invalidateActivities()
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign activities")
      invalidateActivities()
    },
  })

  const unassignMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!departmentId || !programId || ids.length === 0) return
      await api.post(`/timestudyprograms/unassign-activities-to-programs`, {
        departmentId,
        programId,
        activityIds: ids.map((id) => Number(id)),
      })
    },
    onSuccess: () => {
      toast.success("Activities unassigned successfully")
      invalidateActivities()
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unassign activities")
      invalidateActivities()
    },
  })

  const applyOptimisticTransfer = (idsToTransfer: string[], toAssigned: boolean) => {
    const prev = queryClient.getQueryData<ProgramActivityRelationActivitiesPayload>(activitiesQueryKey)
    if (!prev) return
    queryClient.setQueryData(
      activitiesQueryKey,
      patchProgramActivityRelationActivitiesOptimistic(
        prev,
        idsToTransfer,
        toAssigned ? "toAssigned" : "toUnassigned",
      ),
    )
  }

  return { assignMutation, unassignMutation, applyOptimisticTransfer }
}
