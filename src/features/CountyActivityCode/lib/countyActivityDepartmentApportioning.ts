import { getAllDepartments } from "@/features/department/api/departments"
import type { Department } from "@/features/department/types"
import type {
  ApiActivityDepartmentResDto,
  ApiActivityNestedDepartmentResDto,
  ApiActivityResDto,
} from "../types"

export type CountyActivityDepartmentLinkMeta = {
  id: number
  apportioning: boolean
  manualApportioning: boolean
  autoApportioning: boolean
}

type DepartmentApportioningSettings = {
  apportioning?: boolean
  autoApportioning?: boolean
  manualApportioning?: boolean
}

export function isDepartmentManualApportioningEnabled(
  departmentName: string,
  manualApportioningByName: Readonly<Record<string, boolean>>,
  deptDto?: { manualApportioning?: boolean },
): boolean {
  const name = departmentName.trim()
  if (name in manualApportioningByName) {
    return manualApportioningByName[name] === true
  }
  return deptDto?.manualApportioning === true
}

export function filterDepartmentNamesToManualApportioning(
  names: string[],
  manualApportioningByName: Readonly<Record<string, boolean>>,
): string[] {
  return names.filter((name) =>
    isDepartmentManualApportioningEnabled(name, manualApportioningByName),
  )
}

export function buildCountyActivityDepartmentLinkMeta(
  departmentId: number,
  settings?: DepartmentApportioningSettings,
): CountyActivityDepartmentLinkMeta {
  return {
    id: departmentId,
    apportioning: settings?.apportioning === true,
    manualApportioning: settings?.manualApportioning === true,
    autoApportioning: settings?.autoApportioning === true,
  }
}

export function enrichCountyActivityDepartmentLinks(
  departmentIds: number[],
  departments: Department[],
): CountyActivityDepartmentLinkMeta[] {
  const deptById = new Map(departments.map((dept) => [Number(dept.id), dept]))
  return departmentIds.map((id) =>
    buildCountyActivityDepartmentLinkMeta(id, deptById.get(id)?.settings),
  )
}

export function partitionDepartmentsByApportioningSupport(departments: Department[]): {
  apportioningNames: string[]
  nonApportioningNames: string[]
} {
  const apportioningNames = departments
    .filter((dept) => dept.settings?.apportioning === true)
    .map((dept) => dept.name.trim())

  const nonApportioningNames = departments
    .filter((dept) => dept.settings?.apportioning !== true)
    .map((dept) => dept.name.trim())

  return { apportioningNames, nonApportioningNames }
}

export function buildDepartmentManualApportioningByNameFromActivity(
  activity: ApiActivityResDto,
): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  const shuttleDepts = [
    ...(activity.assignedDepartments ?? []),
    ...(activity.unassignedDepartments ?? []),
  ]

  for (const dept of shuttleDepts) {
    const name = dept.name.trim()
    if (name && dept.manualApportioning === true) {
      out[name] = true
    }
  }

  for (const link of activity.activityDepartments ?? []) {
    const masterName = link.department?.name?.trim()
    if (masterName && link.department?.manualApportioning === true) {
      out[masterName] = true
    }
    const shuttleMatch = shuttleDepts.find((dept) => dept.id === link.departmentId)
    const name = shuttleMatch?.name?.trim() ?? masterName
    if (name && link.manualApportioning === true) {
      out[name] = true
    }
  }

  return out
}

export function enrichCountyActivityShuttleDepartment(
  dept: ApiActivityNestedDepartmentResDto,
  linkByDeptId: ReadonlyMap<number, ApiActivityDepartmentResDto>,
): ApiActivityNestedDepartmentResDto {
  const link = linkByDeptId.get(dept.id)
  const deptMaster = link?.department

  return {
    ...dept,
    apportioning:
      dept.apportioning ??
      link?.apportioning ??
      deptMaster?.apportioning ??
      false,
    manualApportioning:
      dept.manualApportioning ??
      link?.manualApportioning ??
      deptMaster?.manualApportioning ??
      false,
  }
}

export async function resolveDepartmentsForCountyActivityLinks(
  departmentIds: number[],
  cachedDepartments: Department[],
): Promise<Department[]> {
  const assignedIds = new Set(departmentIds)
  let freshDepts = cachedDepartments.filter((dept) => assignedIds.has(Number(dept.id)))

  if (freshDepts.length < departmentIds.length) {
    const deptsResult = await getAllDepartments({ status: "active" })
    freshDepts = deptsResult.items.filter((dept) => assignedIds.has(Number(dept.id)))
  }

  return freshDepts
}
