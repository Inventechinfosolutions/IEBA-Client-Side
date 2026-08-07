import {
  NOTIFICATION_TYPE_LABELS,
  type DepartmentNotificationType,
} from "../api/departmentNotificationConfig"
import { coerceReportVisibilityFlag } from "./departmentReport.utils"
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
  const reports = Array.isArray(row.reports) ? row.reports : []
  const visibilityRows = Array.isArray(row.settingsSnapshot?.reportVisibility)
    ? row.settingsSnapshot.reportVisibility
    : []
  const visibilityById = new Map(
    visibilityRows.map((item) => [Number(item.reportId), item] as const),
  )

  if (reports.length > 0) {
    return reports.map((report) => {
      const visibility = visibilityById.get(Number(report.id))
      if (!visibility && report.visibleToAdmin == null && report.visibleToUser == null) {
        return report
      }
      const visibleToAdmin = coerceReportVisibilityFlag(
        visibility?.visibleToAdmin ?? report.visibleToAdmin,
        true,
      )
      const visibleToUser = coerceReportVisibilityFlag(
        visibility?.visibleToUser ?? report.visibleToUser,
        true,
      )
      return {
        ...report,
        code: report.code ?? visibility?.reportCode ?? null,
        name: report.name ?? visibility?.reportName ?? null,
        visibleToAdmin,
        visibleToUser,
      }
    })
  }

  if (visibilityRows.length === 0) return []

  return visibilityRows.map((item) => ({
    id: item.reportId,
    code: item.reportCode ?? null,
    name: item.reportName ?? null,
    visibleToAdmin: coerceReportVisibilityFlag(item.visibleToAdmin, true),
    visibleToUser: coerceReportVisibilityFlag(item.visibleToUser, true),
  }))
}

export function reportHasAudienceFlags(report: DepartmentHistoryReportItem): boolean {
  return report.visibleToAdmin != null || report.visibleToUser != null
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
  reportVisibility: "Report Admin/User visibility",
  primaryContactId: "Primary Contact",
  secondaryContactId: "Secondary Contact",
  billingContactId: "Billing Contact",
  apportioning: "Apportioning",
  costallocation: "Cost Allocation",
  autoApportioning: "Auto Apportioning",
  manualApportioning: "Manual Apportioning",
  standByCostpool: "Standby Cost Pool",
  apportioningStartDate: "Apportioning Start Date",
  apportioningEndDate: "Apportioning End Date",
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
  notificationConfig: "Notification Settings",
}

