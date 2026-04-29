import { ChevronDown, Clock, Eye, Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { useQueries } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { apiUploadSupportingDoc } from "../api/personalTimeStudyApi"
import { toast } from "sonner"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePickerDropdown } from "@/components/ui/time-picker"
import { apiGetProgramActivityRelationActivities } from "@/features/program/api"

/** Inline required-field asterisk — available to all components in this module. */
function RequiredMark() {
  return <span className="text-destructive">*</span>
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export type TimeEntrySubRow = {
  id: string
  studyProgram: string
  serviceActivity: string
  totalMin: string
  description: string
}

export type TimeEntryParentRow = {
  id: string
  dbId?: number
  start: string
  end: string
  tsProgram: string
  serviceActivity: string
  description: string
  supportingDocLabel: string  // kept for API compat
  supportingDocs: Array<{ name: string; url: string }>
  subRows: TimeEntrySubRow[]
}

/** @deprecated Use TimeEntryParentRow — kept for any external imports */
export type TimeEntryRow = TimeEntryParentRow

function createSubRow(): TimeEntrySubRow {
  return {
    id: newId(),
    studyProgram: "",
    serviceActivity: "",
    totalMin: "",
    description: "",
  }
}

function createParent(): TimeEntryParentRow {
  return {
    id: newId(),
    start: "",
    end: "",
    tsProgram: "",
    serviceActivity: "",
    description: "",
    supportingDocLabel: "",
    supportingDocs: [],
    subRows: [],
  }
}

/** Minutes between two `HH:MM` time strings (same day). */
function computeDurationMinutes(start: string, end: string): string {
  if (!start?.trim() || !end?.trim()) return ""
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  if (
    Number.isNaN(sh) ||
    Number.isNaN(sm) ||
    Number.isNaN(eh) ||
    Number.isNaN(em)
  ) {
    return ""
  }
  const s = sh * 60 + sm
  const e = eh * 60 + em
  let d = e - s
  if (d < 0) d += 24 * 60
  return String(d)
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  if (!time) return ""
  const [hStr, mStr] = time.split(":")
  let h = parseInt(hStr || "0", 10)
  let m = parseInt(mStr || "0", 10)
  if (isNaN(h) || isNaN(m)) return ""
  
  m += minutesToAdd
  h += Math.floor(m / 60)
  m = m % 60
  h = h % 24
  
  if (h < 0) h += 24
  if (m < 0) m += 60
  
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

type PersonalTimeStudyEntryFormProps = {
  className?: string
  dateStr: string
  initialRecords?: any[]
  dropdownData?: any[]
  onSave?: (parents: any[]) => void
  onSubmit?: (parents: any[]) => void
}


/** Local 24-hour time picker — uses the shared TimePickerDropdown for its scrollable panel. */
function TimePicker24h({
  value,
  onChange,
  label,
  required = true,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  required?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-1 w-[80px] shrink-0">
      <Label className="text-[11px] text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={open} onOpenChange={(val) => !disabled && setOpen(val)}>
        <div className="relative">
          <PopoverTrigger asChild>
            <div 
              className={cn("relative cursor-pointer", disabled && "opacity-60 cursor-not-allowed")} 
              onClick={(e) => {
                if (disabled) {
                  e.preventDefault()
                  return
                }
                setOpen(true)
              }}
            >
              <TitleCaseInput
                value={value}
                disabled={disabled}
                placeholder="--:--"
                onChange={(e) => onChange(e.target.value)}
                onFocus={(e) => {
                  if (disabled) {
                    e.preventDefault()
                    return
                  }
                  setOpen(true)
                }}
                className={cn(
                  "h-10 pr-8 text-[11px] font-normal rounded-[6px] cursor-pointer",
                  disabled && "cursor-not-allowed bg-muted disabled:bg-muted disabled:opacity-100 text-muted-foreground pointer-events-none"
                )}
              />
              <Clock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            align="start"
            side="bottom"
            avoidCollisions={true}
            collisionPadding={8}
            sideOffset={4}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              const container = e.currentTarget as HTMLElement
              setTimeout(() => {
                container
                  .querySelectorAll('[data-selected="true"]')
                  .forEach((el) => el.scrollIntoView({ block: "start", behavior: "auto" }))
              }, 50)
            }}
          >
            <TimePickerDropdown value={value} onChange={onChange} onClose={() => setOpen(false)} />
          </PopoverContent>
        </div>
      </Popover>
    </div>
  )
}

