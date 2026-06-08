import type {
  JobPoolHistoryFieldChange,
  JobPoolHistoryRecord,
} from "../queries/jobPoolHistory"

export function formatJobPoolHistoryDate(value: string | null | undefined): string {
  if (!value?.trim()) return "—"
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return value
  }
}

export type JobPoolHistoryColumn = {
  key: string
  header: string
  align: "left" | "center"
  getValue: (row: JobPoolHistoryRecord) => string
  isEvent?: boolean
}

function display(value: unknown): string {
  if (value == null || String(value).trim() === "") return "—"
  return String(value).trim()
}

const EFFECTIVE_FROM: JobPoolHistoryColumn = {
  key: "effectiveFrom",
  header: "Effective From",
  align: "center",
  getValue: (row) => formatJobPoolHistoryDate(row.effectiveFrom),
}

const EFFECTIVE_TO: JobPoolHistoryColumn = {
  key: "effectiveTo",
  header: "Effective To",
  align: "center",
  getValue: (row) => formatJobPoolHistoryDate(row.effectiveTo),
}

const CREATED_BY: JobPoolHistoryColumn = {
  key: "createdByUserName",
  header: "Created By",
  align: "left",
  getValue: (row) => display(row.createdByUserName ?? row.createdByName),
}

const UPDATED_BY: JobPoolHistoryColumn = {
  key: "updatedByUserName",
  header: "Updated By",
  align: "left",
  getValue: (row) => display(row.updatedByUserName ?? row.updatedByName),
}

const SCOPED_COLUMNS: JobPoolHistoryColumn[] = [
  {
    key: "jobTitle",
    header: "Job Title",
    align: "left",
    getValue: (row) => display(row.jobTitle),
  },
  {
    key: "jobCode",
    header: "Job Code",
    align: "left",
    getValue: (row) => display(row.jobCode),
    isEvent: true,
  },
  {
    key: "assignmentKind",
    header: "Assignment Kind",
    align: "left",
    getValue: (row) => display(row.assignmentKind),
  },
  {
    key: "userName",
    header: "User Name",
    align: "left",
    getValue: (row) => display(row.userName),
  },
  EFFECTIVE_FROM,
  EFFECTIVE_TO,
  CREATED_BY,
  UPDATED_BY,
]

const COLUMNS_BY_KIND: Record<string, JobPoolHistoryColumn[]> = {
  user: [
    {
      key: "userName",
      header: "User Name",
      align: "left",
      getValue: (row) => display(row.userName),
    },
    EFFECTIVE_FROM,
    EFFECTIVE_TO,
    CREATED_BY,
    UPDATED_BY,
  ],
  activity: [
    {
      key: "activityCode",
      header: "Activity Code",
      align: "left",
      getValue: (row) => display(row.activityCode),
    },
    {
      key: "activityName",
      header: "Activity Name",
      align: "left",
      getValue: (row) => display(row.activityName),
    },
    EFFECTIVE_FROM,
    EFFECTIVE_TO,
    CREATED_BY,
    UPDATED_BY,
  ],
  classification: [
    {
      key: "jobClassificationCode",
      header: "Classification Code",
      align: "left",
      getValue: (row) => display(row.jobClassificationCode),
    },
    {
      key: "jobClassificationName",
      header: "Classification Name",
      align: "left",
      getValue: (row) => display(row.jobClassificationName),
    },
    EFFECTIVE_FROM,
    EFFECTIVE_TO,
    CREATED_BY,
    UPDATED_BY,
  ],
  definition: [
    {
      key: "jobPoolName",
      header: "Job Pool Name",
      align: "left",
      getValue: (row) => display(row.jobPoolName),
    },
    {
      key: "jobPoolEvent",
      header: "Event",
      align: "left",
      isEvent: true,
      getValue: (row) => display(row.jobPoolEvent ?? row.jobCode),
    },
    EFFECTIVE_FROM,
    EFFECTIVE_TO,
    CREATED_BY,
    UPDATED_BY,
  ],
}

export function getJobPoolHistoryColumns(assignmentKind = ""): JobPoolHistoryColumn[] {
  const kind = assignmentKind.trim().toLowerCase()
  if (kind && COLUMNS_BY_KIND[kind]) return COLUMNS_BY_KIND[kind]
  return SCOPED_COLUMNS
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  status: "Status",
  departmentId: "Department ID",
  jobClassifications: "Job Classifications",
  activities: "Activities",
  users: "Users",
}

const GENERAL_FIELDS = new Set(["name", "description", "status", "departmentId"])
const ASSIGNMENT_FIELDS = new Set(["jobClassifications", "activities", "users"])
const FULL_WIDTH_FIELDS = new Set(["description", "jobClassifications", "activities", "users"])

function formatListItem(item: unknown): string {
  if (!item || typeof item !== "object") return String(item ?? "").trim()
  const record = item as Record<string, unknown>
  const code = String(record.code ?? "").trim()
  const name = String(record.name ?? "").trim()
  if (code && name) return `${code} — ${name}`
  return code || name || String(record.id ?? "").trim()
}

export function formatJobPoolHistoryApiValue(value: unknown): string {
  if (value == null) return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) {
    if (value.length === 0) return "—"
    return value.map(formatListItem).filter(Boolean).join(", ")
  }
  if (typeof value === "object") return JSON.stringify(value)
  const text = String(value).trim()
  return text || "—"
}

export function getJobPoolHistoryFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

export function isJobPoolHistoryFullWidthField(field: string): boolean {
  return FULL_WIDTH_FIELDS.has(field)
}

