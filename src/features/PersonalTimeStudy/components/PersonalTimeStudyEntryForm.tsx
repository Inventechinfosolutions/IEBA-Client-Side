import { ChevronDown, Clock, Eye, Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { useGetProgramActivityRelations } from "../queries/getProgramActivityRelations"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePickerDropdown } from "@/components/ui/time-picker"
import { useAuth } from "@/contexts/AuthContext"
import { API_BASE_URL } from "@/lib/config"
import { apiDownloadSupportingDoc, apiDeleteSupportingDoc } from "../api/personalTimeStudyApi"

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
  dbId?: number
  studyProgram: string
  serviceActivity: string
  totalMin: string
  description: string
  start: string
  end: string
  programCode?: string
  programName?: string
  activityCode?: string
  activityName?: string
  departmentCode?: string
}

export type TimeEntryParentRow = {
  id: string
  dbId?: number
  start: string
  end: string
  tsProgram: string
  serviceActivity: string
  description: string
  supportingDocLabel?: string
  supportingDocs: Array<{ name: string; url: string; file?: File; docId?: number }>
  subRows: TimeEntrySubRow[]
  programCode?: string
  programName?: string
  activityCode?: string
  activityName?: string
  departmentCode?: string
  isLeave?: boolean
}

export type TimeEntryRow = TimeEntryParentRow

