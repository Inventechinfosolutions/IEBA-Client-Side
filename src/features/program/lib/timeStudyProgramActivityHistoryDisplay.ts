import type {
  TimeStudyProgramActivityHistoryFieldChange,
  TimeStudyProgramActivityHistoryRecord,
  TimeStudyProgramActivityHistorySettingsSnapshot,
} from "../queries/timeStudyProgramActivityHistory"

function formatHistoryDateTime(value: string | null | undefined): string {
  if (!value?.trim()) return "—"
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

function formatEventLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim()
  if (!raw) return "—"
  return raw
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

const FIELD_LABELS: Record<string, string> = {
  departmentId: "Department ID",
  departmentName: "Department",
  programId: "Program ID",
  programCode: "Program Code",
  programName: "Program Name",
  activityId: "Activity ID",
  activityCode: "Activity Code",
  activityName: "Activity Name",
  activities: "Activities",
  status: "Status",
  event: "Event",
  operation: "Operation",
}

function formatListItem(item: unknown): string {
  if (!item || typeof item !== "object") return String(item ?? "").trim()
  const record = item as Record<string, unknown>
  const code = String(record.code ?? "").trim()
  const name = String(record.name ?? "").trim()
  if (code && name) return `${code} — ${name}`
  return code || name || String(record.id ?? "").trim()
}

function emptyValueLabel(field: string): string {
  if (
    field === "activities" ||
    field === "activityCode" ||
    field === "activityName" ||
    field === "activityId"
  ) {
    return "Unassigned"
  }
  return "—"
}

export function formatParHistoryApiValue(field: string, value: unknown): string {
  if (value == null) return emptyValueLabel(field)
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) {
    if (value.length === 0) return emptyValueLabel(field)
    if (field === "activities") {
      const labels = value.map(formatListItem).filter(Boolean)
      return labels.length > 0 ? labels.join(", ") : `${value.length} assigned`
    }
    return value.map(formatListItem).filter(Boolean).join(", ") || `${value.length} saved`
  }
  if (typeof value === "object") return JSON.stringify(value)
  const text = String(value).trim()
  return text || emptyValueLabel(field)
}

export function getParHistoryFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

export type ParHistoryDetailItem = {
  key: string
  label: string
  kind: "text" | "change"
  value?: string
  previousValue?: string
  newValue?: string
  previousEnabled?: boolean
  newEnabled?: boolean
}

export type ParHistoryDetailSection = {
  title: string
  items: ParHistoryDetailItem[]
}

export function getParHistoryDepartmentDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  return String(row.departmentName ?? "").trim() || "—"
}

export function getParHistoryProgramCodeDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  return String(row.programCode ?? "").trim() || "—"
}

export function getParHistoryProgramNameDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  return String(row.programName ?? "").trim() || "—"
}

export function getParHistoryActivityCodeDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  return String(row.activityCode ?? "").trim() || "—"
}

export function getParHistoryActivityNameDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  return String(row.activityName ?? "").trim() || "—"
}

export function getParHistoryEventDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  const direct = row.programEvent ?? row.event ?? row.operation ?? row.changeType
  return formatEventLabel(direct ? String(direct) : "")
}

export function getParHistoryUpdatedByDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  return (
    String(
      row.updatedByName ??
        row.updatedByUserName ??
        row.updatedBy ??
        row.createdByName ??
        row.createdByUserName ??
        row.createdBy ??
        "",
    ).trim() || "—"
  )
}

export function getParHistoryUpdatedAtDisplay(row: TimeStudyProgramActivityHistoryRecord): string {
  const raw = row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at
  return formatHistoryDateTime(typeof raw === "string" ? raw : undefined)
}

function changeToDetailItem(
  change: TimeStudyProgramActivityHistoryFieldChange,
): ParHistoryDetailItem {
  const label = getParHistoryFieldLabel(change.field)
  const prevDisplay = formatParHistoryApiValue(change.field, change.previousValue)
  const nextDisplay = formatParHistoryApiValue(change.field, change.newValue)

  if (typeof change.previousValue === "boolean" || typeof change.newValue === "boolean") {
    const prev = Boolean(change.previousValue)
    const next = Boolean(change.newValue)
    return {
      key: change.field,
      label,
      kind: "change",
      previousValue: prev ? "Yes" : "No",
      newValue: next ? "Yes" : "No",
      previousEnabled: prev,
      newEnabled: next,
    }
  }

  return {
    key: change.field,
    label,
    kind: "change",
    previousValue: prevDisplay,
    newValue: nextDisplay,
  }
}

function snapshotToDetailItem(field: string, value: unknown): ParHistoryDetailItem {
  return {
    key: field,
    label: getParHistoryFieldLabel(field),
    kind: "text",
    value: formatParHistoryApiValue(field, value),
  }
}

function resolveChanges(row: TimeStudyProgramActivityHistoryRecord): TimeStudyProgramActivityHistoryFieldChange[] {
  const candidates = [
    row.settingsChanges,
    row.changes,
    row.activityChanges,
    row.programActivityChanges,
  ]
  for (const list of candidates) {
    if (Array.isArray(list) && list.length > 0) return list
  }
  return []
}

function activityLabel(row: TimeStudyProgramActivityHistoryRecord): string {
  const code = getParHistoryActivityCodeDisplay(row)
  const name = getParHistoryActivityNameDisplay(row)
  if (code !== "—" && name !== "—") return `${code} — ${name}`
  return code !== "—" ? code : name
}

function isUnassignEvent(event: string): boolean {
  const normalized = event.toLowerCase()
  return normalized.includes("unassign") || normalized.includes("remove")
}

function isAssignEvent(event: string): boolean {
  const normalized = event.toLowerCase()
  return normalized.includes("assign") && !isUnassignEvent(event)
}

function inferredChangesFromRow(
  row: TimeStudyProgramActivityHistoryRecord,
): TimeStudyProgramActivityHistoryFieldChange[] {
  const event = getParHistoryEventDisplay(row)
  if (event === "—") return []

  const activity = activityLabel(row)
  if (activity === "—") return []

  if (isUnassignEvent(event)) {
    return [{ field: "activities", previousValue: activity, newValue: null }]
  }
  if (isAssignEvent(event)) {
    return [{ field: "activities", previousValue: null, newValue: activity }]
  }
  return []
}

function groupSnapshot(
  snapshot: TimeStudyProgramActivityHistorySettingsSnapshot,
): ParHistoryDetailSection[] {
  const items: ParHistoryDetailItem[] = []
  for (const [field, value] of Object.entries(snapshot)) {
    if (field === "departmentId" || field === "programId" || field === "activityId") continue
    items.push(snapshotToDetailItem(field, value))
  }
  return items.length > 0 ? [{ title: "General", items }] : []
}

function groupChanges(
  changes: TimeStudyProgramActivityHistoryFieldChange[],
): ParHistoryDetailSection[] {
  const items = changes.map(changeToDetailItem)
  return items.length > 0 ? [{ title: "General", items }] : []
}

export function getParHistoryDetailSections(
  row: TimeStudyProgramActivityHistoryRecord,
): ParHistoryDetailSection[] {
  const changes = resolveChanges(row)
  if (changes.length > 0) return groupChanges(changes)

  const inferred = inferredChangesFromRow(row)
  if (inferred.length > 0) return groupChanges(inferred)

  if (row.settingsSnapshot && typeof row.settingsSnapshot === "object") {
    return groupSnapshot(row.settingsSnapshot)
  }

  return []
}

export function parHistoryRowHasDetail(row: TimeStudyProgramActivityHistoryRecord): boolean {
  return getParHistoryDetailSections(row).length > 0
}
