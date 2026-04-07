import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

function collectActivityChildren(
  roots: ProgramActivityRelationActivityRoots | undefined,
): ProgramActivityRelationActivityNode[] {
  if (!Array.isArray(roots) || roots.length === 0) return []
  const firstTree = roots[0]
  const activityNode = firstTree?.activity?.[0]
  return Array.isArray(activityNode?.children) ? activityNode.children : []
}

function activityNumericId(node: ProgramActivityRelationActivityNode): string {
  return String(String(node.key ?? "").split("-").at(-1) ?? "")
}

function activityNodeToTransferItem(node: ProgramActivityRelationActivityNode): TransferItem {
  return {
    id: activityNumericId(node),
    name: String(node.title ?? ""),
    code: node.code ? String(node.code) : undefined,
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

  return Array.from(byId.values())
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
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    onSuccess: invalidateActivities,
    onError: invalidateActivities,
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
    onSuccess: invalidateActivities,
    onError: invalidateActivities,
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
