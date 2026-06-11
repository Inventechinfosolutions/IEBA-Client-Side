import type {
  DepartmentHistoryFieldChange,
  DepartmentHistoryRecord,
  DepartmentHistoryReportItem,
  DepartmentHistorySettingsSnapshot,
} from "../queries/departmentHistory"

export function formatDepartmentHistoryDateTime(value: string | null | undefined): string {
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

export function formatDepartmentHistoryDateShort(value: string | null | undefined): string {
  if (!value?.trim()) return "—"
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return value
  }
}

export function formatDepartmentHistoryEventLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim()
  if (!raw) return "—"
  return raw
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function formatContactIdShort(value: string | null | undefined): string {
  const raw = String(value ?? "").trim()
  if (!raw) return "—"
  if (raw.length <= 12) return raw
  return `${raw.slice(0, 8)}…${raw.slice(-4)}`
}

export function getDepartmentHistoryCodeDisplay(row: DepartmentHistoryRecord): string {
  return String(row.departmentCode ?? row.code ?? "").trim() || "—"
}

export function getDepartmentHistoryNameDisplay(row: DepartmentHistoryRecord): string {
  return String(row.departmentName ?? row.name ?? "").trim() || "—"
}

export function getDepartmentHistoryEventDisplay(row: DepartmentHistoryRecord): string {
  const direct =
    row.departmentEvent ??
    row.department_event ??
    row.event ??
    row.operation ??
    row.changeType
  return formatDepartmentHistoryEventLabel(direct ? String(direct) : "")
}

export function getDepartmentHistoryEffectiveFromDisplay(row: DepartmentHistoryRecord): string {
  const raw = row.effectiveFrom ?? row.effective_from
  return formatDepartmentHistoryDateShort(typeof raw === "string" ? raw : undefined)
}

export function getDepartmentHistoryEffectiveToDisplay(row: DepartmentHistoryRecord): string {
  const raw = row.effectiveTo ?? row.effective_to
  return formatDepartmentHistoryDateShort(typeof raw === "string" ? raw : undefined)
}

export function getDepartmentHistoryCreatedByDisplay(row: DepartmentHistoryRecord): string {
  return (
    String(
      row.createdByUserName ??
        row.createdByName ??
        row.created_by_name ??
        row.createdBy ??
        "",
    ).trim() || "—"
  )
}

export function getDepartmentHistoryUpdatedByDisplay(row: DepartmentHistoryRecord): string {
  return (
    String(
      row.updatedByUserName ??
        row.updatedByName ??
        row.updated_by_name ??
        row.updatedBy ??
        "",
    ).trim() || "—"
  )
}

export function getDepartmentHistoryCreatedAtDisplay(row: DepartmentHistoryRecord): string {
  const raw = row.createdAt ?? row.created_at
  return formatDepartmentHistoryDateTime(typeof raw === "string" ? raw : undefined)
}

export function getDepartmentHistoryUpdatedAtDisplay(row: DepartmentHistoryRecord): string {
  const raw = row.updatedAt ?? row.updated_at
  return formatDepartmentHistoryDateTime(typeof raw === "string" ? raw : undefined)
}

export function formatDepartmentHistoryReportLabel(report: DepartmentHistoryReportItem): string {
  const code = String(report.code ?? "").trim()
  const name = String(report.name ?? "").trim()
  if (code && name) return `${code} — ${name}`
  return code || name || "—"
}

export function getDepartmentHistoryReports(row: DepartmentHistoryRecord): DepartmentHistoryReportItem[] {
  return Array.isArray(row.reports) ? row.reports : []
}

export function getDepartmentHistoryReportsDisplay(row: DepartmentHistoryRecord): string {
  const reports = getDepartmentHistoryReports(row)
  if (reports.length > 0) {
    return reports.map((r) => String(r.code ?? r.name ?? "").trim()).filter(Boolean).join(", ")
  }
  const reportIds = row.settingsSnapshot?.reportIds
  if (Array.isArray(reportIds) && reportIds.length > 0) {
    return reportIds.map(String).join(", ")
  }
  return "—"
}

