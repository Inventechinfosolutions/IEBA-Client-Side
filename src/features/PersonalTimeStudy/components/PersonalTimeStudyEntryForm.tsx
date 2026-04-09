import { Plus, Trash2 } from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const EMPTY = "__empty__"

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
  start: string
  end: string
  tsProgram: string
  serviceActivity: string
  description: string
  supportingDocLabel: string
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

type PersonalTimeStudyEntryFormProps = {
  className?: string
  onSave?: (parents: TimeEntryParentRow[]) => void
  onSubmit?: (parents: TimeEntryParentRow[]) => void
}

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

const parentFieldRowClass =
  "flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"

export function PersonalTimeStudyEntryForm({
  className,
  onSave,
  onSubmit,
}: PersonalTimeStudyEntryFormProps) {
  const [parents, setParents] = useState<TimeEntryParentRow[]>(() => [
    createParent(),
  ])
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

  return (
    <section
      className={cn(
        "w-full rounded-xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-primary/10",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Time entries
        </h2>
        <Button
          type="button"
          size="icon"
          className="size-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Add parent time entry at top"
          onClick={addParentAtTop}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {parents.map((parent) => {
          const totalDisplay = computeDurationMinutes(parent.start, parent.end)

          return (
            <div
              key={parent.id}
              className="rounded-lg border border-border/70 bg-card/50 p-3"
            >
              {/* Parent row */}
              <div className={parentFieldRowClass}>
                <div className="min-w-[140px] flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Start <RequiredMark />
                  </Label>
                  <Input
                    type="time"
                    step={60}
                    value={parent.start}
                    onChange={(e) =>
                      updateParent(parent.id, { start: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="min-w-[160px] flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    TS Program <RequiredMark />
                  </Label>
                  <Select
                    value={parent.tsProgram === "" ? EMPTY : parent.tsProgram}
                    onValueChange={(v) =>
                      updateParent(parent.id, {
                        tsProgram: v === EMPTY ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-full min-w-0">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY}>Select program</SelectItem>
                      <SelectItem value="program-a">Program A</SelectItem>
                      <SelectItem value="program-b">Program B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[160px] flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Service / Activity <RequiredMark />
                  </Label>
                  <Select
                    value={
                      parent.serviceActivity === ""
                        ? EMPTY
                        : parent.serviceActivity
                    }
                    onValueChange={(v) =>
                      updateParent(parent.id, {
                        serviceActivity: v === EMPTY ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 w-full min-w-0">
                      <SelectValue placeholder="Select activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY}>Select activity</SelectItem>
                      <SelectItem value="svc-1">Service 1</SelectItem>
                      <SelectItem value="svc-2">Service 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[140px] flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    End <RequiredMark />
                  </Label>
                  <Input
                    type="time"
                    step={60}
                    value={parent.end}
                    onChange={(e) =>
                      updateParent(parent.id, { end: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="min-w-[100px] max-w-[120px] flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Total (min.) <RequiredMark />
                  </Label>
                  <Input
                    readOnly
                    tabIndex={-1}
                    value={totalDisplay}
                    placeholder="—"
                    className="h-9 cursor-default bg-muted"
                  />
                </div>
                <div className="min-w-[200px] flex-[2] space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Description / activity notes <RequiredMark />
                  </Label>
                  <Input
                    value={parent.description}
                    onChange={(e) =>
                      updateParent(parent.id, { description: e.target.value })
                    }
                    placeholder="Notes"
                    className="h-9"
                  />
                </div>
                <div className="min-w-[140px] flex-1 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Supporting doc
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full justify-center text-xs"
                    onClick={() => {
                      /* file picker — wire later */
                    }}
                  >
                    {parent.supportingDocLabel || "Choose Supporting"}
                  </Button>
                </div>

                <div className="flex shrink-0 items-end gap-1 self-end pb-0.5">
                  {canDeleteParent(parent.id) ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                    className="size-9 shrink-0 border-green-600 text-green-700 hover:bg-green-50"
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
                      <div className="min-w-[160px] flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Time Study Program <RequiredMark />
                        </Label>
                        <Select
                          value={
                            sub.studyProgram === "" ? EMPTY : sub.studyProgram
                          }
                          onValueChange={(v) =>
                            updateSubRow(parent.id, sub.id, {
                              studyProgram: v === EMPTY ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-full min-w-0">
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY}>Select program</SelectItem>
                            <SelectItem value="program-a">Program A</SelectItem>
                            <SelectItem value="program-b">Program B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[160px] flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Service / Activity <RequiredMark />
                        </Label>
                        <Select
                          value={
                            sub.serviceActivity === ""
                              ? EMPTY
                              : sub.serviceActivity
                          }
                          onValueChange={(v) =>
                            updateSubRow(parent.id, sub.id, {
                              serviceActivity: v === EMPTY ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-full min-w-0">
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY}>Select activity</SelectItem>
                            <SelectItem value="svc-1">Service 1</SelectItem>
                            <SelectItem value="svc-2">Service 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[100px] max-w-[120px] flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Total (min.) <RequiredMark />
                        </Label>
                        <Input
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
                      <div className="min-w-[200px] flex-[2] space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Description / activity notes
                        </Label>
                        <Input
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

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          onClick={() => {
            onSave?.(parents)
          }}
        >
          Save
        </Button>
        <Button
          type="button"
          className="bg-green-600 text-white hover:bg-green-600/90"
          onClick={() => {
            onSubmit?.(parents)
          }}
        >
          Submit
        </Button>
      </div>
    </section>
  )
}
