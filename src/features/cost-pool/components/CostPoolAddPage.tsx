import { CheckIcon, PlayIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DEPARTMENTS, MOCK_ACTIVITIES_BY_DEPARTMENT } from "../queries/getCostPools"
import type { CostPoolUpsertDialogProps, Department } from "../types"

function renderActivityName(value: string) {
  const end = value.indexOf(")")
  if (value.startsWith("(") && end > 0) {
    const code = value.slice(0, end + 1)
    const rest = value.slice(end + 1)
    return (
      <span className="whitespace-pre-wrap break-words">
        <span className="font-semibold text-[#6C5DD3]">{code}</span>
        <span className="font-semibold text-[#111827]">{rest}</span>
      </span>
    )
  }

  return <span className="font-semibold text-[#111827]">{value}</span>
}

function VisualCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-5 items-center justify-center rounded-[6px] border ${
        checked
          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
          : "border-[#D1D5DB] bg-white text-transparent"
      }`}
    >
      <CheckIcon className="size-4" />
    </span>
  )
}

export function CostPoolAddPage({
  form,
  onSubmit,
  onClose,
  mode,
}: CostPoolUpsertDialogProps) {
  const [unassignedSearch, setUnassignedSearch] = useState("")
  const [assignedSearch, setAssignedSearch] = useState("")
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<string[]>([])
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([])

  const assignedIds = form.watch("assignedActivityIds")
  const department = form.watch("department") as Department | ""
  const hasDepartment = Boolean(department)
  const departmentCount = hasDepartment ? 1 : 0

  const availableActivities = useMemo(() => {
    if (!department) return []
    return MOCK_ACTIVITIES_BY_DEPARTMENT[department] ?? []
  }, [department])

  const assigned = useMemo(
    () => availableActivities.filter((a) => assignedIds.includes(a.id)),
    [availableActivities, assignedIds]
  )
  const unassigned = useMemo(
    () => availableActivities.filter((a) => !assignedIds.includes(a.id)),
    [availableActivities, assignedIds]
  )

  const showUnassignedBody = hasDepartment && unassigned.length > 0

  const filteredUnassigned = useMemo(() => {
    const q = unassignedSearch.trim().toLowerCase()
    if (!q) return unassigned
    return unassigned.filter((a) => a.name.toLowerCase().includes(q))
  }, [unassigned, unassignedSearch])

  const filteredAssigned = useMemo(() => {
    const q = assignedSearch.trim().toLowerCase()
    if (!q) return assigned
    return assigned.filter((a) => a.name.toLowerCase().includes(q))
  }, [assigned, assignedSearch])

  const allUnassignedSelected =
    filteredUnassigned.length > 0 &&
    filteredUnassigned.every((a) => selectedUnassignedIds.includes(a.id))
  const allAssignedSelected =
    filteredAssigned.length > 0 &&
    filteredAssigned.every((a) => selectedAssignedIds.includes(a.id))

  const moveToAssigned = () => {
    if (selectedUnassignedIds.length === 0) return
    const allowed = new Set(availableActivities.map((a) => a.id))
    const nextToAdd = selectedUnassignedIds.filter((id) => allowed.has(id))
    form.setValue(
      "assignedActivityIds",
      Array.from(new Set([...assignedIds, ...nextToAdd]))
    )
    setSelectedUnassignedIds([])
  }

  const moveToUnassigned = () => {
    if (selectedAssignedIds.length === 0) return
    form.setValue(
      "assignedActivityIds",
      assignedIds.filter((id) => !selectedAssignedIds.includes(id))
    )
    setSelectedAssignedIds([])
  }

  return (
    <div className="w-[1150px] max-w-[calc(100vw-2rem)] rounded-[10px] bg-white px-11 py-7 shadow-[0_0_20px_0_#0000001a]">
      <div className="space-y-3">
        <h2 className="text-center text-[25px] text-[#111827]">
          {mode === "edit" ? "Edit Cost Pool" : "Add Cost Pool"}
        </h2>

        <div className="flex items-center justify-end gap-2">
          <Checkbox
            checked={form.watch("active")}
            onCheckedChange={(checked: boolean | "indeterminate") =>
              form.setValue("active", Boolean(checked))
            }
            className="border-[#6C5DD3] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:text-white"
          />
          <span className="text-[13px] text-[#111827]">Active</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="mt-6 space-y-6"
      >
        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-5 space-y-2">
            <Label className="text-[13px] text-[#111827]">Department</Label>
            <Select
              value={form.watch("department") || undefined}
              onValueChange={(value) => {
                form.setValue("department", value)
                form.setValue("assignedActivityIds", [])
                setSelectedUnassignedIds([])
                setSelectedAssignedIds([])
              }}
            >
              <SelectTrigger className="!h-14 w-full rounded-[8px] border-[#E5E7EB] bg-white">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                sideOffset={6}
                align="start"
                className="w-[--radix-select-trigger-width] rounded-[12px] border border-[#EEF0F5] p-2 shadow-[0_10px_30px_rgba(17,24,39,0.12)]"
              >
                {DEPARTMENTS.map((d) => (
                  <SelectItem
                    key={d}
                    value={d}
                    className="rounded-[10px] px-3 py-2.5 text-[14px]  text-[#111827] focus:bg-[#E6F4FF] focus:text-[#111827] data-[state=checked]:bg-[#E6F4FF] data-[state=checked]:font-semibold [&>span:first-child]:hidden"
                  >
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.department?.message ? (
              <p className="text-sm text-destructive">
                {String(form.formState.errors.department.message)}
              </p>
            ) : null}
          </div>

          <div className="col-span-2" />

          <div className="col-span-5 space-y-2">
            <Label className="text-[13px] text-[#111827]">Cost Pool</Label>
            <div
              className={!hasDepartment ? "cursor-not-allowed" : ""}
              aria-disabled={!hasDepartment}
            >
              <Input
                placeholder="Cost Pool Name"
                disabled={!hasDepartment}
                className={[
                  "h-14 rounded-[8px] border-[#E5E7EB]",
                  !hasDepartment
                    ? "pointer-events-none bg-[#F3F4F6] text-[#9CA3AF] placeholder:text-[#9CA3AF]"
                    : "",
                ].join(" ")}
                {...form.register("costPool")}
              />
            </div>
            {form.formState.errors.costPool?.message ? (
              <p className="text-sm text-destructive">
                {String(form.formState.errors.costPool.message)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-5">
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white">
              <div className="flex h-11 items-center justify-between rounded-t-[8px] bg-[#6C5DD3] px-3 text-[14px] text-white">
                <span>Select Activity(Unassigned)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2"
                    onClick={() =>
                      setSelectedUnassignedIds(
                        allUnassignedSelected ? [] : filteredUnassigned.map((a) => a.id)
                      )
                    }
                  >
                    <span className="text-white/90">All</span>
                    <VisualCheckbox checked={allUnassignedSelected} />
                  </button>
                  <span className="inline-flex min-w-6 items-center justify-center rounded-[6px] bg-white/15 px-2 py-0.5 text-[11px]">
                    {departmentCount}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] p-3">
                <Input
                  placeholder=""
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  className="h-12 rounded-[8px] border-[#E5E7EB]"
                />

                {showUnassignedBody ? (
                  <div className="mt-3">
                    <div className="flex h-9 items-center justify-between rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] px-3 text-[12px] font-semibold text-[#111827]">
                      <span>{department}</span>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer"
                        onClick={() =>
                          setSelectedUnassignedIds(
                            allUnassignedSelected ? [] : filteredUnassigned.map((a) => a.id)
                          )
                        }
                      >
                        <VisualCheckbox checked={allUnassignedSelected} />
                      </button>
                    </div>
                    <div className="relative flex h-9 items-center justify-between bg-white px-3">
                      <span className="rounded-[8px] bg-white px-3 py-1 text-[12px] font-semibold text-[#111827] shadow-[0_4px_14px_rgba(17,24,39,0.12)]">
                        Activity
                      </span>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer"
                        onClick={() =>
                          setSelectedUnassignedIds(
                            allUnassignedSelected ? [] : filteredUnassigned.map((a) => a.id)
                          )
                        }
                      >
                        <VisualCheckbox checked={allUnassignedSelected} />
                      </button>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-[18px] bottom-[-12px] h-4 w-px bg-[#9CA3AF]"
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="relative">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute left-[18px] top-[-12px] bottom-0 w-px bg-[#9CA3AF]"
                        />
                        <div>
                        {filteredUnassigned.map((a) => {
                          const checked = selectedUnassignedIds.includes(a.id)
                          return (
                          <div
                            key={a.id}
                            role="button"
                            tabIndex={0}
                            className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left text-[12px] leading-4"
                            onClick={() =>
                              setSelectedUnassignedIds((prev) =>
                                prev.includes(a.id)
                                  ? prev.filter((x) => x !== a.id)
                                  : [...prev, a.id]
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return
                              e.preventDefault()
                              setSelectedUnassignedIds((prev) =>
                                prev.includes(a.id)
                                  ? prev.filter((x) => x !== a.id)
                                  : [...prev, a.id]
                              )
                            }}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="relative pl-7">
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute left-[18px] top-1/2 w-3 -translate-y-1/2 border-t border-[#9CA3AF]"
                                />
                                {renderActivityName(a.name)}
                              </div>
                            </div>
                            <VisualCheckbox checked={checked} />
                          </div>
                          )
                        })}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="mt-3 h-[339px]" />
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col items-center justify-center gap-3 pt-40">
            <Button
              type="button"
              onClick={moveToAssigned}
              className="h-11 w-17 rounded-[10px] bg-[#6C5DD3] px-0 text-white shadow-[0_10px_18px_rgba(108,93,211,0.25)] hover:bg-[#5B4DC5] disabled:opacity-100 disabled:bg-[#6C5DD3]"
              disabled={selectedUnassignedIds.length === 0}
            >
              <PlayIcon className="size-3 fill-white text-white" />
            </Button>
            <Button
              type="button"
              onClick={moveToUnassigned}
              className="h-11 w-17 rounded-[10px] bg-[#6C5DD3] px-0 text-white shadow-[0_10px_18px_rgba(108,93,211,0.25)] hover:bg-[#5B4DC5] disabled:opacity-100 disabled:bg-[#6C5DD3]"
              disabled={selectedAssignedIds.length === 0}
            >
              <PlayIcon className="size-3 rotate-180 fill-white text-white" />
            </Button>
          </div>

          <div className="col-span-5">
            <div className="rounded-[8px] border border-[#E5E7EB] bg-white">
              <div className="flex h-11 items-center justify-between rounded-t-[8px] bg-[#6C5DD3] px-3 text-[14px] text-white">
                <span>Select Activity(Assigned)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2"
                    onClick={() =>
                      setSelectedAssignedIds(
                        allAssignedSelected ? [] : filteredAssigned.map((a) => a.id)
                      )
                    }
                  >
                    <span className="text-white/90">All</span>
                    <VisualCheckbox checked={allAssignedSelected} />
                  </button>
                  <span className="inline-flex min-w-6 items-center justify-center rounded-[6px] bg-white/15 px-2 py-0.5 text-[11px]">
                    {departmentCount}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] p-3">
                <Input
                  placeholder=""
                  value={assignedSearch}
                  onChange={(e) => setAssignedSearch(e.target.value)}
                  className="h-12 rounded-[8px] border-[#E5E7EB]"
                />

                {hasDepartment && assigned.length > 0 ? (
                  <div className="mt-3">
                    <div className="flex h-9 items-center justify-between rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6] px-3 text-[12px] font-semibold text-[#111827]">
                      <span>{department}</span>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer"
                        onClick={() =>
                          setSelectedAssignedIds(
                            allAssignedSelected ? [] : filteredAssigned.map((a) => a.id)
                          )
                        }
                      >
                        <VisualCheckbox checked={allAssignedSelected} />
                      </button>
                    </div>
                    <div className="relative flex h-9 items-center justify-between bg-white px-3">
                      <span className="rounded-[8px] bg-white px-3 py-1 text-[12px] font-semibold text-[#111827] shadow-[0_4px_14px_rgba(17,24,39,0.12)]">
                        Activity
                      </span>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer"
                        onClick={() =>
                          setSelectedAssignedIds(
                            allAssignedSelected ? [] : filteredAssigned.map((a) => a.id)
                          )
                        }
                      >
                        <VisualCheckbox checked={allAssignedSelected} />
                      </button>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-[18px] bottom-[-12px] h-4 w-px bg-[#9CA3AF]"
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="relative">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute left-[18px] top-[-12px] bottom-0 w-px bg-[#9CA3AF]"
                        />
                        <div>
                        {filteredAssigned.map((a) => {
                          const checked = selectedAssignedIds.includes(a.id)
                          return (
                            <div
                              key={a.id}
                              role="button"
                              tabIndex={0}
                              className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left text-[12px] leading-4"
                              onClick={() =>
                                setSelectedAssignedIds((prev) =>
                                  prev.includes(a.id)
                                    ? prev.filter((x) => x !== a.id)
                                    : [...prev, a.id]
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key !== "Enter" && e.key !== " ") return
                                e.preventDefault()
                                setSelectedAssignedIds((prev) =>
                                  prev.includes(a.id)
                                    ? prev.filter((x) => x !== a.id)
                                    : [...prev, a.id]
                                )
                              }}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="relative pl-7">
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-[18px] top-1/2 w-3 -translate-y-1/2 border-t border-[#9CA3AF]"
                                  />
                                  {renderActivityName(a.name)}
                                </div>
                              </div>
                            <VisualCheckbox checked={checked} />
                            </div>
                          )
                        })}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="mt-3 h-[339px]" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            className="h-10 rounded-[10px] bg-[#6C5DD3] px-6 text-white hover:bg-[#5B4DC5]"
          >
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 rounded-[10px] px-6"
            onClick={onClose}
          >
            Exit
          </Button>
        </div>
      </form>
    </div>
  )
}

