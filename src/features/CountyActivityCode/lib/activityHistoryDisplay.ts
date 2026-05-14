import type { ActivityHistoryRecord } from "../queries/activityHistory"

export function formatActivityHistoryDate(value: string | null | undefined): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export function getActivityHistoryEffectiveFromDisplay(row: ActivityHistoryRecord): string {
  const raw = row.effectiveFrom ?? row.effective_from
  return formatActivityHistoryDate(typeof raw === "string" ? raw : undefined)
}

export function getActivityHistoryEffectiveToDisplay(row: ActivityHistoryRecord): string {
  const raw = row.effectiveTo ?? row.effective_to
  return formatActivityHistoryDate(typeof raw === "string" ? raw : undefined)
}

export function formatActivityHistoryDateTime(value: string | null | undefined): string {
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

export function getActivityHistoryEventDisplay(row: ActivityHistoryRecord): string {
  const direct =
    row.activityEvent ??
    row.operation ??
    row.event ??
    row.activity_event ??
    row.changeType
  if (direct) return String(direct)
  return "—"
}

export function getActivityHistoryCreatedByDisplay(row: ActivityHistoryRecord): string {
  const snake = row.created_by_name
  if (typeof snake === "string" && snake.length > 0) return snake
  if (typeof row.createdByName === "string" && row.createdByName.length > 0) return row.createdByName
  if (typeof row.createdBy === "string" && row.createdBy.length > 0) return row.createdBy
  return "—"
}

export function getActivityHistoryUpdatedByDisplay(row: ActivityHistoryRecord): string {
  const snake = row.updated_by_name
  if (typeof snake === "string" && snake.length > 0) return snake
  if (typeof row.updatedByName === "string" && row.updatedByName.length > 0) return row.updatedByName
  if (typeof row.updatedBy === "string" && row.updatedBy.length > 0) return row.updatedBy
  return "—"
}

export function getActivityHistoryCreatedAtDisplay(row: ActivityHistoryRecord): string {
  const raw = row.createdAt ?? row.created_at
  return formatActivityHistoryDateTime(typeof raw === "string" ? raw : undefined)
}

export function getActivityHistoryUpdatedAtDisplay(row: ActivityHistoryRecord): string {
  const raw = row.updatedAt ?? row.updated_at
  return formatActivityHistoryDateTime(typeof raw === "string" ? raw : undefined)
}
