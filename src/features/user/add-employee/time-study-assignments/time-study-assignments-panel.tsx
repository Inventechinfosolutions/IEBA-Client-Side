import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useFormContext } from "react-hook-form"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import type {
  AddEmployeeTimeStudyTransferItem,
  AddEmployeeTimeStudyTransferPanelProps,
  UserModuleFormValues,
} from "../types"

import {
  useGetAddEmployeeActivitiesCatalog,
  useGetAddEmployeeDepartments,
  useGetAddEmployeeTimeStudyPrograms,
} from "../queries/get-add-employee"

function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  searchValue,
  onSearchChange,
  selectedDept,
}: AddEmployeeTimeStudyTransferPanelProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[11px] font-medium text-white">
        <span className="flex-1">
          {title}
        </span>
      </div>

      <div className="border-b border-[#E5E7EB] p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search here"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 rounded-[8px] border-[#E5E7EB] bg-white pl-9 text-[12px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] transition-all"
          />
        </div>
      </div>

      <ScrollArea className="h-[220px] py-2 px-2">
        {items.length > 0 ? (
          <div className="flex flex-col">
            <div className="flex h-7 items-center justify-between bg-[#F3F4F6] px-4 text-[10px] font-semibold text-[#374151]">
              <span>{selectedDept}</span>
            </div>
            <div className="px-6 py-0.5">
              <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                {title.includes("Activities") ? "Activities" : "Programs"}
              </span>
            </div>

            <div className="flex flex-col pb-2">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`group relative flex cursor-pointer items-center justify-between px-9 py-1 text-left transition-colors ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                        <div className="absolute left-4 top-0 h-full w-px bg-[#E5E7EB]" />
                        <div className="absolute left-4 top-1/2 h-px w-3 bg-[#E5E7EB]" />
                      </div>
                      <div className="pl-6 text-[10px] font-medium whitespace-normal break-words">
                        {item.code ? (
                          <>
                            <div className="font-bold text-[#6C5DD3]">({item.code})</div>
                            <div className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                              {item.name}
                            </div>
                          </>
                        ) : (
                          <div className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                            {item.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                        isSelected
                          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                      }`}
                    >
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-20 object-contain opacity-80" />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function filterBySearch(items: AddEmployeeTimeStudyTransferItem[], search: string) {
  const q = search.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      (i.code ?? "").toLowerCase().includes(q) ||
      i.department.toLowerCase().includes(q),
  )
}

function toggleList(prev: string[], id: string) {
  return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
}

