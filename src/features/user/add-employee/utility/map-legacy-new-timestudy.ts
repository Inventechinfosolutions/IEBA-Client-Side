/**
 * Maps legacy GET …/timestudyprogram/new/programs and …/new/activities
 * into the bundle shapes used by the Add Employee Time Study panel.
 */

import type {
  UserActivitiesOnlyDepartmentBundle,
  UserProgramsActivitiesActivityItem,
  UserProgramsActivitiesAssignedSplit,
  UserProgramsActivitiesDepartmentBundle,
  UserProgramsActivitiesProgramActivitiesBundle,
  UserProgramsActivitiesProgramWithAssignments,
  UserProgramsOnlyDepartmentBundle,
  UserProgramsOnlyProgram,
  UserProgramsOnlyProgramsBundle,
} from "../types"

type LegacyTransferNode = {
  title?: string
  key?: string | number
  code?: string
  assigned?: boolean
  child?: boolean
  subChild?: boolean
  primaryTitle?: string
  secondaryTitle?: string
  assignmentType?: string
  allowMultiCodes?: boolean
  multiCodes?: string
  type?: string
}

type LegacyDeptProgramTree = {
  key?: number | string
  title?: string
  program?: Array<{ children?: LegacyTransferNode[] }>
}

type LegacyDeptActivityTree = {
  key?: number | string
  title?: string
  activity?: Array<{ children?: LegacyTransferNode[] }>
}

type LegacyJobPoolBlock = {
  departmentId?: number
  departmentName?: string
  jobpool?: Array<{
    id?: number
    jobpoolName?: string
    programs?: LegacyTransferNode[]
  }>
}

type LegacyNewProgramsPayload = {
  assignedPrograms?: LegacyDeptProgramTree[]
  unassignedPrograms?: LegacyDeptProgramTree[]
  jobPoolsAssigned?: LegacyJobPoolBlock[]
}

type LegacyNewActivitiesPayload = {
  assignedActivities?: LegacyDeptActivityTree[]
  unassignedActivities?: LegacyDeptActivityTree[]
  jobPoolsAssigned?: LegacyJobPoolBlock[]
}

const EMPTY_ACTIVITY_SPLIT: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem> = {
  assigned: [],
  unassigned: [],
}

function parseDeptId(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw)
  return Number.isFinite(n) && n >= 1 ? n : null
}

function parseEntityIdFromKey(key: unknown, deptId: number): number | null {
  const s = String(key ?? "").trim()
  if (!s) return null
  const exact = s.match(new RegExp(`^${deptId}-(\\d+)$`))
  if (exact) {
    const id = Number(exact[1])
    return Number.isFinite(id) ? id : null
  }
  if (!s.startsWith(`${deptId}-`)) return null
  const tail = s.match(/-(\d+)$/)
  if (!tail) return null
  const id = Number(tail[1])
  return Number.isFinite(id) ? id : null
}

function lastSegmentAfterDelimiter(title: string, delimiter: string): string {
  const parts = title.split(delimiter).map((p) => p.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1]! : title.trim()
}

function parseProgramNode(node: LegacyTransferNode, deptId: number): UserProgramsOnlyProgram | null {
  const id = parseEntityIdFromKey(node.key, deptId)
  if (id == null) return null
  const code = typeof node.code === "string" ? node.code : ""
  let name = typeof node.title === "string" ? node.title.trim() : ""
  let type = "primary"
  const parentId: number | null = null

  if (node.subChild) {
    type = "subprogram"
    name = lastSegmentAfterDelimiter(name, "---")
  } else if (node.child) {
    type = "secondary"
    name = lastSegmentAfterDelimiter(name, "---")
  }

  return {
    id,
    code,
    name,
    departmentId: deptId,
    status: "active",
    type,
    parentId,
    isMultiCode: node.allowMultiCodes === true,
    jobpoolId: null,
    jobpoolName: null,
  }
}

function linkProgramParents(
  programs: UserProgramsOnlyProgram[],
  nodes: LegacyTransferNode[],
  deptId: number,
): UserProgramsOnlyProgram[] {
  const byName = new Map(programs.map((p) => [p.name.trim().toLowerCase(), p]))
  const nodeById = new Map<number, LegacyTransferNode>()
  for (const node of nodes) {
    const id = parseEntityIdFromKey(node.key, deptId)
    if (id != null) nodeById.set(id, node)
  }
  return programs.map((p) => {
    const node = nodeById.get(p.id)
    if (node?.child && node.primaryTitle) {
      const primary = byName.get(node.primaryTitle.trim().toLowerCase())
      if (primary) return { ...p, parentId: primary.id, type: "secondary" }
    }
    if (node?.subChild && node.primaryTitle && node.secondaryTitle) {
      const secondaryName = node.secondaryTitle.trim().toLowerCase()
      const secondary = programs.find(
        (x) => x.type === "secondary" && x.name.trim().toLowerCase() === secondaryName,
      )
      if (secondary) return { ...p, parentId: secondary.id, type: "subprogram" }
    }
    return p
  })
}