function createSubRow(): TimeEntrySubRow {
  return {
    id: newId(),
    studyProgram: "",
    serviceActivity: "",
    totalMin: "",
    description: "",
    start: "",
    end: "",
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

function computeDurationMinutes(start: string, end: string): string {
  if (!start?.trim() || !end?.trim()) return ""
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return ""
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
  onDelete?: (id: number) => void
  userId?: string
  username?: string
  readonly?: boolean
  allocatedTotal?: number
  actualTotal?: number
  balanceTotal?: number
  actualMultiTotal?: number
  multiBalanceTotal?: number
  hideSummaryHeader?: boolean
  showLeaveBanner?: boolean
  /** Leave records for the selected date — used for overlap validation */
  leaveRecords?: Array<{
    starttime: string
    endtime: string
    status: string
    programcode?: string
    activitycode?: string
    programid?: string | number
    activityid?: string | number
    programname?: string
    activityname?: string
    name?: string
    employeeName?: string
  }>
}

function TimePicker24h({
  value,
  onChange,
  label,
  required = true,
  disabled = false,
  isLeave = false,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  required?: boolean
  disabled?: boolean
  isLeave?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-1 w-[80px] shrink-0">
      <Label className="text-[11px] text-muted-foreground">
        {label} {required && <RequiredMark />}
      </Label>
      <Popover open={open} onOpenChange={(val) => !disabled && setOpen(val)}>
        <PopoverTrigger asChild>
          <div className={cn("relative", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
            <TitleCaseInput
              value={value}
              readOnly
              placeholder="--:--"
              className={cn(
                "h-10 pr-8 text-[11px] font-normal rounded-[6px] text-[#344054] bg-white",
                disabled && "bg-[#F2F4F7] cursor-not-allowed",
                isLeave && "border-yellow-400"
              )}
              onClick={() => !disabled && setOpen(true)}
            />
            <Clock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-70 pointer-events-none text-gray-500" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start" side="top" sideOffset={5}>
          <TimePickerDropdown value={value} onChange={(v) => { onChange(v); setOpen(false); }} minuteStep={15} />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function SupportingDocField({
  parentId,
  docs,
  uploading,
  disabled = false,
  onAdd,
  onDelete,
  onDownload,
  isLeave = false,
}: {
  parentId: string
  docs: Array<{ name: string; url: string; file?: File; docId?: number }>
  uploading: boolean
  disabled?: boolean
  onAdd: (parentId: string, files: FileList) => void
  onDelete: (parentId: string, name: string) => void
  onDownload: (parentId: string, doc: { name: string; url: string; file?: File; docId?: number }) => void
  isLeave?: boolean
}) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const pillLabel = uploading ? "Uploading..." : docs.length === 0 ? "Supporting doc" : docs[0].name
  const extraCount = docs.length > 1 ? docs.length - 1 : 0

  return (
    <div className={cn("min-w-[90px] flex-1 space-y-0.5 relative")}>
      <Label className="text-[11px] text-muted-foreground">Supporting doc</Label>
      <input ref={fileRef} type="file" className="hidden" multiple onChange={(e) => { if (e.target.files?.length) { onAdd(parentId, e.target.files); e.target.value = ""; } }} />
      <div className={cn(
        "flex h-10 w-full items-center rounded-[6px] border border-input text-[11px] overflow-hidden bg-white",
        isLeave && "border-yellow-400"
      )}>
        <button type="button" className="flex flex-1 min-w-0 items-center px-2 overflow-hidden" onClick={() => setOpen((v) => !v)}>
          <span className="truncate text-foreground flex-1">{pillLabel}</span>
          {extraCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-[6px] bg-[#6C5DD3]/10 text-[#6C5DD3] text-[10px] font-bold shrink-0">
              +{extraCount}
            </span>
          )}
          <ChevronDown className={cn("size-3 ml-1 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {!disabled && (
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={cn("shrink-0 w-10 border-l border-input h-full text-[#6C5DD3] hover:bg-accent flex items-center justify-center", uploading && "opacity-40 cursor-not-allowed")}>
            <Plus className="size-5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[220px] rounded-md border border-border bg-white shadow-lg py-1">
          {docs.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-muted-foreground italic">
              No documents uploaded
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc.name} className="flex items-center gap-2 px-3 py-1.5">
                <span className="flex-1 truncate text-[11px] text-foreground">{doc.name}</span>
                <button type="button" className="shrink-0 text-[#6C5DD3] hover:opacity-70 cursor-pointer" onClick={() => { onDownload(parentId, doc); setOpen(false); }}>
                  <Eye className="size-3.5" />
                </button>
                {!disabled && (
                  <button type="button" className="shrink-0 text-destructive hover:opacity-70 cursor-pointer" onClick={() => { onDelete(parentId, doc.name); if (docs.length <= 1) setOpen(false); }}>
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const parentFieldRowClass = "flex flex-row items-end gap-2 flex-nowrap"

export function PersonalTimeStudyEntryForm({
  dateStr,
  userId: propsUserId,
  username: propsUsername,
  initialRecords,
  dropdownData,
  onSave,
  onSubmit,
  onDelete,
  readonly = false,
  allocatedTotal,
  actualTotal,
  balanceTotal,
  actualMultiTotal,
  multiBalanceTotal,
  hideSummaryHeader = false,
  showLeaveBanner = false,
  leaveRecords,
  className,
}: PersonalTimeStudyEntryFormProps) {
  const { user } = useAuth()
  const userId = propsUserId || user?.id || ""
  const username = propsUsername || user?.name || ""
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [parents, setParents] = useState<TimeEntryParentRow[]>([createParent()])
  const [prevInitialRecords, setPrevInitialRecords] = useState<any[] | undefined>(undefined)
  const [prevLeaveRecords, setPrevLeaveRecords] = useState<any[] | undefined>(undefined)

  const formSettings = useMemo(() => {
    if (!dropdownData || dropdownData.length === 0) return null
    return {
      moveSaveSubmitToTop: dropdownData.some((d: any) => !!d.moveSaveSubmitToTop),
      removeAutoFillEndTime: dropdownData.some((d: any) => !!d.removeAutoFillEndTime),
      startorEndTime: dropdownData.some((d: any) => !!d.startorEndTime),
      supportingDoc: dropdownData.some((d: any) => !!d.supportingDoc),
      removeDescriptionActivityNote: dropdownData.some((d: any) => !!d.removeDescriptionActivityNote),
      removeDescriptionActivityNoteAnchor: dropdownData.some((d: any) => !!d.removeDescriptionActivityNoteAnchor),
      removeDescriptionActivityNoteMultiCode: dropdownData.some((d: any) => !!d.removeDescriptionActivityNoteMultiCode),
    }
  }, [dropdownData])

  const moveSaveSubmitToTop = formSettings?.moveSaveSubmitToTop ?? false

  if (initialRecords !== prevInitialRecords || leaveRecords !== prevLeaveRecords) {
    setPrevInitialRecords(initialRecords)
    setPrevLeaveRecords(leaveRecords)
    const syncRecordsToState = () => {
      const filtered = (initialRecords ?? []).filter((r) => r.date?.split("T")[0] === dateStr)
      const parentMap = new Map<number, TimeEntryParentRow>()
      filtered.forEach((rec) => {
        if (!rec.parentId) {
          const parentRow: TimeEntryParentRow = {
            id: String(rec.id),
            dbId: rec.id,
            start: rec.starttime ?? "",
            end: rec.endtime ?? "",
            tsProgram: String(rec.programid ?? ""),
            serviceActivity: String(rec.activityid ?? ""),
            description: rec.description ?? "",
            supportingDocLabel: "",
            supportingDocs: (rec.supportingDocs ?? []).map((d: any) => ({
              name: d.fileName,
              url: `${API_BASE_URL}/timestudyrecords/${rec.id}/supporting-doc`,
              docId: d.id ?? undefined,
            })),
            programCode: rec.programcode,
            programName: rec.programname,
            activityCode: rec.activitycode,
            activityName: rec.activityname,
            departmentCode: rec.departmentcode,
            subRows: (rec.multiCodeRecords ?? []).map((m: any) => ({
              id: String(m.id),
              dbId: m.id,
              studyProgram: String(m.programid ?? ""),
              serviceActivity: String(m.activityid ?? ""),
              totalMin: String(m.activitytime ?? ""),
              description: m.description ?? "",
              start: m.starttime ?? "",
              end: m.endtime ?? "",
              programCode: m.programcode,
              programName: m.programname,
              activityCode: m.activitycode,
              activityName: m.activityname,
              departmentCode: m.departmentcode,
            })),
          }
          parentMap.set(rec.id, parentRow)
        }
      })
      const sorted = Array.from(parentMap.values()).sort((a, b) => {
        if (!a.start) return 1
        if (!b.start) return -1
        return b.start.localeCompare(a.start)
      })

      const leaveRows: TimeEntryParentRow[] = []
      if (leaveRecords) {
        leaveRecords.forEach((leave) => {
          if (leave.status?.toLowerCase() === "approved") {
            const lStart = (leave.starttime ?? "").split(":").slice(0, 2).join(":")
            const lEnd   = (leave.endtime ?? "").split(":").slice(0, 2).join(":")
            const existing = sorted.find(
              (rec) => rec.start === lStart && rec.end === lEnd && rec.tsProgram === String(leave.programid ?? "")
            )
            if (existing) {
              existing.isLeave = true
            } else {
              leaveRows.push({
                id: newId(),
                start: lStart,
                end: lEnd,
                tsProgram: String(leave.programid ?? ""),
                serviceActivity: String(leave.activityid ?? ""),
                description: "",
                supportingDocLabel: "",
                supportingDocs: [],
                subRows: [],
                programCode: leave.programcode,
                programName: leave.programname,
                activityCode: leave.activitycode,
                activityName: leave.activityname,
                isLeave: true,
              })
            }
          }
        })
      }

      const combined = [...sorted, ...leaveRows]
      setParents(combined.length > 0 ? combined : [createParent()])
    }
    syncRecordsToState()
  }

  const isLocked = useMemo(() => {
    if (readonly) return true
    if (!initialRecords) return false
    return initialRecords.some(rec => 
      rec.date?.split("T")[0] === dateStr &&
      ["submitted", "approved"].includes(rec.status?.toLowerCase())
    )
  }, [initialRecords, dateStr, readonly])

  const allIsLeave = useMemo(() => {
    return parents.length > 0 && parents.every(p => p.isLeave)
  }, [parents])

  const programs = useMemo(() => {
    const list = dropdownData?.flatMap((d) => d.programs.map((p: any) => ({ ...p, departmentCode: d.departmentCode }))) ?? []
    return Array.from(new Map(list.map((p) => [p.id, p])).values())
  }, [dropdownData])

  const activities = useMemo(() => {
    const list = dropdownData?.flatMap((d) => d.activities.map((a: any) => ({ ...a, departmentCode: d.departmentCode }))) ?? []
    return Array.from(new Map(list.map((a) => [a.id, a])).values())
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

  const queriesEnabled = !readonly && !isLocked
  const programActivityQueryResults = useGetProgramActivityRelations(programQueries, queriesEnabled)

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
      if (Array.isArray(node.children)) node.children.forEach(traverse)
    }
    if (Array.isArray(roots)) {
      for (const deptNode of roots) {
        if (Array.isArray(deptNode.activity)) deptNode.activity.forEach(traverse)
      }
    }
    return ids
  }, [programQueries, programActivityQueryResults])

  const updateParent = useCallback((id: string, patch: Partial<TimeEntryParentRow>) => {
    setParents((prev) => prev.map((p) => {
      if (p.id !== id) return p
      const updatedP = { ...p, ...patch }
      
      // Auto-fill logic
      if (patch.start !== undefined && !formSettings?.removeAutoFillEndTime) {
        updatedP.end = addMinutesToTime(patch.start, 15)
      }

      if (patch.start !== undefined || patch.end !== undefined) {
        if (updatedP.subRows.length > 0) {
          const parentMin = Number(computeDurationMinutes(updatedP.start, updatedP.end)) || 0
          const subTotalMin = updatedP.subRows.reduce((sum, s) => sum + (Number(computeDurationMinutes(s.start, s.end)) || 0), 0)
          if (subTotalMin > parentMin) {
            toast.error(`Parent total is ${parentMin} mins . Child total should not exceed the parent time.`, { id: `val-${id}` })
            updatedP.end = "" 
          }
        }
      }
      return updatedP
    }))
  }, [formSettings?.removeAutoFillEndTime])

  const updateSubRow = (parentId: string, subRowId: string, updates: Partial<TimeEntrySubRow>) => {
    if (isLocked) return
    setParents((prev) =>
      prev.map((p) => {
        if (p.id !== parentId) return p
        
        const newSubRows = p.subRows.map((s) => {
          if (s.id !== subRowId) return s
          const updated = { ...s, ...updates }
          
          if (updates.start || updates.end) {
            updated.totalMin = String(computeDurationMinutes(updated.start, updated.end))
          } else if (updates.totalMin !== undefined) {
            // If totalMin is updated manually, try to move end time
            const mins = Number(updates.totalMin) || 0
            if (!formSettings?.removeAutoFillEndTime) {
               updated.end = addMinutesToTime(updated.start, mins)
            }
          }
          return updated
        })
        
        if (updates.end || updates.start || updates.totalMin) {
          const parentMinutes = Number(computeDurationMinutes(p.start, p.end)) || 0
          const subTotalMinutes = newSubRows.reduce((acc, s) => acc + (Number(s.totalMin) || 0), 0)
          
          if (subTotalMinutes > parentMinutes) {
            toast.error(`Parent total is ${parentMinutes} mins. Child total should not exceed the parent time.`)
            return p // Reject change
          }
        }

        return { ...p, subRows: newSubRows }
      })
    )
  }

  const addParentAtTop = useCallback(() => {
    const topParent = parents[0]
    const newP = createParent()
    if (topParent) {
      newP.start = topParent.end || ""
      if (newP.start && !formSettings?.removeAutoFillEndTime) {
         newP.end = addMinutesToTime(newP.start, 15)
      }
    }
    setParents((prev) => [newP, ...prev])
  }, [parents, formSettings?.removeAutoFillEndTime])

  const removeParent = useCallback((id: string) => {
    const p = parents.find((row) => row.id === id)
    if (p?.dbId) {
      onDelete?.(p.dbId)
    }

    setParents((prev) => {
      const filtered = prev.filter((p) => p.id !== id)
      return filtered.length > 0 ? filtered : [createParent()]
    })
  }, [parents, onDelete])

  const addSubRow = useCallback((parentId: string) => {
    setParents((prev) => prev.map((p) => {
      if (p.id !== parentId) return p
      return { 
        ...p, 
        subRows: [...p.subRows, createSubRow()] 
      }
    }))
  }, [])

  const removeSubRow = useCallback((parentId: string, subId: string) => {
    setParents((prev) => prev.map((p) => (p.id === parentId ? { ...p, subRows: p.subRows.filter((s) => s.id !== subId) } : p)))
  }, [])

  const canDeleteParent = (parentId: string) => {
    if (isLocked) return false
    const parent = parents.find((p) => p.id === parentId)
    if (parent?.isLeave) return false
    return parents.length > 1 || !!parent?.dbId
  }

  const mapToPayload = (): any[] => {
    const deptId = dropdownData?.[0]?.departmentId
    return parents
      .filter((p) => !(p.isLeave && !p.dbId))
      .map((p) => ({
      id: p.dbId,
      userId,
      username,
      date: dateStr,
      starttime: p.start,
      endtime: p.end,
      activitytime: Number(computeDurationMinutes(p.start, p.end)) || 0,
      programid: p.tsProgram,
      activityid: p.serviceActivity,
      description: p.description,
      departmentId: deptId,
      supportingDocs: p.supportingDocs,
      multiCodeRecords: p.subRows.map((s) => {
        const subDeptId = dropdownData?.find((d) => d.programs.some((pr: any) => String(pr.id) === s.studyProgram))?.departmentId
        return {
          id: s.dbId,
          programid: s.studyProgram,
          activityid: s.serviceActivity,
          activitytime: Number(s.totalMin) || Number(computeDurationMinutes(s.start, s.end)) || 0,
          description: s.description,
          departmentId: subDeptId,
          starttime: s.start,
          endtime: s.end,
          recordType: "MULTI_CODE",
        }
      }),
    }))
  }

  const validateEntries = () => {
    for (const p of parents) {
      if (!p.start || !p.end || !p.tsProgram || !p.serviceActivity) {
        toast.error("Please fill all the required fields")
        return false
      }

      if (p.subRows.length > 0) {
        const parentMin = Number(computeDurationMinutes(p.start, p.end)) || 0
        let subTotalMin = 0
        for (const s of p.subRows) {
          if (!s.totalMin || !s.studyProgram || !s.serviceActivity) {
            toast.error("Please fill all the required fields in sub-rows")
            return false
          }
          subTotalMin += Number(s.totalMin) || 0
        }

        if (subTotalMin > parentMin) {
          toast.error(`Total sub-row minutes (${subTotalMin}) cannot exceed parent minutes (${parentMin})`)
          return false
        }
      }

      // ── Leave-overlap check (additive) ──────────────────────────────
      if (!p.isLeave && leaveRecords && leaveRecords.length > 0) {
        const BLOCKING_STATUSES = ["draft", "requested", "approved"]
        const parseT = (t: string): number | null => {
          if (!t) return null
          // Handle both "HH:MM" and "HH:MM:SS"
          const parts = t.trim().split(":")
          if (parts.length < 2) return null
          const h = Number(parts[0])
          const m = Number(parts[1])
          if (isNaN(h) || isNaN(m)) return null
          return h * 60 + m
        }
        const entryStart = parseT(p.start)
        const entryEnd   = parseT(p.end)
        if (entryStart !== null && entryEnd !== null) {
          for (const leave of leaveRecords) {
            const status = (leave.status ?? "").toLowerCase()
            if (!BLOCKING_STATUSES.includes(status)) continue
            const leaveStart = parseT(leave.starttime)
            const leaveEnd   = parseT(leave.endtime)
            if (leaveStart === null || leaveEnd === null) continue
            // Ranges overlap when: entryStart < leaveEnd AND leaveStart < entryEnd
            if (entryStart < leaveEnd && leaveStart < entryEnd) {
              const fmt = (mins: number) =>
                `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
              toast.error(
                `Time entry (${fmt(entryStart)}–${fmt(entryEnd)}) overlaps with a ${
                  status.charAt(0).toUpperCase() + status.slice(1)
                } leave request (${fmt(leaveStart)}–${fmt(leaveEnd)}). Please adjust the entry time.`
              )
              return false
            }
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────
    }
    return true
  }

  const handleSave = () => {
    if (!validateEntries()) return
    const payload = mapToPayload()
    if (payload.length === 0) { toast.error("Please add at least one time entry"); return; }
    onSave?.(payload)
  }

  const handleSubmitInternal = () => {
    if (!validateEntries()) return
    const payload = mapToPayload()
    if (payload.length === 0) { toast.error("Please add at least one time entry"); return; }
    onSubmit?.(payload)
  }

  const handleAddDocs = (parentId: string, files: FileList) => {
    const fileArray = Array.from(files)
    const parentRow = parents.find((p) => p.id === parentId)
    
    const newDocs = fileArray.map((f) => ({ 
      name: f.name, 
      url: URL.createObjectURL(f),
      file: f
    }))
    
    updateParent(parentId, { 
      supportingDocs: [...(parentRow?.supportingDocs ?? []), ...newDocs] 
    })
  }

  const handleDeleteDoc = (parentId: string, name: string) => {
    setParents((prev) => prev.map((p) => {
      if (p.id !== parentId) return p
      const removed = p.supportingDocs.find((d) => d.name === name)
      if (removed) {
        // Revoke local blob URL only for unsaved files
        if (removed.file) URL.revokeObjectURL(removed.url)
        // If this is a saved doc on the server, delete it via API
        const parent = p
        if (!removed.file && removed.docId) {
          const parentDbId = parent.dbId
          if (parentDbId) {
            apiDeleteSupportingDoc(parentDbId, removed.docId).catch(() => {})
          }
        }
      }
      return { ...p, supportingDocs: p.supportingDocs.filter((d) => d.name !== name) }
    }))
  }

  const handleDownloadDoc = async (parentId: string, doc: any) => {
    if (doc.file) {
      const link = document.createElement("a")
      link.href = doc.url
      link.download = doc.name
      link.click()
      return
    }
    const parent = parents.find(p => p.id === parentId)
    if (!parent?.dbId) {
      toast.error("Please save the record before downloading.")
      return
    }
    try {
      const blob = await apiDownloadSupportingDoc(parent.dbId, doc.docId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err.message || "Download failed")
    }
  }

  return (
    <section className={cn("w-full rounded-[6px] border-0 bg-white p-4 shadow-[0_4px_16px_rgba(16,24,40,0.12)]", className)}>
        <div className="mb-6 flex flex-col gap-2">
          {/* Top Row: Metrics aligned right */}
          {!hideSummaryHeader && (
            <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-[14px]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">Allocated TS Minutes:</span>
                <span className="font-semibold text-[#6C5DD3]">{allocatedTotal || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">Time Study Minutes:</span>
                <span className="font-semibold text-[#6C5DD3]">{actualTotal || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">Total MAA Minutes:</span>
                <span className="font-semibold text-[#6C5DD3]">{actualMultiTotal || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">Time Study Balance:</span>
                <span className="font-semibold text-[#6C5DD3]">{balanceTotal || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">MAA Balance:</span>
                <span className="font-semibold text-[#6C5DD3]">{multiBalanceTotal || 0}</span>
              </div>
            </div>
          )}

          {showLeaveBanner && leaveRecords && leaveRecords.filter(l => l.status?.toLowerCase() === "approved").map((leave, idx) => (
            <div key={idx} className="mt-5 mb-1 mx-auto max-w-max rounded-[6px] bg-[#E2E8F0]/50 px-4 py-1.5 text-[13px] text-gray-600 italic text-center border border-[#CBD5E1]">
               {leave.name || leave.employeeName || username} applied leave in this date : <span className="not-italic font-medium text-gray-800">({dateStr})</span> from : <span className="not-italic font-medium text-gray-800">({leave.starttime})</span> To : <span className="not-italic font-medium text-gray-800">({leave.endtime})</span>.
            </div>
          ))}

          {/* Bottom Row: Title and Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] text-[#6C5DD3] font-semibold">Time Entries</h3>
            <div className="flex items-center gap-3">
              {!readonly && moveSaveSubmitToTop && (
                <div className="flex items-center gap-2 mr-4">
                  <Button 
                    disabled={isLocked || allIsLeave}
                    className={cn("h-9 px-4 bg-[#6C5DD3] hover:bg-[#5B4DBF] text-[12px]", (isLocked || allIsLeave) && "cursor-not-allowed")} 
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                  <Button 
                    disabled={isLocked || allIsLeave}
                    className={cn("h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-[12px]", (isLocked || allIsLeave) && "cursor-not-allowed")} 
                    onClick={() => setShowSubmitConfirm(true)}
                  >
                    Submit
                  </Button>
                </div>
              )}
              {!readonly && (
                <Button 
                  size="icon" 
                  disabled={isLocked} 
                  className={cn("size-9 bg-[#6C5DD3] hover:bg-[#6C5DD3]/90", isLocked && "cursor-not-allowed")} 
                  onClick={addParentAtTop}
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

      <div className="flex flex-col gap-3">
        {parents.map((parent) => {
          const totalDisplay = computeDurationMinutes(parent.start, parent.end)
          const isLeaveRow = parent.isLeave
          const hideTime = !!formSettings?.startorEndTime
          const hideDocs = !!formSettings?.supportingDoc
          const hideNotes = !!formSettings?.removeDescriptionActivityNote

          return (
            <div key={parent.id} className={cn("rounded-md", !isLeaveRow && "bg-card/50 p-2 border border-border/50")}>
              <div className={cn(parentFieldRowClass, isLeaveRow && "p-2")}>
                {!hideTime && (
                   <TimePicker24h label="Start" value={parent.start} disabled={isLocked || isLeaveRow} isLeave={isLeaveRow} onChange={(v) => updateParent(parent.id, { start: v })} />
                )}
                <div className="flex-1 space-y-0.5">
                  <Label className="text-[11px] text-[#6C5DD3] font-medium">TS Program <RequiredMark /></Label>
                  <SingleSelectSearchDropdown 
                    value={parent.tsProgram} 
                    placeholder="Select program" 
                    disabled={isLocked || isLeaveRow} 
                    options={(() => {
                      const filtered = programs
                        .filter((p: any) => !p.isMultiCode)
                        .map((p: any) => {
                          const deptPrefix = (p.departmentCode ?? '').split('-')[0]
                          return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
                        });
                      
                      if (parent.tsProgram && !filtered.some((o) => o.value === parent.tsProgram)) {
                        if (parent.programCode || parent.programName) {
                          const deptPrefix = (parent.departmentCode ?? '').split('-')[0];
                          const prefix = deptPrefix ? `${deptPrefix}-` : '';
                          filtered.unshift({ value: parent.tsProgram, label: `${prefix}${parent.programCode ?? ''} - ${parent.programName ?? ''}` });
                        }
                      }
                      return filtered;
                    })()}
                    onChange={(v) => updateParent(parent.id, { tsProgram: v })} 
                    onBlur={() => {}} 
                    className={cn("h-10 text-[11px]", (isLocked || isLeaveRow) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400")} 
                  />
                </div>
                <div className="flex-1 space-y-0.5">
                  <Label className="text-[11px] text-[#6C5DD3] font-medium">Service / Activity Code <RequiredMark /></Label>
                  <SingleSelectSearchDropdown 
                    value={parent.serviceActivity} 
                    placeholder="Select Activity Code" 
                    disabled={isLocked || isLeaveRow || !parent.tsProgram} 
                    options={(() => {
                      if (!parent.tsProgram) return [];
                      const allowed = getActivitiesForProgram(parent.tsProgram);
                      const filtered = activities
                        .filter((a: any) => allowed.has(String(a.id)))
                        .map((a: any) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));
                      if (parent.serviceActivity && !filtered.some((o) => o.value === parent.serviceActivity)) {
                        const fallback = activities.find((a: any) => String(a.id) === parent.serviceActivity) as any;
                        if (fallback) {
                          filtered.unshift({ value: String(fallback.id), label: `${fallback.code} - ${fallback.name}` });
                        } else if (parent.activityCode || parent.activityName) {
                          filtered.unshift({ value: parent.serviceActivity, label: `${parent.activityCode ?? ''} - ${parent.activityName ?? ''}` });
                        }
                      }
                      return filtered;
                    })()}
                    onChange={(v) => updateParent(parent.id, { serviceActivity: v })} 
                    onBlur={() => {}} 
                    className={cn("h-10 text-[11px]", (isLocked || isLeaveRow || !parent.tsProgram) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400")} 
                  />
                </div>
                {!hideTime && (
                   <TimePicker24h label="End" value={parent.end} disabled={isLocked || isLeaveRow || !parent.start} isLeave={isLeaveRow} onChange={(v) => updateParent(parent.id, { end: v })} />
                )}
                <div className="w-[60px] space-y-0.5">
                  <Label className="text-[11px] text-muted-foreground">Min. <RequiredMark /></Label>
                  <TitleCaseInput readOnly value={totalDisplay} placeholder="—" className={cn("h-10 bg-[#F2F4F7] text-[11px] cursor-not-allowed", isLeaveRow && "border-yellow-400")} />
                </div>
                {!hideNotes && (
                  <div className="flex-[1.5] space-y-0.5">
                    <Label className="text-[11px] text-muted-foreground">Notes </Label>
                    <TitleCaseInput 
                      value={parent.description} 
                      readOnly={isLocked || isLeaveRow}
                      onChange={(e) => updateParent(parent.id, { description: e.target.value })} 
                      placeholder="Notes" 
                      className={cn("h-10 text-[11px] text-[#344054] font-normal", (isLocked || isLeaveRow) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400")} 
                    />
                  </div>
                )}
                {!hideDocs && (
                  <SupportingDocField 
                    parentId={parent.id} 
                    docs={parent.supportingDocs} 
                    uploading={false} 
                    disabled={isLocked || isLeaveRow} 
                    isLeave={isLeaveRow}
                    onAdd={handleAddDocs} 
                    onDelete={handleDeleteDoc} 
                    onDownload={handleDownloadDoc} 
                  />
                )}
                <div className="flex items-end gap-1 pb-0.5">
                  {!readonly && canDeleteParent(parent.id) && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      disabled={isLocked} 
                      className={cn("size-10 text-destructive hover:bg-destructive/10", isLocked && "cursor-not-allowed")} 
                      onClick={() => removeParent(parent.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  {!readonly && !isLeaveRow && (
                    <Button 
                      size="icon" 
                      variant="outline" 
                      disabled={isLocked} 
                      className={cn("size-10 border-[#6C5DD3] text-[#6C5DD3] hover:bg-[#6C5DD3]/10", isLocked && "cursor-not-allowed")} 
                      onClick={() => addSubRow(parent.id)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              {parent.subRows.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-[#6C5DD3]/20 pl-4 ml-8">
                  {parent.subRows.map((sub) => (
                    <div key={sub.id} className={parentFieldRowClass}>
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Program <RequiredMark /></Label>
                        <SingleSelectSearchDropdown 
                          value={sub.studyProgram} 
                          placeholder="Select program" 
                          disabled={isLocked} 
                          options={(() => {
                            const filtered = programs
                              .filter((p: any) => p.isMultiCode)
                              .map((p: any) => {
                                const deptPrefix = (p.departmentCode ?? '').split('-')[0]
                                return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
                              });
                              
                            if (sub.studyProgram && !filtered.some((o) => o.value === sub.studyProgram)) {
                              if (sub.programCode || sub.programName) {
                                const deptPrefix = (sub.departmentCode ?? '').split('-')[0];
                                const prefix = deptPrefix ? `${deptPrefix}-` : '';
                                filtered.unshift({ value: sub.studyProgram, label: `${prefix}${sub.programCode ?? ''} - ${sub.programName ?? ''}` });
                              }
                            }
                            return filtered;
                          })()}
                          onChange={(v) => updateSubRow(parent.id, sub.id, { studyProgram: v })} 
                          onBlur={() => {}} 
                          className={cn("h-9 text-[11px]", isLocked && "bg-[#F2F4F7] cursor-not-allowed")} 
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Activity Code <RequiredMark /></Label>
                        <SingleSelectSearchDropdown 
                          value={sub.serviceActivity} 
                          placeholder="Select Activity Code" 
                          disabled={isLocked || !sub.studyProgram} 
                          options={(() => {
                            if (!sub.studyProgram) return [];
                            const allowed = getActivitiesForProgram(sub.studyProgram);
                            const filtered = activities
                              .filter((a: any) => allowed.has(String(a.id)))
                              .map((a: any) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));
                            if (sub.serviceActivity && !filtered.some((o) => o.value === sub.serviceActivity)) {
                              const fallback = activities.find((a: any) => String(a.id) === sub.serviceActivity) as any;
                              if (fallback) {
                                filtered.unshift({ value: String(fallback.id), label: `${fallback.code} - ${fallback.name}` });
                              } else if (sub.activityCode || sub.activityName) {
                                filtered.unshift({ value: sub.serviceActivity, label: `${sub.activityCode ?? ''} - ${sub.activityName ?? ''}` });
                              }
                            }
                            return filtered;
                          })()}
                          onChange={(v) => updateSubRow(parent.id, sub.id, { serviceActivity: v })} 
                          onBlur={() => {}} 
                          className={cn("h-9 text-[11px]", (isLocked || !sub.studyProgram) && "bg-[#F2F4F7] cursor-not-allowed")} 
                        />
                      </div>
                      <div className="w-[60px] space-y-1">
                        <Label className="text-[11px] text-[#6C5DD3] font-medium">Min. <RequiredMark /></Label>
                        <TitleCaseInput
                          type="number"
                          min="0"
                          value={sub.totalMin}
                          readOnly={isLocked}
                          placeholder="0"
                          className={cn("h-9 text-[11px]", isLocked && "bg-[#F2F4F7] cursor-not-allowed")}
                          onChange={(e) => updateSubRow(parent.id, sub.id, { totalMin: e.target.value })}
                        />
                      </div>
                      {(() => {
                        const hideSubNotes = !!formSettings?.removeDescriptionActivityNote
                        if (hideSubNotes) return null
                        return (
                          <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                                  Notes
                                </Label>
                              </div>
                            <TitleCaseInput 
                              value={sub.description} 
                              readOnly={isLocked}
                              onChange={(e) => updateSubRow(parent.id, sub.id, { description: e.target.value })} 
                              placeholder="Notes" 
                              className={cn("h-9 text-[11px] text-[#344054] font-normal", isLocked && "bg-[#F2F4F7] cursor-not-allowed")} 
                            />
                          </div>
                        )
                      })()}
                      <div className="flex items-end pb-0.5">
                        {!readonly && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            disabled={isLocked} 
                            className={cn("size-9 text-destructive hover:bg-destructive/10", isLocked && "cursor-not-allowed")} 
                            onClick={() => removeSubRow(parent.id, sub.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!readonly && !moveSaveSubmitToTop && (
        <div className="mt-4 flex justify-end gap-2">
          <Button 
            disabled={isLocked || allIsLeave} 
            className={cn("h-10 px-8 bg-[#6C5DD3] hover:bg-[#5B4DBF]", (isLocked || allIsLeave) && "cursor-not-allowed")} 
            onClick={handleSave}
          >
            Save
          </Button>
          <Button 
            disabled={isLocked || allIsLeave} 
            className={cn("h-10 px-8 bg-green-600 hover:bg-green-700 text-white", (isLocked || allIsLeave) && "cursor-not-allowed")} 
            onClick={() => setShowSubmitConfirm(true)}
          >
            Submit
          </Button>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[520px] rounded-[12px] bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-[16px] font-medium text-center">Are you sure, you want to lock the time and fully submit it?</h3>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="h-11 min-w-[100px] bg-[#F2F4F7]" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
              <Button className="h-11 min-w-[100px] bg-[#6C5DD3] text-white" onClick={() => { setShowSubmitConfirm(false); handleSubmitInternal(); }}>OK</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