const SETTING_TOGGLE_ORDER = [
  "apportioning",
  "costallocation",
  "autoApportioning",
  "manualApportioning",
  "standByCostpool",
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
const REPORT_CHANGE_FIELDS = new Set(["reportIds", "reportConfig", "reportVisibility"])
const NOTIFICATION_CHANGE_FIELDS = new Set(["notificationConfig"])

function formatReportConfigSnapshot(value: unknown): string {
  if (value == null || typeof value !== "object") return "—"
  const cfg = value as {
    reportCode?: string | null
    reportName?: string | null
    type?: string | null
    reportdata?: string | null
  }
  const code = String(cfg.reportCode ?? "").trim()
  const name = String(cfg.reportName ?? "").trim()
  const type = String(cfg.type ?? "").trim()
  const label = [code, name].filter(Boolean).join(" — ") || "Report"
  const dataPreview = cfg.reportdata?.trim()
    ? cfg.reportdata.length > 80
      ? `${cfg.reportdata.slice(0, 80)}…`
      : cfg.reportdata
    : "—"
  return `${label} · ${type || "—"} · ${dataPreview}`
}

function formatReportVisibilityItem(entry: unknown): string {
  if (entry == null || typeof entry !== "object") return "—"
  const item = entry as {
    reportId?: number
    reportCode?: string | null
    reportName?: string | null
    visibleToAdmin?: boolean
    visibleToUser?: boolean
  }
  const code = String(item.reportCode ?? "").trim()
  const name = String(item.reportName ?? "").trim()
  const label = [code, name].filter(Boolean).join(" — ") || `Report ${item.reportId ?? ""}`
  const admin = item.visibleToAdmin ? "Admin" : null
  const user = item.visibleToUser ? "User" : null
  const audience = [admin, user].filter(Boolean).join(" + ") || "Hidden"
  return `${label}: ${audience}`
}

function formatReportVisibilitySnapshot(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "None"
  return value.map(formatReportVisibilityItem).join("\n")
}

function formatOnOff(value: unknown): string {
  if (value === true || value === "On" || value === "on" || value === "Yes" || value === "yes" || value === 1 || value === "1") {
    return "On"
  }
  if (value === false || value === "Off" || value === "off" || value === "No" || value === "no" || value === 0 || value === "0") {
    return "Off"
  }
  return "—"
}

function coerceFlag(value: unknown): boolean | null {
  const label = formatOnOff(value)
  if (label === "On") return true
  if (label === "Off") return false
  return null
}

function formatNotificationTypeLabel(notificationType: unknown): string {
  const key = String(notificationType ?? "").trim()
  if (!key) return "Unknown notification"
  return (
    NOTIFICATION_TYPE_LABELS[key as DepartmentNotificationType] ??
    key
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  )
}

function formatNotificationConfigItem(value: unknown): string {
  if (value == null || typeof value !== "object") return "—"
  const item = value as {
    notificationType?: string | null
    name?: string | null
    emailEnabled?: boolean | null
    inAppEnabled?: boolean | null
    active?: boolean | null
    email?: string | null
    inApp?: string | null
    activeLabel?: string | null
  }
  const typeLabel =
    String(item.name ?? "").trim() || formatNotificationTypeLabel(item.notificationType)
  const email = coerceFlag(item.emailEnabled ?? item.email)
  const inApp = coerceFlag(item.inAppEnabled ?? item.inApp)
  const active = coerceFlag(item.active ?? item.activeLabel)
  return `${typeLabel} — Email: ${formatOnOff(email)}, In-App: ${formatOnOff(inApp)}, Active: ${formatOnOff(active)}`
}

type NotificationConfigFlags = {
  notificationType: string
  emailEnabled?: boolean | null
  inAppEnabled?: boolean | null
  active?: boolean | null
}

function normalizeNotificationConfigList(value: unknown): NotificationConfigFlags[] {
  if (!Array.isArray(value)) {
    if (value != null && typeof value === "object") {
      const normalized = normalizeNotificationConfigEntry(value)
      return normalized ? [normalized] : []
    }
    return []
  }
  return value.flatMap((entry) => {
    const normalized = normalizeNotificationConfigEntry(entry)
    return normalized ? [normalized] : []
  })
}

function normalizeNotificationConfigEntry(entry: unknown): NotificationConfigFlags | null {
  if (entry == null || typeof entry !== "object") return null
  const item = entry as Record<string, unknown>

  // Prefer real notificationType; fall back to name when backend sent display rows.
  let type = String(item.notificationType ?? "").trim()
  if (!type) {
    const name = String(item.name ?? item.code ?? "").trim()
    // Ignore "Label — Email" toggle-only rows without a real type.
    if (name && !name.includes(" — ")) {
      const matched = (Object.keys(NOTIFICATION_TYPE_LABELS) as DepartmentNotificationType[]).find(
        (key) => NOTIFICATION_TYPE_LABELS[key] === name,
      )
      type = matched ?? name
    }
  }
  if (!type) return null

  return {
    notificationType: type,
    emailEnabled: coerceFlag(item.emailEnabled ?? item.email),
    inAppEnabled: coerceFlag(item.inAppEnabled ?? item.inApp),
    active: coerceFlag(item.active ?? item.activeLabel),
  }
}

function notificationFlagsEqual(a?: NotificationConfigFlags, b?: NotificationConfigFlags): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    Boolean(a.emailEnabled) === Boolean(b.emailEnabled) &&
    Boolean(a.inAppEnabled) === Boolean(b.inAppEnabled) &&
    Boolean(a.active) === Boolean(b.active)
  )
}

function formatNotificationFlagsOnly(item: NotificationConfigFlags | undefined): string {
  if (!item) return "—"
  return `Email: ${formatOnOff(item.emailEnabled)}, In-App: ${formatOnOff(item.inAppEnabled)}, Active: ${formatOnOff(item.active)}`
}

type NotificationToggleKey = "emailEnabled" | "inAppEnabled" | "active"

const NOTIFICATION_TOGGLE_LABELS: Record<NotificationToggleKey, string> = {
  emailEnabled: "Email",
  inAppEnabled: "In-App",
  active: "Active",
}