function collectProgramNodesFromTrees(
  trees: LegacyDeptProgramTree[] | undefined,
): Map<number, { deptId: number; deptName: string; programs: UserProgramsOnlyProgram[] }> {
  const byDept = new Map<number, { deptId: number; deptName: string; programs: UserProgramsOnlyProgram[] }>()
  for (const tree of trees ?? []) {
    const deptId = parseDeptId(tree.key)
    if (deptId == null) continue
    const deptName = typeof tree.title === "string" ? tree.title.trim() : ""
    const bucket = byDept.get(deptId) ?? { deptId, deptName, programs: [] }
    const children = tree.program?.[0]?.children ?? []
    for (const node of children) {
      const row = parseProgramNode(node, deptId)
      if (row) bucket.programs.push(row)
    }
    bucket.programs = linkProgramParents(bucket.programs, children, deptId)
    byDept.set(deptId, bucket)
  }
  return byDept
}

function mergeProgramDeptMaps(
  assignedMap: Map<number, { deptId: number; deptName: string; programs: UserProgramsOnlyProgram[] }>,
  unassignedMap: Map<number, { deptId: number; deptName: string; programs: UserProgramsOnlyProgram[] }>,
): Map<number, UserProgramsOnlyProgramsBundle & { deptName: string }> {
  const out = new Map<number, UserProgramsOnlyProgramsBundle & { deptName: string }>()
  const allDeptIds = new Set([...assignedMap.keys(), ...unassignedMap.keys()])
  for (const deptId of allDeptIds) {
    const assignedRows = assignedMap.get(deptId)?.programs ?? []
    const assignedIds = new Set(assignedRows.map((p) => p.id))
    const unassignedRows = (unassignedMap.get(deptId)?.programs ?? []).filter((p) => !assignedIds.has(p.id))
    const normal = assignedRows
    out.set(deptId, {
      deptName: assignedMap.get(deptId)?.deptName ?? unassignedMap.get(deptId)?.deptName ?? "",
      assigned: { normal, jobpoolautoassign: [] },
      unassigned: unassignedRows,
    })
  }
  return out
}

function applyJobPoolPrograms(
  bundles: Map<number, UserProgramsOnlyProgramsBundle & { deptName: string }>,
  jobPoolsAssigned: LegacyJobPoolBlock[] | undefined,
): void {
  for (const block of jobPoolsAssigned ?? []) {
    const deptId = parseDeptId(block.departmentId)
    if (deptId == null) continue
    const existing = bundles.get(deptId) ?? {
      deptName: block.departmentName?.trim() ?? "",
      assigned: { normal: [], jobpoolautoassign: [] },
      unassigned: [],
    }
    for (const jp of block.jobpool ?? []) {
      const jobpoolId = typeof jp.id === "number" ? jp.id : Number(jp.id)
      const jobpoolName = typeof jp.jobpoolName === "string" ? jp.jobpoolName.trim() : ""
      for (const node of jp.programs ?? []) {
        const id = parseEntityIdFromKey(node.key, deptId)
        if (id == null) continue
        const row: UserProgramsOnlyProgram = {
          id,
          code: typeof node.code === "string" ? node.code : "",
          name: typeof node.title === "string" ? node.title.trim() : "",
          departmentId: deptId,
          status: "active",
          type: "primary",
          parentId: null,
          isMultiCode: false,
          jobpoolId: Number.isFinite(jobpoolId) ? jobpoolId : null,
          jobpoolName: jobpoolName || null,
        }
        if (!existing.assigned.jobpoolautoassign.some((p) => p.id === row.id)) {
          existing.assigned.jobpoolautoassign.push(row)
        }
      }
    }
    bundles.set(deptId, existing)
  }
}

export function parseLegacyNewProgramsPayload(
  raw: unknown,
  filterDepartmentId?: number,
): UserProgramsOnlyDepartmentBundle[] {
  const payload = (raw ?? {}) as LegacyNewProgramsPayload
  const assignedMap = collectProgramNodesFromTrees(payload.assignedPrograms)
  const unassignedMap = collectProgramNodesFromTrees(payload.unassignedPrograms)
  const merged = mergeProgramDeptMaps(assignedMap, unassignedMap)
  applyJobPoolPrograms(merged, payload.jobPoolsAssigned)

  const out: UserProgramsOnlyDepartmentBundle[] = []
  for (const [deptId, split] of merged) {
    if (
      filterDepartmentId != null &&
      Number.isFinite(filterDepartmentId) &&
      filterDepartmentId >= 1 &&
      deptId !== filterDepartmentId
    ) {
      continue
    }
    out.push({
      departmentId: deptId,
      departmentCode: "",
      departmentName: split.deptName,
      programs: {
        assigned: split.assigned,
        unassigned: split.unassigned,
      },
    })
  }
  return out.sort((a, b) => a.departmentName.localeCompare(b.departmentName))
}

