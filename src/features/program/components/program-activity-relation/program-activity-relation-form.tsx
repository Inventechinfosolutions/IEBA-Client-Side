import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useGetProgramFormOptions } from "../../queries/get-program-form-options"
import type {
  ProgramActivityRelationFormProps,
  TransferItem,
  TimeStudyProgramOption,
} from "../../types"
import { TransferPanel } from "./transfer-panel"

export function ProgramActivityRelationForm({ form }: ProgramActivityRelationFormProps) {
  // For Program Activity Relation we only need Department lookups.
  // Pass a contextTab and a non-null section so the shared hook
  // skips loading Budget Units and Budget Programs.
  const formOptionsQuery = useGetProgramFormOptions(
    true,
    "Program Activity Relation",
    "Budget Unit"
  )
  const departmentOptions = formOptionsQuery.data?.departmentOptions ?? []
  const departmentIdByName = formOptionsQuery.data?.departmentIdByName ?? {}

  const selectedDepartment = form.watch("programActivityRelationDepartment") || ""
  const selectedDepartmentId = departmentIdByName[selectedDepartment.trim()]
  const selectedProgramName = form.watch("programActivityRelationProgram") || ""

  type TimeStudyProgramsEnvelope = { data?: TimeStudyProgramOption[] }

  const { data: timeStudyProgramsEnvelope } = useQuery<TimeStudyProgramsEnvelope>({
    queryKey: ["program", "par", "timestudyprograms", selectedDepartmentId],
    enabled: typeof selectedDepartmentId === "number",
    queryFn: async () => {
      const search = new URLSearchParams()
      search.set("page", "1")
      search.set("limit", "100")
      search.set("sort", "ASC")
      search.set("status", "active")
      search.set("departmentId", String(selectedDepartmentId))
      const res = await api.get<TimeStudyProgramsEnvelope>(
        `/timestudyprograms?${search.toString()}`
      )
      return (res?.data ?? res) as TimeStudyProgramsEnvelope
    },
    staleTime: 60_000,
  })

  const timeStudyPrograms: TimeStudyProgramOption[] = timeStudyProgramsEnvelope?.data ?? []

  const programOptions = useMemo<string[]>(() => {
    const safePrograms: TimeStudyProgramOption[] = timeStudyPrograms ?? []
    const names: string[] = safePrograms
      .map((p: TimeStudyProgramOption) => String(p?.name ?? "").trim())
      .filter((name): name is string => Boolean(name))

    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    )
  }, [timeStudyPrograms])

  const selectedProgram = useMemo(
    () =>
      timeStudyPrograms.find(
        (p) => String(p?.name ?? "").trim() === selectedProgramName.trim()
      ),
    [selectedProgramName, timeStudyPrograms]
  )
  const selectedProgramId = selectedProgram?.id as number | undefined

  const sortOptions = useMemo(() => [] as string[], [])

  const programDisabled = !selectedDepartment.trim()
  const isProgramEmpty = !programDisabled && programOptions.length === 0

  const queryClient = useQueryClient()

  const activitiesQueryKey = [
    "program",
    "par",
    "activities",
    selectedDepartmentId,
    selectedProgramId,
  ] as const

  type ActivitiesTreeNode = {
    title?: string
    key?: string | number
    children?: ActivitiesTreeNode[]
    assigned?: boolean
    type?: string
    code?: string
    masterCodeType?: string | null
  }

  type ActivitiesResponse = {
    assignedActivities?: Array<{
      key?: number
      title?: string
      activity?: { title?: string; key?: string; children?: ActivitiesTreeNode[] }[]
    }>
    unassignedActivities?: Array<{
      key?: number
      title?: string
      activity?: { title?: string; key?: string; children?: ActivitiesTreeNode[] }[]
    }>
  }

  type ActivitiesEnvelope = { data?: ActivitiesResponse }

  const { data: activitiesPayload } = useQuery<ActivitiesEnvelope>({
    queryKey: activitiesQueryKey,
    enabled: typeof selectedDepartmentId === "number" && typeof selectedProgramId === "number",
    queryFn: async () => {
      const search = new URLSearchParams()
      search.set("departmentId", String(selectedDepartmentId))
      search.set("programId", String(selectedProgramId))
      search.set("method", "activitiesAssignedToProgram")
      search.set("structured", "true")

      // Backend route: GET /timestudyprograms/new/activities
      const res = await api.get<ActivitiesEnvelope>(
        `/timestudyprograms/new/activities?${search.toString()}`
      )
      const payload = res?.data ?? res
      return payload as ActivitiesEnvelope
    },
    staleTime: 60_000,
  })

  const [assignedIds, setAssignedIds] = useState<string[]>([])

  const allActivities = useMemo<TransferItem[]>(() => {
    const root: ActivitiesResponse | undefined = activitiesPayload?.data
    if (!root) return []

    const unassignedRoots = Array.isArray(root?.unassignedActivities)
      ? root.unassignedActivities
      : []
    const firstTree = unassignedRoots[0]
    const activityNode = firstTree?.activity?.[0]
    const children = Array.isArray(activityNode?.children) ? activityNode.children : []

    // Initialize assignedIds once when payload changes
    const assignedRoots = Array.isArray(root?.assignedActivities)
      ? root.assignedActivities
      : []
    const assignedTree = assignedRoots[0]
    const assignedActivityNode = assignedTree?.activity?.[0]
    const assignedChildren: ActivitiesTreeNode[] = Array.isArray(assignedActivityNode?.children)
      ? assignedActivityNode.children
      : []
    const initialAssignedIds = assignedChildren.map((node: ActivitiesTreeNode) =>
      String(String(node.key ?? "").split("-").at(-1) ?? "")
    )
    if (initialAssignedIds.length && assignedIds.length === 0) {
      setAssignedIds(initialAssignedIds)
    }

    return children.map((node: ActivitiesTreeNode) => {
      const rawKey = String(node.key ?? "")
      const numericId = String(rawKey.split("-").at(-1) ?? "")
      return {
        id: numericId,
        name: String(node.title ?? ""),
        code: node.code ? String(node.code) : undefined,
      }
    })
  }, [activitiesPayload, assignedIds.length])

  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")
  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])

  const assignMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!selectedDepartmentId || !selectedProgramId || ids.length === 0) return
      const body = {
        departmentId: selectedDepartmentId,
        programId: selectedProgramId,
        activityIds: ids.map((id) => Number(id)),
      }
      // Backend route: POST /timestudyprograms/assign-activities-to-program
      await api.post(`/timestudyprograms/assign-activities-to-program`, body)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activitiesQueryKey })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!selectedDepartmentId || !selectedProgramId || ids.length === 0) return
      const body = {
        departmentId: selectedDepartmentId,
        programId: selectedProgramId,
        activityIds: ids.map((id) => Number(id)),
      }
      // Backend route: POST /timestudyprograms/unassign-activities-to-programs
      await api.post(`/timestudyprograms/unassign-activities-to-programs`, body)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activitiesQueryKey })
    },
  })

  const getFiltered = (items: TransferItem[], search: string, isAssigned: boolean) => {
    const list = isAssigned ? items.filter((i) => assignedIds.includes(i.id)) : items.filter((i) => !assignedIds.includes(i.id))
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((i) => i.name.toLowerCase().includes(q) || (i.code ?? "").toLowerCase().includes(q))
  }

  const filteredU = useMemo(() => getFiltered(allActivities, searchU, false), [allActivities, assignedIds, searchU])
  const filteredA = useMemo(() => getFiltered(allActivities, searchA, true), [allActivities, assignedIds, searchA])

  const handleTransfer = (idsToTransfer: string[], isMovingToAssigned: boolean) => {
    if (idsToTransfer.length === 0) return
    if (isMovingToAssigned) {
      setAssignedIds((prev) => Array.from(new Set([...prev, ...idsToTransfer])))
      assignMutation.mutate(idsToTransfer)
      setToggledU([])
      return
    }
    setAssignedIds((prev) => prev.filter((id) => !idsToTransfer.includes(id)))
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

        <div className="flex flex-col gap-3 pt-12">
          <button
            type="button"
            onClick={() => handleTransfer(toggledU, true)}
            disabled={toggledU.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed"
            aria-label="Move selected to assigned"
          >
            <ChevronRight className="size-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => handleTransfer(toggledA, false)}
            disabled={toggledA.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed"
            aria-label="Move selected to unassigned"
          >
            <ChevronLeft className="size-5 stroke-[2.5]" />
          </button>
        </div>

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