export const DEPARTMENT_SETTING_LABELS: Record<string, string> = {
  status: "Status",
  isDefault: "Default Department",
  multiCodes: "Multi Codes",
  addresses: "Addresses",
  reportIds: "Report IDs",
  primaryContactId: "Primary Contact",
  secondaryContactId: "Secondary Contact",
  billingContactId: "Billing Contact",
  apportioning: "Apportioning",
  costallocation: "Cost Allocation",
  autoApportioning: "Auto Apportioning",
  manualApportioning: "Manual Apportioning",
  allowUserOrCostpoolDirect: "Allow User/Costpool Direct",
  allowMultiCodes: "Allow Multi Codes",
  startorEndTime: "Remove Start and End Time",
  supportingDoc: "Supporting Document",
  removeAutoFillEndTime: "Remove Auto Fill End Time",
  removeDescriptionActivityNote: "Remove Description/Activity/Note",
  removeDescriptionActivityNoteAnchor: "Remove Description/Activity/Note Anchor",
  removeDescriptionActivityNoteMultiCode: "Remove Description/Activity/Note MultiCode",
  allowActivationStartDateAndEndDate: "Allow Multicode Start/End Date",
  moveSaveSubmitToTop: "Move Save and Submit to Top",
}

const SETTING_TOGGLE_ORDER = [
  "apportioning",
  "costallocation",
  "autoApportioning",
  "manualApportioning",
  "allowUserOrCostpoolDirect",
  "allowMultiCodes",
  "startorEndTime",
  "supportingDoc",
  "removeAutoFillEndTime",
  "removeDescriptionActivityNote",
  "removeDescriptionActivityNoteAnchor",
  "removeDescriptionActivityNoteMultiCode",
  "allowActivationStartDateAndEndDate",
  "moveSaveSubmitToTop",
] as const

const GENERAL_CHANGE_FIELDS = new Set(["status", "multiCodes", "isDefault", "addresses"])
const CONTACT_CHANGE_FIELDS = new Set([
  "primaryContactId",
  "secondaryContactId",
  "billingContactId",
])
const REPORT_CHANGE_FIELDS = new Set(["reportIds"])

function getDepartmentFieldLabel(field: string): string {
  return DEPARTMENT_SETTING_LABELS[field] ?? field
}

function formatDepartmentHistoryFieldValue(field: string, value: unknown): string {
  if (value == null) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (field === "status" && typeof value === "string") {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }
  if (field.endsWith("ContactId") && typeof value === "string") {
    return formatContactIdShort(value)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "None"
    if (field === "addresses") return `${value.length} saved`
    if (field === "reportIds") return value.map(String).join(", ")
    if (field === "multiCodes") return value.map(String).join(", ")
    return value.map(String).join(", ")
  }
  return String(value).trim() || "—"
}

export type DepartmentHistorySnapshotItem = {
  label: string
  value: string
  fullValue?: string
  kind: "text" | "boolean" | "list" | "change"
  enabled?: boolean
  previousValue?: string
  newValue?: string
  previousEnabled?: boolean
  newEnabled?: boolean
}

export type DepartmentHistorySnapshotSection = {
  title: string
  items: DepartmentHistorySnapshotItem[]
}

export function getDepartmentHistorySnapshotSections(
  snapshot: DepartmentHistorySettingsSnapshot | null | undefined,
  options?: { hideReportIds?: boolean },
): DepartmentHistorySnapshotSection[] {
  if (!snapshot || typeof snapshot !== "object") return []

  const sections: DepartmentHistorySnapshotSection[] = []

  const generalItems: DepartmentHistorySnapshotItem[] = []
  if (snapshot.status != null) {
    generalItems.push({
      label: "Status",
      value: String(snapshot.status).charAt(0).toUpperCase() + String(snapshot.status).slice(1),
      kind: "text",
    })
  }
  if (Array.isArray(snapshot.multiCodes) && snapshot.multiCodes.length > 0) {
    generalItems.push({
      label: "Multi Codes",
      value: snapshot.multiCodes.join(", "),
      kind: "list",
    })
  }
  if (snapshot.isDefault === true) {
    generalItems.push({ label: "Default Department", value: "Yes", kind: "boolean", enabled: true })
  }
  if (Array.isArray(snapshot.addresses)) {
    generalItems.push({
      label: "Addresses",
      value: snapshot.addresses.length > 0 ? `${snapshot.addresses.length} saved` : "None",
      kind: "text",
    })
  }
  if (generalItems.length > 0) {
    sections.push({ title: "General", items: generalItems })
  }

  const toggleItems = SETTING_TOGGLE_ORDER.flatMap((key) => {
    const value = snapshot[key]
    if (typeof value !== "boolean") return []
    return [{
      label: getDepartmentFieldLabel(key),
      value: value ? "Yes" : "No",
      kind: "boolean" as const,
      enabled: value,
    }]
  })
  if (toggleItems.length > 0) {
    sections.push({ title: "Department Settings", items: toggleItems })
  }

  const contactItems: DepartmentHistorySnapshotItem[] = []
  const contacts: Array<[string, string | null | undefined]> = [
    ["Primary Contact", snapshot.primaryContactId as string | null | undefined],
    ["Secondary Contact", snapshot.secondaryContactId as string | null | undefined],
    ["Billing Contact", snapshot.billingContactId as string | null | undefined],
  ]
  for (const [label, id] of contacts) {
    const raw = String(id ?? "").trim()
    if (!raw) continue
    contactItems.push({
      label,
      value: formatContactIdShort(raw),
      fullValue: raw,
      kind: "text",
    })
  }
  if (contactItems.length > 0) {
    sections.push({ title: "Contacts", items: contactItems })
  }

  if (!options?.hideReportIds && Array.isArray(snapshot.reportIds) && snapshot.reportIds.length > 0) {
    sections.push({
      title: "Report IDs",
      items: [{
        label: "Mapped report IDs",
        value: snapshot.reportIds.map(String).join(", "),
        kind: "list",
      }],
    })
  }

  return sections
}

