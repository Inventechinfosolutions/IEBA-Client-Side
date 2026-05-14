import type { DepartmentRoleHistoryRecord } from "../queries/departmentRoleHistory"

export function formatDepartmentRoleHistoryDate(value: string | null | undefined): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export function getDepartmentRoleHistoryEffectiveFromDisplay(row: DepartmentRoleHistoryRecord): string {
  const raw = row.effectiveFrom ?? row.effective_from
  return formatDepartmentRoleHistoryDate(typeof raw === "string" ? raw : undefined)
}

export function getDepartmentRoleHistoryEffectiveToDisplay(row: DepartmentRoleHistoryRecord): string {
  const raw = row.effectiveTo ?? row.effective_to
  return formatDepartmentRoleHistoryDate(typeof raw === "string" ? raw : undefined)
}

export function formatDepartmentRoleHistoryDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  try {
    const d = new Date(value)
    return d.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

export function getDepartmentRoleHistoryCreatedByDisplay(row: DepartmentRoleHistoryRecord): string {
  const snake = row.created_by_name
  if (typeof snake === "string" && snake.length > 0) return snake
  if (typeof row.createdByName === "string" && row.createdByName.length > 0) return row.createdByName
  if (typeof row.createdBy === "string" && row.createdBy.length > 0) return row.createdBy
  return "—"
}

export function getDepartmentRoleHistoryUpdatedByDisplay(row: DepartmentRoleHistoryRecord): string {
  const snake = row.updated_by_name
  if (typeof snake === "string" && snake.length > 0) return snake
  if (typeof row.updatedByName === "string" && row.updatedByName.length > 0) return row.updatedByName
  if (typeof row.updatedBy === "string" && row.updatedBy.length > 0) return row.updatedBy
  return "—"
}

export function getDepartmentRoleHistoryCreatedAtDisplay(row: DepartmentRoleHistoryRecord): string {
  const raw = row.createdAt ?? row.created_at
  return formatDepartmentRoleHistoryDateTime(typeof raw === "string" ? raw : undefined)
}

export function getDepartmentRoleHistoryUpdatedAtDisplay(row: DepartmentRoleHistoryRecord): string {
  const raw = row.updatedAt ?? row.updated_at
  return formatDepartmentRoleHistoryDateTime(typeof raw === "string" ? raw : undefined)
}
