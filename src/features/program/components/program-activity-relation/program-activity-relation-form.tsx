import type { Dispatch, SetStateAction } from "react"
import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { cn } from "@/lib/utils"
import { programActivityRelationKeys } from "../../keys"
import { useGetProgramFormOptions } from "../../queries/get-program-form-options"
import {
  assignedIdsFromProgramActivityRelationPayload,
  filterProgramActivityRelationItems,
  mergeProgramActivityRelationTransferItems,
  useProgramActivityRelationActivitiesQuery,
  useProgramActivityRelationMutations,
  useProgramActivityRelationTimeStudyProgramsQuery,
} from "../../queries/program-activity-relation"
import type {
  ProgramActivityRelationFormProps,
  TimeStudyProgramOption,
  TransferItem,
} from "../../types"
import { TransferPanel } from "./transfer-panel"

export function ProgramActivityRelationForm({ form, departmentIds }: ProgramActivityRelationFormProps) {
  const { user } = useAuth()
  const formOptionsQuery = useGetProgramFormOptions(
    true,
    "Program Activity Relation",
    "Budget Unit",
    departmentIds
  )
  const departmentOptions = formOptionsQuery.data?.departmentOptions ?? []
  const departmentIdByName = formOptionsQuery.data?.departmentIdByName ?? {}

  const isSuperAdmin = user?.roles?.some(r => r.toLowerCase() === "super admin") ?? false;
  const isRestrictedRole = (user?.roles?.some(role => {
    const r = role.toLowerCase();
    return r.includes("payroll admin") || 
           r.includes("time study admin") || 
           r.includes("time study supervisor") || 
           r.toLowerCase() === "user";
  }) ?? false) && !isSuperAdmin;

  const selectedDepartment = form.watch("programActivityRelationDepartment") || ""
  const selectedDepartmentId = departmentIdByName[selectedDepartment.trim()]
  const selectedProgramName = form.watch("programActivityRelationProgram") || ""

  const { data: timeStudyProgramsEnvelope } =
    useProgramActivityRelationTimeStudyProgramsQuery(selectedDepartmentId)

  const timeStudyPrograms: TimeStudyProgramOption[] = Array.isArray(timeStudyProgramsEnvelope?.data)
    ? (timeStudyProgramsEnvelope.data as TimeStudyProgramOption[])
    : []

  const programOptions = useMemo(() => {
    const names = timeStudyPrograms
      .map((p) => String(p?.name ?? "").trim())
      .filter((name): name is string => Boolean(name))
    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    )
  }, [timeStudyPrograms])

  const selectedProgram = useMemo(
    () =>
      timeStudyPrograms.find(
        (p) => String(p?.name ?? "").trim() === selectedProgramName.trim(),
      ),
    [selectedProgramName, timeStudyPrograms],
  )
  const selectedProgramId = selectedProgram?.id as number | undefined

  const sortOptions = useMemo(() => [] as string[], [])

  const programDisabled = !selectedDepartment.trim()
  const isProgramEmpty = !programDisabled && programOptions.length === 0

  const activitiesQueryKey = programActivityRelationKeys.activitiesScope(
    selectedDepartmentId,
    selectedProgramId,
  )

  const { data: activitiesPayload } = useProgramActivityRelationActivitiesQuery(
    selectedDepartmentId,
    selectedProgramId,
  )

  const assignedIds = useMemo(
    () =>
      activitiesPayload ? assignedIdsFromProgramActivityRelationPayload(activitiesPayload) : [],
    [activitiesPayload],
  )

  const allActivities = useMemo<TransferItem[]>(
    () =>
      activitiesPayload ? mergeProgramActivityRelationTransferItems(activitiesPayload) : [],
    [activitiesPayload],
  )

  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")
  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])

  const { assignMutation, unassignMutation, applyOptimisticTransfer } =
    useProgramActivityRelationMutations({
      departmentId: selectedDepartmentId,
      programId: selectedProgramId,
      activitiesQueryKey,
    })

  const filteredU = useMemo(
    () => filterProgramActivityRelationItems(allActivities, assignedIds, searchU, false),
    [allActivities, assignedIds, searchU],
  )
  const filteredA = useMemo(
    () => filterProgramActivityRelationItems(allActivities, assignedIds, searchA, true),
    [allActivities, assignedIds, searchA],
  )

  const handleTransfer = (idsToTransfer: string[], isMovingToAssigned: boolean) => {
    if (idsToTransfer.length === 0) return
    applyOptimisticTransfer(idsToTransfer, isMovingToAssigned)
    if (isMovingToAssigned) {
      assignMutation.mutate(idsToTransfer)
      setToggledU([])
      return
    }
    unassignMutation.mutate(idsToTransfer)
    setToggledA([])
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAllUnassigned = () => {
    setToggledU((prev) => (prev.length === filteredU.length ? [] : filteredU.map((a) => a.id)))
  }

  const toggleAllAssigned = () => {
    setToggledA((prev) => (prev.length === filteredA.length ? [] : filteredA.map((a) => a.id)))
  }

  const programDisabledClass =
    "h-[40px] rounded-[7px] border border-[#c6cedd] px-3 pr-8 !text-[10px] !font-normal text-[#111827] shadow-none placeholder:!text-[10px] placeholder:text-[#b0b8c8] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"

  return (
    <div className="w-full px-1">
      <input type="hidden" {...form.register("programActivityRelationDepartment")} />
      <input type="hidden" {...form.register("programActivityRelationProgram")} />
      <input type="hidden" {...form.register("programActivityRelationSort")} />

      <div className="flex w-full items-end justify-between gap-3 py-0.5">
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <div className="w-[180px] space-y-1">
            <label className="block text-[10px] text-[#111827]" htmlFor="par-department-trigger">
              Department
            </label>
            <SingleSelectDropdown
              value={form.watch("programActivityRelationDepartment") ?? ""}
              onChange={(department) => {
                form.setValue("programActivityRelationDepartment", department, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
                form.setValue("programActivityRelationProgram", "", {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }}
              onBlur={() => {}}
              options={departmentOptions.map((d) => ({ value: d, label: d }))}
              placeholder="Select Department"
              className={cn(
                "!min-h-[40px] h-[40px] w-full !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[10px] !font-normal",
                "focus-visible:!border-[#1595ff] focus-visible:!ring-2 focus-visible:!ring-[#1595ff33]",
              )}
              itemButtonClassName="rounded-[6px] border border-transparent px-3 py-2 hover:bg-[#f3f4f6]"
              itemLabelClassName="!text-[10px] !font-normal"
            />
          </div>

          <div className="w-[318px] space-y-1">
            <label className="block text-[10px] text-[#111827]" htmlFor="par-program-trigger">
              Program
            </label>
            {programDisabled ? (
              <Input
                id="par-program-trigger"
                value={form.watch("programActivityRelationProgram") || ""}
                disabled
                readOnly
                tabIndex={-1}
                placeholder="Select Program"
                className={programDisabledClass}
              />
            ) : (
              <SingleSelectDropdown
                value={form.watch("programActivityRelationProgram") ?? ""}
                onChange={(name) => {
                  form.setValue("programActivityRelationProgram", name, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }}
                onBlur={() => {}}
                options={programOptions.map((n) => ({ value: n, label: n }))}
                placeholder="Select Program"
                emptyListSlot={
                  <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#eceff5] bg-white px-3 py-4">
                    <img src={tableEmptyIcon} alt="" className="h-[73px] w-[82px] object-contain" />
                  </div>
                }
                className={cn(
                  "!min-h-[40px] h-[40px] w-full !rounded-[7px] bg-white !px-3 !pr-9 !text-[10px] !font-normal",
                  isProgramEmpty
                    ? "!border-[var(--primary)] focus-visible:!border-[var(--primary)] focus-visible:!ring-2 focus-visible:!ring-[color:rgba(108,93,211,0.22)]"
                    : "!border-[#c6cedd] focus-visible:!border-[#1595ff] focus-visible:!ring-2 focus-visible:!ring-[#1595ff33]",
                )}
                itemButtonClassName="rounded-[6px] border border-transparent px-3 py-2 hover:bg-[#f3f4f6]"
                itemLabelClassName="!text-[10px] !font-normal"
              />
            )}
          </div>
        </div>

        <div className="w-[205px] shrink-0 space-y-1">
          <label
            className="block h-[10px] text-[10px] leading-[10px] text-transparent select-none"
            htmlFor="par-sort-trigger"
          >
            .
          </label>
          <SingleSelectDropdown
            value={form.watch("programActivityRelationSort") ?? ""}
            onChange={(option) => {
              form.setValue("programActivityRelationSort", option, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }}
            onBlur={() => {}}
            options={sortOptions.map((o) => ({ value: o, label: o }))}
            placeholder="Sorted dropdown sample"
            emptyListMessage="No sort options"
            className={cn(
              "!min-h-[40px] h-[40px] w-full !rounded-[7px] !border-[#c6cedd] !px-3 !pr-9 !text-[10px] !font-normal",
              "focus-visible:!border-[#1595ff] focus-visible:!ring-2 focus-visible:!ring-[#1595ff33]",
            )}
            itemButtonClassName="rounded-[6px] border border-transparent px-3 py-2 hover:bg-[#f3f4f6]"
            itemLabelClassName="!text-[10px] !font-normal"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        <TransferPanel
          title="Select Activities(Unassigned)"
          items={filteredU}
          selectedIds={toggledU}
          onToggleItem={(id) => handleToggle(id, setToggledU)}
          onToggleAll={toggleAllUnassigned}
          searchValue={searchU}
          onSearchChange={setSearchU}
          count={filteredU.length}
          isActivity
          selectedDept={selectedDepartment}
        />

        {!isRestrictedRole && (
          <div className="flex flex-col gap-3 pt-10">
            <TransferListMoveButton
              direction="forward"
              disabled={toggledU.length === 0}
              aria-label="Move selected to assigned"
              onClick={() => handleTransfer(toggledU, true)}
            />
            <TransferListMoveButton
              direction="back"
              disabled={toggledA.length === 0}
              aria-label="Move selected to unassigned"
              onClick={() => handleTransfer(toggledA, false)}
            />
          </div>
        )}

        <TransferPanel
          title="Select Activities(Assigned)"
          items={filteredA}
          selectedIds={toggledA}
          onToggleItem={(id) => handleToggle(id, setToggledA)}
          onToggleAll={toggleAllAssigned}
          searchValue={searchA}
          onSearchChange={setSearchA}
          count={filteredA.length}
          isActivity
          selectedDept={selectedDepartment}
        />
      </div>
    </div>
  )
}