/** Returns one history row per changed toggle (On → Off), grouped under the notification type. */
function getChangedNotificationConfigItems(
  previousValue: unknown,
  newValue: unknown,
): DepartmentHistorySnapshotItem[] {
  const prevList = normalizeNotificationConfigList(previousValue)
  const nextList = normalizeNotificationConfigList(newValue)
  const prevByType = new Map(prevList.map((item) => [item.notificationType, item]))
  const nextByType = new Map(nextList.map((item) => [item.notificationType, item]))
  const allTypes = Array.from(new Set([...prevByType.keys(), ...nextByType.keys()])).sort()

  return allTypes.flatMap((type) => {
    const prev = prevByType.get(type)
    const next = nextByType.get(type)
    if (notificationFlagsEqual(prev, next)) return []

    const typeLabel = formatNotificationTypeLabel(type)

    // New type added / removed — show full channel summary once.
    if (!prev || !next) {
      return [
        {
          label: typeLabel,
          value: `${formatNotificationFlagsOnly(prev)} → ${formatNotificationFlagsOnly(next)}`,
          fullValue: `${formatNotificationConfigItem(prev)}\n→\n${formatNotificationConfigItem(next)}`,
          kind: "change" as const,
          previousValue: formatNotificationFlagsOnly(prev),
          newValue: formatNotificationFlagsOnly(next),
        },
      ]
    }

    return (Object.keys(NOTIFICATION_TOGGLE_LABELS) as NotificationToggleKey[]).flatMap((key) => {
      const from = Boolean(prev[key])
      const to = Boolean(next[key])
      if (from === to) return []
      const toggleLabel = NOTIFICATION_TOGGLE_LABELS[key]
      return [
        {
          label: `${typeLabel} — ${toggleLabel}`,
          value: `${formatOnOff(from)} → ${formatOnOff(to)}`,
          kind: "change" as const,
          previousValue: formatOnOff(from),
          newValue: formatOnOff(to),
        },
      ]
    })
  })
}

function formatNotificationConfigSnapshot(value: unknown): string {
  if (!Array.isArray(value)) {
    if (value != null && typeof value === "object") {
      return formatNotificationConfigItem(value)
    }
    return "—"
  }
  if (value.length === 0) return "None"
  return value.map(formatNotificationConfigItem).join("\n")
}

/** Legacy backend payload: [{ code, name }] without notificationType. */
function formatLegacyCodeNameList(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const lines = value.flatMap((entry) => {
    if (entry == null || typeof entry !== "object") return []
    const item = entry as { code?: unknown; name?: unknown; notificationType?: unknown }
    if (item.notificationType != null) return []
    const code = String(item.code ?? "").trim()
    const name = String(item.name ?? "").trim()
    if (!code && !name) return []
    return [code && name ? `${code}: ${name}` : code || name]
  })
  return lines.length > 0 ? lines.join("\n") : null
}

function getDepartmentFieldLabel(field: string): string {
  if (field === "reportConfig") return "Report mapping config"
  if (field === "reportIds") return "Report IDs"
  if (field === "reportVisibility") return "Report Admin/User visibility"
  if (field === "notificationConfig") return "Notification Settings"
  return DEPARTMENT_SETTING_LABELS[field] ?? field
}