/** Multi-file supporting doc pill with dropdown */
function SupportingDocField({
  parentId,
  docs,
  uploading,
  onAdd,
  onDelete,
}: {
  parentId: string
  docs: Array<{ name: string; url: string }>
  uploading: boolean
  onAdd: (parentId: string, files: FileList) => void
  onDelete: (parentId: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const firstDoc = docs[0]
  const extraCount = docs.length - 1
  const pillLabel = uploading
    ? "Uploading..."
    : docs.length === 0
    ? "Supporting doc"
    : extraCount > 0
    ? `${firstDoc.name.slice(0, 14)}… +${extraCount}`
    : firstDoc.name.length > 16
    ? `${firstDoc.name.slice(0, 14)}…`
    : firstDoc.name

  return (
    <div className="min-w-[90px] flex-1 space-y-0.5 relative">
      <Label className="text-[11px] text-muted-foreground">Supporting doc</Label>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) {
            onAdd(parentId, e.target.files)
            e.target.value = ""
          }
        }}
      />
      {/* Pill */}
      <div className="flex h-10 w-full items-center rounded-[6px] border border-input bg-background text-[11px] overflow-hidden">
        <button
          type="button"
          className="flex flex-1 min-w-0 items-center px-2 overflow-hidden"
          onClick={() => docs.length > 0 && setOpen((v) => !v)}
        >
          <span className="truncate text-foreground">{pillLabel}</span>
        </button>
        {docs.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 w-12 h-full text-muted-foreground hover:text-foreground flex items-center justify-center"
          >
            <ChevronDown className={cn("size-5 transition-transform", open && "rotate-180")} />
          </button>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0 w-10 border-l border-input h-full text-[#6C5DD3] hover:bg-accent disabled:opacity-40 flex items-center justify-center"
        >
          <Plus className="size-5" />
        </button>
      </div>
      {/* Dropdown */}
      {open && docs.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[220px] rounded-md border border-border bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] py-1">
          {docs.map((doc) => (
            <div key={doc.name} className="flex items-center gap-2 px-3 py-1.5">
              <span className="flex-1 truncate text-[11px] text-foreground">{doc.name}</span>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[#6C5DD3] hover:opacity-70"
                onClick={() => setOpen(false)}
              >
                <Eye className="size-3.5" />
              </a>
              <button
                type="button"
                className="shrink-0 text-destructive hover:opacity-70"
                onClick={() => {
                  onDelete(parentId, doc.name)
                  if (docs.length <= 1) setOpen(false)
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



const parentFieldRowClass = "flex flex-row items-end gap-2 flex-nowrap"

export function PersonalTimeStudyEntryForm({
  className,
  dateStr,
  initialRecords,
  dropdownData,
  onSave,
  onSubmit,
}: PersonalTimeStudyEntryFormProps) {
  // 1. Group initialRecords into Parent/Sub structure
  const [parents, setParents] = useState<TimeEntryParentRow[]>(() => {
    if (!initialRecords?.length) return [createParent()]

    const parentsMap = new Map<number, TimeEntryParentRow>()
    const orphans: any[] = []

    // Pass 1: Identify parents
    initialRecords.forEach((rec) => {
      if (!rec.parentId) {
        parentsMap.set(rec.id, {
          id: String(rec.id),
          dbId: rec.id,
          start: rec.starttime ?? "",
          end: rec.endtime ?? "",
          tsProgram: String(rec.programid ?? ""),
          serviceActivity: String(rec.activityid ?? ""),
          description: rec.description ?? "",
          supportingDocLabel: "",
          supportingDocs: [],
          subRows: [],
        })
      } else {
        orphans.push(rec)
      }
    })

    // Pass 2: Attach sub-rows
    orphans.forEach((rec) => {
      const p = parentsMap.get(rec.parentId)
      if (p) {
        p.subRows.push({
          id: String(rec.id),
          studyProgram: String(rec.programid ?? ""),
          serviceActivity: String(rec.activityid ?? ""),
          totalMin: String(rec.activitytime ?? ""),
          description: rec.description ?? "",
        })
      }
    })

    return Array.from(parentsMap.values())
  })

  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const programs = useMemo(() => {
    const list = dropdownData?.flatMap((d) => d.programs) ?? []
    const unique = Array.from(new Map(list.map((p) => [p.id, p])).values())
    return unique
  }, [dropdownData])

  const activities = useMemo(() => {
    const list = dropdownData?.flatMap((d) => d.activities) ?? []
    const unique = Array.from(new Map(list.map((a) => [a.id, a])).values())
    return unique
  }, [dropdownData])

  const programQueries = useMemo(() => {
    const list: { departmentId: number; programId: number }[] = []
    for (const bundle of dropdownData ?? []) {
      const deptId = bundle.departmentId
      if (!deptId) continue
      for (const p of bundle.programs) {
        list.push({ departmentId: deptId, programId: p.id })
      }
    }
    return list
  }, [dropdownData])

  const programActivityQueryResults = useQueries({
    queries: programQueries.map((item) => ({
      queryKey: ["programActivityRelation", "activities", item.departmentId, item.programId],
      queryFn: () => apiGetProgramActivityRelationActivities(item.departmentId, item.programId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const getActivitiesForProgram = useCallback((programId: string): Set<string> => {
    const index = programQueries.findIndex((pq) => String(pq.programId) === programId)
    if (index === -1) return new Set()
    const result = programActivityQueryResults[index]
    if (!result?.data) return new Set()

    const ids = new Set<string>()
    const roots = result.data.assignedActivities

    function traverse(node: any) {
      if (!node) return
      if (node.assigned) {
        const idStr = String(node.key || "")
        const id = idStr.split("-").pop()
        if (id) ids.add(id)
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse)
      }
    }

    if (Array.isArray(roots)) {
      for (const deptNode of roots) {
        if (Array.isArray(deptNode.activity)) {
          deptNode.activity.forEach(traverse)
        }
      }
    }
    return ids
  }, [programQueries, programActivityQueryResults])

  /** The first parent row on initial load — never deletable; stays identified even when new rows are prepended. */
  const initialParentIdRef = useRef<string | null>(null)
  if (initialParentIdRef.current === null && parents.length > 0) {
    initialParentIdRef.current = parents[parents.length - 1].id
  }

  const updateParent = useCallback(
    (id: string, patch: Partial<TimeEntryParentRow>) => {
      setParents((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      )
    },
    []
  )

  const updateSubRow = useCallback(
    (parentId: string, subId: string, patch: Partial<TimeEntrySubRow>) => {
      setParents((prev) =>
        prev.map((p) => {
          if (p.id !== parentId) return p
          return {
            ...p,
            subRows: p.subRows.map((s) =>
              s.id === subId ? { ...s, ...patch } : s
            ),
          }
        })
      )
    },
    []
  )

  const addParentAtTop = useCallback(() => {
    setParents((prev) => [createParent(), ...prev])
  }, [])

  const removeParent = useCallback((id: string) => {
    if (id === initialParentIdRef.current) return
    setParents((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const addSubRow = useCallback((parentId: string) => {
    setParents((prev) =>
      prev.map((p) =>
        p.id === parentId
          ? { ...p, subRows: [...p.subRows, createSubRow()] }
          : p
      )
    )
  }, [])

  const removeSubRow = useCallback((parentId: string, subId: string) => {
    setParents((prev) =>
      prev.map((p) =>
        p.id === parentId
          ? { ...p, subRows: p.subRows.filter((s) => s.id !== subId) }
          : p
      )
    )
  }, [])

  const canDeleteParent = (parentId: string) =>
    parents.length > 1 && parentId !== initialParentIdRef.current

  const mapToPayload = () => {
    return parents.map((p) => ({
      id: p.dbId,
      date: dateStr, // Note: I need to pass dateStr to the form or use a prop
      starttime: p.start,
      endtime: p.end,
      programid: p.tsProgram,
      activityid: p.serviceActivity,
      description: p.description,
      subRows: p.subRows.map((s) => ({
        programid: s.studyProgram,
        activityid: s.serviceActivity,
        activitytime: Number(s.totalMin) || 0,
        description: s.description,
      })),
    }))
  }

  const handleAddDocs = async (parentId: string, files: FileList) => {
    const fileArray = Array.from(files)
    const parentRow = parents.find((p) => p.id === parentId)
    const recordId = parentRow?.dbId
    const newDocs = fileArray.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))
    updateParent(parentId, {
      supportingDocs: [...(parentRow?.supportingDocs ?? []), ...newDocs],
    })
    if (!recordId) return
    try {
      setUploadingId(parentId)
      for (const f of fileArray) await apiUploadSupportingDoc(recordId, f)
      toast.success(`${fileArray.length} document(s) uploaded`)
    } catch {
      toast.error("Failed to upload document(s)")
    } finally {
      setUploadingId(null)
    }
  }

  const handleDeleteDoc = (parentId: string, name: string) => {
    setParents((prev) =>
      prev.map((p) => {
        if (p.id !== parentId) return p
        const removed = p.supportingDocs.find((d) => d.name === name)
        if (removed) URL.revokeObjectURL(removed.url)
        return { ...p, supportingDocs: p.supportingDocs.filter((d) => d.name !== name) }
      })
    )
  }

  return (
    <section
      className={cn(
        "w-full rounded-[6px] border-0 ring-0 bg-white p-2 shadow-[0_4px_16px_rgba(16,24,40,0.12)]",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-bold text-[#6C5DD3]">
          Time entries
        </h2>
        <Button
          type="button"
          size="icon"
          className="size-9 shrink-0 bg-[#6C5DD3] text-primary-foreground hover:bg-[#6C5DD3]/90"
          aria-label="Add parent time entry at top"
          onClick={addParentAtTop}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {parents.map((parent) => {
          const totalDisplay = computeDurationMinutes(parent.start, parent.end)

          return (
            <div
              key={parent.id}
              className="rounded-md bg-card/50 p-2"
            >
              {/* Parent row */}
              <div className={parentFieldRowClass}>
                <TimePicker24h
                  label="Start"
                  value={parent.start}
                  onChange={(v) => {
                    updateParent(parent.id, { 
                      start: v,
                      end: addMinutesToTime(v, 15)
                    })
                  }}
                />

                <div className="min-w-[100px] flex-1 space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">
                    TS Program <RequiredMark />
                  </Label>
                  <SingleSelectSearchDropdown
                    value={parent.tsProgram}
                    placeholder="Select program"
                    options={programs.map((p) => ({
                      value: String(p.id),
                      label: `${p.code} - ${p.name}`,
                    }))}
                    onChange={(v) => updateParent(parent.id, { tsProgram: v })}
                    onBlur={() => { }}
                    className="h-10 min-h-0 rounded-[6px]"
                  />
                </div>

                <div className="min-w-[100px] flex-1 space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">
                    Service / Activity <RequiredMark />
                  </Label>
                  <SingleSelectSearchDropdown
                    value={parent.serviceActivity}
                    placeholder="Select activity"
                    disabled={!parent.tsProgram}
                    options={(() => {
                      if (!parent.tsProgram) return []
                      const allowedIds = getActivitiesForProgram(parent.tsProgram)
                      return activities
                        .filter((a) => allowedIds.has(String(a.id)))
                        .map((a) => ({
                          value: String(a.id),
                          label: `${a.code} - ${a.name}`,
                        }))
                    })()}
                    onChange={(v) => updateParent(parent.id, { serviceActivity: v })}
                    onBlur={() => { }}
                    className="h-10 min-h-0 rounded-[6px]"
                  />
                </div>

                <TimePicker24h
                  label="End"
                  value={parent.end}
                  disabled={!parent.start}
                  onChange={(v) => updateParent(parent.id, { end: v })}
                />

                <div className="w-[70px] shrink-0 space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">
                    Total (min.) <RequiredMark />
                  </Label>
                  <TitleCaseInput
                    readOnly
                    tabIndex={-1}
                    value={totalDisplay}
                    placeholder="—"
                    className="h-10 cursor-default bg-muted rounded-[6px] text-[11px] font-normal"
                  />
                </div>
                <div className="min-w-[120px] flex-2 space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">
                    Description / activity notes <RequiredMark />
                  </Label>
                  <TitleCaseInput
                    value={parent.description}
                    onChange={(e) =>
                      updateParent(parent.id, { description: e.target.value })
                    }
                    placeholder="Notes"
                    className="h-10 rounded-[6px] text-[10px] font-normal"
                  />
                </div>
                <SupportingDocField
                  parentId={parent.id}
                  docs={parent.supportingDocs}
                  uploading={uploadingId === parent.id}
                  onAdd={handleAddDocs}
                  onDelete={handleDeleteDoc}
                />

                <div className="flex shrink-0 items-end gap-1 self-end pb-0.5">
                  {canDeleteParent(parent.id) ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove parent time entry"
                      onClick={() => removeParent(parent.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-10 shrink-0 border-[#6C5DD3] text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                    aria-label="Add nested row under this parent"
                    onClick={() => addSubRow(parent.id)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Nested sub-rows (green) */}
              {parent.subRows.length > 0 ? (
                <div className="mt-4 space-y-3 border-l-2 border-primary/25 pl-4 md:ml-8 md:pl-6">
                  {parent.subRows.map((sub) => (
                    <div key={sub.id} className={parentFieldRowClass}>
                      <div className="min-w-[180px] flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Time Study Program <RequiredMark />
                        </Label>
                        <SingleSelectSearchDropdown
                          value={sub.studyProgram}
                          placeholder="Select program"
                          options={programs.map((p) => ({
                            value: String(p.id),
                            label: `${p.code} - ${p.name}`,
                          }))}
                          onChange={(v) => updateSubRow(parent.id, sub.id, { studyProgram: v })}
                          onBlur={() => { }}
                          className="h-9 min-h-0"
                        />
                      </div>
                      <div className="min-w-[180px] flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Service / Activity <RequiredMark />
                        </Label>
                        <SingleSelectSearchDropdown
                          value={sub.serviceActivity}
                          placeholder="Select activity"
                          disabled={!sub.studyProgram}
                          options={(() => {
                            if (!sub.studyProgram) return []
                            const allowedIds = getActivitiesForProgram(sub.studyProgram)
                            return activities
                              .filter((a) => allowedIds.has(String(a.id)))
                              .map((a) => ({
                                value: String(a.id),
                                label: `${a.code} - ${a.name}`,
                              }))
                          })()}
                          onChange={(v) => updateSubRow(parent.id, sub.id, { serviceActivity: v })}
                          onBlur={() => { }}
                          className="h-9 min-h-0"
                        />
                      </div>
                      <div className="min-w-[100px] max-w-[120px] flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Total (min.) <RequiredMark />
                        </Label>
                        <TitleCaseInput
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={sub.totalMin}
                          onChange={(e) =>
                            updateSubRow(parent.id, sub.id, {
                              totalMin: e.target.value,
                            })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="min-w-[200px] flex-2 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Description / activity notes
                        </Label>
                        <TitleCaseInput
                          value={sub.description}
                          onChange={(e) =>
                            updateSubRow(parent.id, sub.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Notes"
                          className="h-9"
                        />
                      </div>
                      <div className="flex shrink-0 items-end self-end pb-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove nested row"
                          onClick={() => removeSubRow(parent.id, sub.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          className="h-10 px-6 bg-[#6C5DD3] hover:bg-[#6C5DD3]/90"
          onClick={() => {
            onSave?.(mapToPayload())
          }}
        >
          Save
        </Button>
        <Button
          type="button"
          className="h-10 px-6 bg-green-600 text-white hover:bg-green-700"
          onClick={() => {
            onSubmit?.(mapToPayload())
          }}
        >
          Submit
        </Button>
      </div>
    </section>
  )
}