export type JobPoolHistoryDetailItem = {
  key: string
  label: string
  kind: "text" | "change"
  value?: string
  previousValue?: string
  newValue?: string
  previousEnabled?: boolean
  newEnabled?: boolean
}

export type JobPoolHistoryDetailSection = {
  title: string
  layout: "grid-3" | "grid-2" | "stack"
  items: JobPoolHistoryDetailItem[]
}

function changeToDetailItem(change: JobPoolHistoryFieldChange): JobPoolHistoryDetailItem {
  const label = getJobPoolHistoryFieldLabel(change.field)
  const prevDisplay = formatJobPoolHistoryApiValue(change.previousValue)
  const nextDisplay = formatJobPoolHistoryApiValue(change.newValue)

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

function snapshotToDetailItem(field: string, value: unknown): JobPoolHistoryDetailItem {
  return {
    key: field,
    label: getJobPoolHistoryFieldLabel(field),
    kind: "text",
    value: formatJobPoolHistoryApiValue(value),
  }
}

function groupChanges(changes: JobPoolHistoryFieldChange[]): JobPoolHistoryDetailSection[] {
  const generalItems: JobPoolHistoryDetailItem[] = []
  const assignmentItems: JobPoolHistoryDetailItem[] = []

  for (const change of changes) {
    const item = changeToDetailItem(change)
    if (ASSIGNMENT_FIELDS.has(change.field)) {
      assignmentItems.push(item)
    } else if (GENERAL_FIELDS.has(change.field)) {
      generalItems.push(item)
    } else {
      generalItems.push(item)
    }
  }

  const sections: JobPoolHistoryDetailSection[] = []
  if (generalItems.length > 0) {
    sections.push({ title: "General", layout: "grid-3", items: generalItems })
  }
  if (assignmentItems.length > 0) {
    sections.push({ title: "Assignments", layout: "stack", items: assignmentItems })
  }
  return sections
}

function groupSnapshot(
  snapshot: NonNullable<JobPoolHistoryRecord["settingsSnapshot"]>,
): JobPoolHistoryDetailSection[] {
  const generalItems: JobPoolHistoryDetailItem[] = []
  const assignmentItems: JobPoolHistoryDetailItem[] = []

  for (const [field, value] of Object.entries(snapshot)) {
    if (field === "departmentId") continue
    const item = snapshotToDetailItem(field, value)
    if (ASSIGNMENT_FIELDS.has(field)) {
      assignmentItems.push(item)
    } else {
      generalItems.push(item)
    }
  }

  const sections: JobPoolHistoryDetailSection[] = []
  if (generalItems.length > 0) {
    sections.push({ title: "General", layout: "grid-3", items: generalItems })
  }
  if (assignmentItems.length > 0) {
    sections.push({ title: "Assignments", layout: "stack", items: assignmentItems })
  }
  return sections
}

export function getJobPoolHistoryDetailSections(row: JobPoolHistoryRecord): JobPoolHistoryDetailSection[] {
  const sections: JobPoolHistoryDetailSection[] = []
  const kind = String(row.assignmentKind ?? "").toLowerCase()

  if (kind === "definition") {
    const definitionItems: JobPoolHistoryDetailItem[] = []
    const event = display(row.jobPoolEvent ?? row.jobCode)
    const poolName = display(row.jobPoolName)
    if (event !== "—") {
      definitionItems.push({ key: "event", label: "Event", kind: "text", value: event })
    }
    if (poolName !== "—") {
      definitionItems.push({ key: "jobPoolName", label: "Job Pool Name", kind: "text", value: poolName })
    }
    if (definitionItems.length > 0) {
      sections.push({ title: "Definition", layout: "grid-2", items: definitionItems })
    }

    const changes = row.settingsChanges
    if (changes == null && row.settingsSnapshot) {
      sections.push(...groupSnapshot(row.settingsSnapshot))
      return sections
    }
    if (changes && changes.length > 0) {
      sections.push(...groupChanges(changes))
    }
    return sections
  }

  if (kind === "user" && row.userName) {
    sections.push({
      title: "User",
      layout: "grid-2",
      items: [{ key: "userName", label: "User Name", kind: "text", value: display(row.userName) }],
    })
  }
  if (kind === "activity") {
    const items: JobPoolHistoryDetailItem[] = []
    if (row.activityCode) {
      items.push({
        key: "activityCode",
        label: "Activity Code",
        kind: "text",
        value: display(row.activityCode),
      })
    }
    if (row.activityName) {
      items.push({
        key: "activityName",
        label: "Activity Name",
        kind: "text",
        value: display(row.activityName),
      })
    }
    if (items.length > 0) sections.push({ title: "Activity", layout: "grid-2", items })
  }
  if (kind === "classification") {
    const items: JobPoolHistoryDetailItem[] = []
    if (row.jobClassificationCode) {
      items.push({
        key: "jobClassificationCode",
        label: "Classification Code",
        kind: "text",
        value: display(row.jobClassificationCode),
      })
    }
    if (row.jobClassificationName) {
      items.push({
        key: "jobClassificationName",
        label: "Classification Name",
        kind: "text",
        value: display(row.jobClassificationName),
      })
    }
    if (items.length > 0) {
      sections.push({ title: "Job Classification", layout: "grid-2", items })
    }
  }

  return sections
}

export function jobPoolHistoryRowHasDetail(row: JobPoolHistoryRecord): boolean {
  const createdBy = display(row.createdByUserName ?? row.createdByName)
  const updatedBy = display(row.updatedByUserName ?? row.updatedByName)
  if (createdBy !== "—" || updatedBy !== "—") return true
  return getJobPoolHistoryDetailSections(row).length > 0
}