function formatDepartmentHistoryFieldValue(field: string, value: unknown): string {
  if (value == null) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (field === "reportConfig") return formatReportConfigSnapshot(value)
  if (field === "reportVisibility") return formatReportVisibilitySnapshot(value)
  if (field === "notificationConfig") return formatNotificationConfigSnapshot(value)
  if (field === "status" && typeof value === "string") {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }
  if (field.endsWith("ContactId") && typeof value === "string") {
    return formatContactIdShort(value)
  }
  if (field.endsWith("Date") && typeof value === "string") {
    return formatDepartmentHistoryDateShort(value)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "None"
    if (field === "addresses") return `${value.length} saved`
    if (field === "reportIds") return value.map(String).join(", ")
    if (field === "multiCodes") return value.map(String).join(", ")
    if (value.every((item) => item != null && typeof item === "object")) {
      return value.map((item) => JSON.stringify(item)).join(", ")
    }
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
  options?: { hideReportIds?: boolean; hideReportVisibility?: boolean },
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

  const dateItems: DepartmentHistorySnapshotItem[] = []
  if (snapshot.apportioningStartDate) {
    dateItems.push({
      label: "Apportioning Start Date",
      value: formatDepartmentHistoryDateShort(snapshot.apportioningStartDate),
      kind: "text",
    })
  }
  if (snapshot.apportioningEndDate) {
    dateItems.push({
      label: "Apportioning End Date",
      value: formatDepartmentHistoryDateShort(snapshot.apportioningEndDate),
      kind: "text",
    })
  }
  if (dateItems.length > 0) {
    const settingsSection = sections.find(s => s.title === "Department Settings")
    if (settingsSection) {
       settingsSection.items.push(...dateItems)
    } else {
       sections.push({ title: "Department Settings", items: dateItems })
    }
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

  if (Array.isArray(snapshot.reportVisibility) && snapshot.reportVisibility.length > 0) {
    // When Mapped Reports cards already show Admin/User pills, skip this duplicate block.
    if (!options?.hideReportVisibility) {
      sections.push({
        title: "Report Admin/User visibility",
        items: [
          {
            label: "Selected reports visibility",
            value: formatReportVisibilitySnapshot(snapshot.reportVisibility),
            fullValue: JSON.stringify(snapshot.reportVisibility),
            kind: "list",
          },
        ],
      })
    }
  }

  if (snapshot.reportConfig != null && typeof snapshot.reportConfig === "object") {
    const full = JSON.stringify(snapshot.reportConfig)
    sections.push({
      title: "Reports mapping",
      items: [
        {
          label: "Report mapping config",
          value: formatReportConfigSnapshot(snapshot.reportConfig),
          fullValue: full,
          kind: "text",
        },
      ],
    })
  }

  if (snapshot.notificationConfig != null) {
    sections.push({
      title: "Department Notifications",
      items: [
        {
          label: "Notification Settings",
          value: formatNotificationConfigSnapshot(snapshot.notificationConfig),
          fullValue: JSON.stringify(snapshot.notificationConfig),
          kind: "list",
        },
      ],
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
  const fullValue = field.endsWith("ContactId")
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
  settingsSnapshot?: DepartmentHistorySettingsSnapshot | null,
): DepartmentHistorySnapshotSection[] {
  const generalItems: DepartmentHistorySnapshotItem[] = []
  const settingItems: DepartmentHistorySnapshotItem[] = []
  const contactItems: DepartmentHistorySnapshotItem[] = []
  const reportItems: DepartmentHistorySnapshotItem[] = []
  const notificationItems: DepartmentHistorySnapshotItem[] = []

  for (const change of changes) {
    if (NOTIFICATION_CHANGE_FIELDS.has(change.field)) {
      let previousValue = change.previousValue
      let newValue = change.newValue

      // If settingsChanges payload is legacy/unparseable, fall back to snapshot rows.
      if (
        normalizeNotificationConfigList(newValue).length === 0 &&
        settingsSnapshot?.notificationConfig != null
      ) {
        newValue = settingsSnapshot.notificationConfig
      }
      if (
        normalizeNotificationConfigList(previousValue).length === 0 &&
        normalizeNotificationConfigList(newValue).length > 0
      ) {
        // Treat as all-new when previous side cannot be parsed.
        previousValue = null
      }

      const changedOnly = getChangedNotificationConfigItems(previousValue, newValue)
      if (changedOnly.length > 0) {
        notificationItems.push(...changedOnly)
      } else {
        const prevLegacy = formatLegacyCodeNameList(change.previousValue)
        const nextLegacy = formatLegacyCodeNameList(change.newValue)
        if (prevLegacy || nextLegacy) {
          notificationItems.push({
            label: "Notification Settings",
            value: `${prevLegacy ?? "—"} → ${nextLegacy ?? "—"}`,
            kind: "change",
            previousValue: prevLegacy ?? "—",
            newValue: nextLegacy ?? "—",
          })
        } else if (settingsSnapshot?.notificationConfig != null) {
          notificationItems.push({
            label: "Notification Settings",
            value: formatNotificationConfigSnapshot(settingsSnapshot.notificationConfig),
            fullValue: JSON.stringify(settingsSnapshot.notificationConfig),
            kind: "list",
          })
        } else {
          notificationItems.push(changeToSnapshotItem(change))
        }
      }
      continue
    }

    const item = changeToSnapshotItem(change)
    if (GENERAL_CHANGE_FIELDS.has(change.field)) {
      generalItems.push(item)
    } else if (CONTACT_CHANGE_FIELDS.has(change.field)) {
      contactItems.push(item)
    } else if (REPORT_CHANGE_FIELDS.has(change.field)) {
      // Mapped Reports cards already list report ids — keep reportVisibility / reportConfig diffs.
      if (change.field === "reportIds" && options?.hideReportIds) {
        continue
      }
      reportItems.push(item)
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
  if (reportItems.length > 0) sections.push({ title: "Reports mapping", items: reportItems })
  if (notificationItems.length > 0) {
    sections.push({ title: "Department Notifications", items: notificationItems })
  }
  return sections
}

export function getDepartmentHistoryDetailSections(
  row: DepartmentHistoryRecord,
  options?: { hideReportIds?: boolean; hideReportVisibility?: boolean },
): DepartmentHistorySnapshotSection[] {
  const changes = row.settingsChanges
  if (changes == null) {
    return getDepartmentHistorySnapshotSections(row.settingsSnapshot, options)
  }
  if (changes.length > 0) {
    return getDepartmentHistoryChangeSections(changes, options, row.settingsSnapshot)
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