function parseActivityNode(
  node: LegacyTransferNode,
  deptId: number,
): UserProgramsActivitiesActivityItem | null {
  const id = parseEntityIdFromKey(node.key, deptId)
  if (id == null) return null
  let name = typeof node.title === "string" ? node.title.trim() : ""
  if (node.child) {
    name = lastSegmentAfterDelimiter(name, "---")
  }
  return {
    id,
    code: typeof node.code === "string" ? node.code : "",
    name,
    departmentId: deptId,
  }
}

function collectActivitiesFromTrees(
  trees: LegacyDeptActivityTree[] | undefined,
  placement: "assigned" | "unassigned",
): Map<number, UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem> & { deptName: string }> {
  const byDept = new Map<
    number,
    UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem> & { deptName: string }
  >()
  for (const tree of trees ?? []) {
    const deptId = parseDeptId(tree.key)
    if (deptId == null) continue
    const deptName = typeof tree.title === "string" ? tree.title.trim() : ""
    const bucket = byDept.get(deptId) ?? {
      deptName,
      assigned: [] as UserProgramsActivitiesActivityItem[],
      unassigned: [] as UserProgramsActivitiesActivityItem[],
    }
    for (const node of tree.activity?.[0]?.children ?? []) {
      const row = parseActivityNode(node, deptId)
      if (!row) continue
      if (placement === "assigned") {
        bucket.assigned.push(row)
      } else {
        bucket.unassigned.push(row)
      }
    }
    byDept.set(deptId, bucket)
  }
  return byDept
}

export function parseLegacyNewActivitiesPayload(
  raw: unknown,
  filterDepartmentId?: number,
): UserActivitiesOnlyDepartmentBundle[] {
  if (raw === null || raw === undefined) return []
  if (Array.isArray(raw) && raw.length === 0) return []

  const payload = raw as LegacyNewActivitiesPayload
  const assignedByDept = collectActivitiesFromTrees(payload.assignedActivities, "assigned")
  const unassignedByDept = collectActivitiesFromTrees(payload.unassignedActivities, "unassigned")

  const deptIds = new Set([...assignedByDept.keys(), ...unassignedByDept.keys()])
  const out: UserActivitiesOnlyDepartmentBundle[] = []

  const emptyProgramActivities: UserProgramsActivitiesProgramActivitiesBundle = {
    assigned: { normal: [], jobpoolautoassign: [] },
    unassigned: [],
  }

  for (const deptId of deptIds) {
    if (
      filterDepartmentId != null &&
      Number.isFinite(filterDepartmentId) &&
      filterDepartmentId >= 1 &&
      deptId !== filterDepartmentId
    ) {
      continue
    }
    const assigned = assignedByDept.get(deptId)
    const unassigned = unassignedByDept.get(deptId)
    out.push({
      departmentId: deptId,
      departmentCode: "",
      departmentName: assigned?.deptName ?? unassigned?.deptName ?? "",
      programActivities: emptyProgramActivities,
      orphanActivities: {
        assigned: assigned?.assigned ?? [],
        unassigned: unassigned?.unassigned ?? [],
      },
      jobPoolActivities: EMPTY_ACTIVITY_SPLIT,
    })
  }
  return out
}

export function mergeLegacyProgramsAndActivities(
  programsList: UserProgramsOnlyDepartmentBundle[],
  activitiesList: UserActivitiesOnlyDepartmentBundle[],
): UserProgramsActivitiesDepartmentBundle[] {
  const activitiesByDept = new Map(activitiesList.map((b) => [b.departmentId, b]))
  return programsList.map((programsOnly) => {
    const activitiesOnly = activitiesByDept.get(programsOnly.departmentId)
    const programsBundle = programsOnly.programs
    const toProgramWithChildren = (
      p: UserProgramsOnlyProgram,
      children: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem>,
    ): UserProgramsActivitiesProgramWithAssignments => ({
      ...p,
      children,
      jobpoolId: p.jobpoolId ?? null,
      jobpoolName: p.jobpoolName ?? null,
    })

    const mapPrograms = (list: UserProgramsOnlyProgram[]) =>
      list.map((p) =>
        toProgramWithChildren(p, { assigned: [], unassigned: [] }),
      )

    return {
      ...programsOnly,
      programs: {
        assigned: {
          normal: mapPrograms(programsBundle.assigned.normal),
          jobpoolautoassign: mapPrograms(programsBundle.assigned.jobpoolautoassign),
        },
        unassigned: mapPrograms(programsBundle.unassigned),
      },
      orphanActivities: activitiesOnly?.orphanActivities ?? EMPTY_ACTIVITY_SPLIT,
      jobPoolActivities: activitiesOnly?.jobPoolActivities ?? EMPTY_ACTIVITY_SPLIT,
    }
  })
}