function changeToSnapshotItem(change: DepartmentHistoryFieldChange): DepartmentHistorySnapshotItem {
  const { field, previousValue, newValue } = change
  const label = getDepartmentFieldLabel(field)

  if (typeof previousValue === "boolean" || typeof newValue === "boolean") {
    const prev = Boolean(previousValue)
    const next = Boolean(newValue)
    return {
      label,
      value: `${prev ? "Yes" : "No"} → ${next ? "Yes" : "No"}`,
      kind: "change",
      previousValue: prev ? "Yes" : "No",
      newValue: next ? "Yes" : "No",
      previousEnabled: prev,
      newEnabled: next,
    }
  }

  const prevDisplay = formatDepartmentHistoryFieldValue(field, previousValue)
  const nextDisplay = formatDepartmentHistoryFieldValue(field, newValue)
  const fullValue =
    field.endsWith("ContactId")
      ? [String(previousValue ?? ""), String(newValue ?? "")].filter(Boolean).join(" → ")
      : undefined

  return {
    label,
    value: `${prevDisplay} → ${nextDisplay}`,
    fullValue,
    kind: "change",
    previousValue: prevDisplay,
    newValue: nextDisplay,
  }
}

function getDepartmentHistoryChangeSections(
  changes: DepartmentHistoryFieldChange[],
  options?: { hideReportIds?: boolean },
): DepartmentHistorySnapshotSection[] {
  const generalItems: DepartmentHistorySnapshotItem[] = []
  const settingItems: DepartmentHistorySnapshotItem[] = []
  const contactItems: DepartmentHistorySnapshotItem[] = []
  const reportItems: DepartmentHistorySnapshotItem[] = []

  for (const change of changes) {
    const item = changeToSnapshotItem(change)
    if (GENERAL_CHANGE_FIELDS.has(change.field)) {
      generalItems.push(item)
    } else if (CONTACT_CHANGE_FIELDS.has(change.field)) {
      contactItems.push(item)
    } else if (REPORT_CHANGE_FIELDS.has(change.field)) {
      if (!options?.hideReportIds) reportItems.push(item)
    } else {
      settingItems.push(item)
    }
  }

  const sections: DepartmentHistorySnapshotSection[] = []
  if (generalItems.length > 0) sections.push({ title: "General", items: generalItems })
  if (settingItems.length > 0) {
    sections.push({ title: "Department Settings", items: settingItems })
  }
  if (contactItems.length > 0) sections.push({ title: "Contacts", items: contactItems })
  if (reportItems.length > 0) sections.push({ title: "Report IDs", items: reportItems })
  return sections
}

export function getDepartmentHistoryDetailSections(
  row: DepartmentHistoryRecord,
  options?: { hideReportIds?: boolean },
): DepartmentHistorySnapshotSection[] {
  const changes = row.settingsChanges
  if (changes == null) {
    return getDepartmentHistorySnapshotSections(row.settingsSnapshot, options)
  }
  if (changes.length > 0) {
    return getDepartmentHistoryChangeSections(changes, options)
  }
  return []
}

/** @deprecated Use getDepartmentHistorySnapshotSections */
export function getDepartmentHistorySnapshotRows(
  snapshot: DepartmentHistorySettingsSnapshot | null | undefined,
) {
  return getDepartmentHistorySnapshotSections(snapshot).flatMap((section) =>
    section.items.map((item) => ({
      key: `${section.title}-${item.label}`,
      label: item.label,
      value: item.value,
    })),
  )
}