/** UI tab: Time Study Assignments */
export function TimeStudyAssignmentsPanel() {
  const departmentsQuery = useGetAddEmployeeDepartments()
  const programsQuery = useGetAddEmployeeTimeStudyPrograms()
  const activitiesQuery = useGetAddEmployeeActivitiesCatalog()

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false)
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null)
  const { register, watch, setValue } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()
  const claimingUnit = (watch("claimingUnit") ?? "").trim()
  const selectedDept = claimingUnit
  const departmentNameOptions = useMemo(
    () => (departmentsQuery.data ?? []).map((d) => d.name).filter((n) => n.length > 0),
    [departmentsQuery.data],
  )

  const programCatalog = useMemo<AddEmployeeTimeStudyTransferItem[]>(() => {
    const rows = programsQuery.data ?? []
    return rows.map((p) => ({
      id: p.id,
      department: p.department,
      code: p.code,
      name: p.name,
    }))
  }, [programsQuery.data])

  const activityCatalog = useMemo<AddEmployeeTimeStudyTransferItem[]>(() => {
    const rows = activitiesQuery.data ?? []
    return rows.map((a) => ({
      id: String(a.id),
      department: claimingUnit,
      code: a.activityCode,
      name: a.name,
    }))
  }, [activitiesQuery.data, claimingUnit])

  const [searchProgramsU, setSearchProgramsU] = useState("")
  const [searchProgramsA, setSearchProgramsA] = useState("")
  const [searchActivitiesU, setSearchActivitiesU] = useState("")
  const [searchActivitiesA, setSearchActivitiesA] = useState("")

  const [assignedProgramIds, setAssignedProgramIds] = useState<string[]>([])
  const [assignedActivityIds, setAssignedActivityIds] = useState<string[]>([])
  const [toggledProgramsU, setToggledProgramsU] = useState<string[]>([])
  const [toggledProgramsA, setToggledProgramsA] = useState<string[]>([])
  const [toggledActivitiesU, setToggledActivitiesU] = useState<string[]>([])
  const [toggledActivitiesA, setToggledActivitiesA] = useState<string[]>([])

  const deptPrograms = useMemo(
    () => programCatalog.filter((p) => p.department === selectedDept),
    [programCatalog, selectedDept],
  )
  const deptActivities = useMemo(() => {
    if (!selectedDept) return []
    return activityCatalog.filter((a) => a.department === selectedDept)
  }, [activityCatalog, selectedDept])

  const programsUnassigned = useMemo(
    () => deptPrograms.filter((p) => !assignedProgramIds.includes(p.id)),
    [deptPrograms, assignedProgramIds],
  )
  const programsAssigned = useMemo(
    () => deptPrograms.filter((p) => assignedProgramIds.includes(p.id)),
    [deptPrograms, assignedProgramIds],
  )
  const activitiesUnassigned = useMemo(
    () => deptActivities.filter((a) => !assignedActivityIds.includes(a.id)),
    [deptActivities, assignedActivityIds],
  )
  const activitiesAssigned = useMemo(
    () => deptActivities.filter((a) => assignedActivityIds.includes(a.id)),
    [deptActivities, assignedActivityIds],
  )

  const filteredProgramsU = useMemo(
    () => filterBySearch(programsUnassigned, searchProgramsU),
    [programsUnassigned, searchProgramsU],
  )
  const filteredProgramsA = useMemo(
    () => filterBySearch(programsAssigned, searchProgramsA),
    [programsAssigned, searchProgramsA],
  )
  const filteredActivitiesU = useMemo(
    () => filterBySearch(activitiesUnassigned, searchActivitiesU),
    [activitiesUnassigned, searchActivitiesU],
  )
  const filteredActivitiesA = useMemo(
    () => filterBySearch(activitiesAssigned, searchActivitiesA),
    [activitiesAssigned, searchActivitiesA],
  )

  const transferProgramsToAssigned = () => {
    if (toggledProgramsU.length === 0) return
    setAssignedProgramIds((prev) => Array.from(new Set([...prev, ...toggledProgramsU])))
    setToggledProgramsU([])
  }
  const transferProgramsToUnassigned = () => {
    if (toggledProgramsA.length === 0) return
    setAssignedProgramIds((prev) => prev.filter((id) => !toggledProgramsA.includes(id)))
    setToggledProgramsA([])
  }

  const transferActivitiesToAssigned = () => {
    if (toggledActivitiesU.length === 0) return
    setAssignedActivityIds((prev) => Array.from(new Set([...prev, ...toggledActivitiesU])))
    setToggledActivitiesU([])
  }
  const transferActivitiesToUnassigned = () => {
    if (toggledActivitiesA.length === 0) return
    setAssignedActivityIds((prev) => prev.filter((id) => !toggledActivitiesA.includes(id)))
    setToggledActivitiesA([])
  }

  const matchedTextClass = "!text-[11px] !leading-[16px] font-normal"
  const labelClassName = "mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]"
  const inputClassName =
    `h-[46px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 ${matchedTextClass} text-[#111827] shadow-none placeholder:!text-[11px] placeholder:!leading-[16px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#6C5DD3] focus-visible:ring-0`

  return (
    <div
      className="pt-2"
      onMouseDownCapture={(event) => {
        const target = event.target as Node
        if (
          isDepartmentOpen &&
          departmentDropdownRef.current &&
          !departmentDropdownRef.current.contains(target)
        ) {
          setIsDepartmentOpen(false)
        }
      }}
    >
      <p className="mb-4 select-none text-[12px] font-semibold uppercase text-[#111827]">
        {employeeName}
      </p>

      <div className="flex items-end justify-between gap-6">
        <div className="w-full max-w-[306px]">
          <label className={`${labelClassName} cursor-pointer`} onClick={() => setIsDepartmentOpen(true)}>
            Department
          </label>
          <div ref={departmentDropdownRef} className="group/selector relative">
            <Input
              value={selectedDept}
              placeholder={departmentNameOptions.length === 0 ? "No departments loaded" : "Select department"}
              readOnly
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsDepartmentOpen((prev) => !prev)}
              onFocus={() => setIsDepartmentOpen(true)}
              onBlur={() => window.setTimeout(() => setIsDepartmentOpen(false), 120)}
              className={cn(
                inputClassName,
                "cursor-pointer select-none caret-transparent",
                isDepartmentOpen ? "border-[#3b82f6] ring-1 ring-[#3b82f640]" : "",
              )}
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsDepartmentOpen((prev) => !prev)}
              className="absolute right-0 top-0 inline-flex h-full w-[20px] cursor-pointer items-center justify-center text-[#6b7280]"
              aria-label="Toggle department options"
            >
              {isDepartmentOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {isDepartmentOpen ? (
              <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                {departmentNameOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setValue("claimingUnit", option)
                      setIsDepartmentOpen(false)
                    }}
                    className={cn(
                      `block w-full cursor-pointer rounded-[5px] px-2.5 py-1.5 text-left ${matchedTextClass} text-[#111827] hover:bg-[#edf5ff]`,
                      selectedDept === option ? "bg-[#dbeafe] font-normal" : "",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="select-none text-[11px] font-medium text-[#2a2f3a]">TS Minutes/Day</label>
          <div className="flex h-[46px] items-center rounded-[7px] border border-[#d2d8e3] bg-white px-3">
            <Input
              {...register("tsMinDay")}
              className="h-auto w-[70px] border-0 bg-transparent p-0 text-[12px] text-[#111827] shadow-none focus-visible:ring-0"
              placeholder="480"
            />
            <span className="ml-6 select-none text-[11px] text-[#2a2f3a]">Min/Day</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        <TransferPanel
          title="Select TS Programs(Unassigned)"
          items={filteredProgramsU}
          selectedIds={toggledProgramsU}
          onToggleItem={(id) => setToggledProgramsU((prev) => toggleList(prev, id))}
          searchValue={searchProgramsU}
          onSearchChange={setSearchProgramsU}
          selectedDept={selectedDept}
        />

        <div className="flex flex-col gap-3 pt-10">
          <button
            type="button"
            onClick={transferProgramsToAssigned}
            disabled={toggledProgramsU.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-[#6C5DD3] disabled:text-white"
            aria-label="Move selected programs to assigned"
          >
            <ChevronRight className="size-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={transferProgramsToUnassigned}
            disabled={toggledProgramsA.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-[#6C5DD3] disabled:text-white"
            aria-label="Move selected programs to unassigned"
          >
            <ChevronLeft className="size-5 stroke-[2.5]" />
          </button>
        </div>

        <TransferPanel
          title="Select TS Programs(Assigned)"
          items={filteredProgramsA}
          selectedIds={toggledProgramsA}
          onToggleItem={(id) => setToggledProgramsA((prev) => toggleList(prev, id))}
          searchValue={searchProgramsA}
          onSearchChange={setSearchProgramsA}
          selectedDept={selectedDept}
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        <TransferPanel
          title="Select Activities(Unassigned)"
          items={filteredActivitiesU}
          selectedIds={toggledActivitiesU}
          onToggleItem={(id) => setToggledActivitiesU((prev) => toggleList(prev, id))}
          searchValue={searchActivitiesU}
          onSearchChange={setSearchActivitiesU}
          selectedDept={selectedDept}
        />

        <div className="flex flex-col gap-3 pt-10">
          <button
            type="button"
            onClick={transferActivitiesToAssigned}
            disabled={toggledActivitiesU.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-[#6C5DD3] disabled:text-white"
            aria-label="Move selected activities to assigned"
          >
            <ChevronRight className="size-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={transferActivitiesToUnassigned}
            disabled={toggledActivitiesA.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-[#6C5DD3] disabled:text-white"
            aria-label="Move selected activities to unassigned"
          >
            <ChevronLeft className="size-5 stroke-[2.5]" />
          </button>
        </div>

        <TransferPanel
          title="Select Activities(Assigned)"
          items={filteredActivitiesA}
          selectedIds={toggledActivitiesA}
          onToggleItem={(id) => setToggledActivitiesA((prev) => toggleList(prev, id))}
          searchValue={searchActivitiesA}
          onSearchChange={setSearchActivitiesA}
          selectedDept={selectedDept}
        />
      </div>
    </div>
  )
}
