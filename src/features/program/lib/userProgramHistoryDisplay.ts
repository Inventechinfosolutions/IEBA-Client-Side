import type { UserProgramHistoryRecord } from "../queries/userProgramHistory"

export function formatProgramHistoryDate(value: string | null | undefined): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export function getProgramHistoryEffectiveFromDisplay(row: UserProgramHistoryRecord): string {
  const raw = row.effectiveFrom ?? row.effective_from
  return formatProgramHistoryDate(typeof raw === "string" ? raw : undefined)
}

export function getProgramHistoryEffectiveToDisplay(row: UserProgramHistoryRecord): string {
  const raw = row.effectiveTo ?? row.effective_to
  return formatProgramHistoryDate(typeof raw === "string" ? raw : undefined)
}

export function formatProgramHistoryDateTime(value: string | null | undefined): string {
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

export function getProgramHistoryEventDisplay(row: UserProgramHistoryRecord): string {
  const direct =
    row.programEvent ??
    row.operation ??
    row.event ??
    row.program_event ??
    row.changeType
  if (direct) return String(direct)
  if (row.assignmentType) return row.assignmentType
  return "—"
}

export function getProgramHistoryCreatedByDisplay(row: UserProgramHistoryRecord): string {
  const snake = row.created_by_name
  if (typeof snake === "string" && snake.length > 0) return snake
  if (typeof row.createdByName === "string" && row.createdByName.length > 0) return row.createdByName
  if (typeof row.createdBy === "string" && row.createdBy.length > 0) return row.createdBy
  return "—"
}

export function getProgramHistoryUpdatedByDisplay(row: UserProgramHistoryRecord): string {
  const snake = row.updated_by_name
  if (typeof snake === "string" && snake.length > 0) return snake
  if (typeof row.updatedByName === "string" && row.updatedByName.length > 0) return row.updatedByName
  if (typeof row.updatedBy === "string" && row.updatedBy.length > 0) return row.updatedBy
  return "—"
}

export function getProgramHistoryCreatedAtDisplay(row: UserProgramHistoryRecord): string {
  const raw = row.createdAt ?? row.created_at
  return formatProgramHistoryDateTime(raw)
}

export function getProgramHistoryUpdatedAtDisplay(row: UserProgramHistoryRecord): string {
  const raw = row.updatedAt ?? row.updated_at
  return formatProgramHistoryDateTime(raw)
}
