import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import { useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { useGetProgramFormOptions } from "../../queries/getProgramFormOptions"
import type { ProgramActivityRelationFormProps } from "../../types"
import { TransferPanel, type TransferItem } from "./TransferPanel"

export function ProgramActivityRelationForm({ form }: ProgramActivityRelationFormProps) {
  const formOptionsQuery = useGetProgramFormOptions(true)
  const departmentOptions = formOptionsQuery.data?.departmentOptions ?? []
  const departmentIdByName = formOptionsQuery.data?.departmentIdByName ?? {}

  const selectedDepartment = form.watch("programActivityRelationDepartment") || ""
  const selectedDepartmentId = departmentIdByName[selectedDepartment.trim()]
  const selectedProgramName = form.watch("programActivityRelationProgram") || ""

  const { data: timeStudyPrograms = [] } = useQuery({
    queryKey: ["program", "par", "timestudyprograms", selectedDepartmentId],
    enabled: typeof selectedDepartmentId === "number",
    queryFn: async () => {
      const search = new URLSearchParams()
      search.set("page", "1")
      search.set("limit", "100")
      search.set("sort", "ASC")
      search.set("status", "active")
      search.set("departmentId", String(selectedDepartmentId))
      const res = await api.get<any>(`/timestudyprograms?${search.toString()}`)
      const payload = res?.data ?? res
      const list = Array.isArray(payload?.data) ? payload.data : []
      return list as any[]
    },
    staleTime: 60_000,
  })

  const programOptions = useMemo(() => {
    const names = timeStudyPrograms
      .map((p) => String(p?.name ?? "").trim())
      .filter(Boolean)
    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )
  }, [timeStudyPrograms])

  const selectedProgram = useMemo(
    () =>
      timeStudyPrograms.find(
        (p: any) => String(p?.name ?? "").trim() === selectedProgramName.trim()
      ),
    [selectedProgramName, timeStudyPrograms]
  )
  const selectedProgramId = selectedProgram?.id as number | undefined

  const sortOptions = useMemo(() => [], [])

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false)
  const [isProgramOpen, setIsProgramOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null)
  const programDropdownRef = useRef<HTMLDivElement | null>(null)
  const sortDropdownRef = useRef<HTMLDivElement | null>(null)

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

  const { data: activitiesPayload } = useQuery({
    queryKey: activitiesQueryKey,
    enabled: typeof selectedDepartmentId === "number" && typeof selectedProgramId === "number",
    queryFn: async () => {
      const search = new URLSearchParams()
      search.set("departmentId", String(selectedDepartmentId))
      search.set("programId", String(selectedProgramId))
      search.set("method", "activitiesAssignedToProgram")
      search.set("structured", "true")

      // Backend route: GET /timestudyprograms/new/activities
      const res = await api.get<any>(`/timestudyprograms/new/activities?${search.toString()}`)
      const payload = res?.data ?? res
      return payload
    },
    staleTime: 60_000,
  })

  const [assignedIds, setAssignedIds] = useState<string[]>([])

  const allActivities = useMemo<TransferItem[]>(() => {
    const root = activitiesPayload?.data ?? activitiesPayload
    if (!root) return []

    const unassignedRoots = Array.isArray(root.unassignedActivities)
      ? root.unassignedActivities
      : []
    const firstTree = unassignedRoots[0]
    const activityNode = firstTree?.activity?.[0]
    const children = Array.isArray(activityNode?.children) ? activityNode.children : []

    // Initialize assignedIds once when payload changes
    const assignedRoots = Array.isArray(root.assignedActivities)
      ? root.assignedActivities
      : []
    const assignedTree = assignedRoots[0]
    const assignedActivityNode = assignedTree?.activity?.[0]
    const assignedChildren = Array.isArray(assignedActivityNode?.children)
      ? assignedActivityNode.children
      : []
    const initialAssignedIds = assignedChildren.map((node: any) =>
      String(String(node.key).split("-").at(-1) ?? "")
    )
    if (initialAssignedIds.length && assignedIds.length === 0) {
      setAssignedIds(initialAssignedIds)
    }

    return children.map((node: any) => {
      const rawKey = String(node.key)
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

  const departmentInputClass =
    "h-[40px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 !text-[10px] !font-normal text-[#111827] shadow-none placeholder:!text-[10px] placeholder:text-[#b0b8c8] focus-visible:border-[#1595ff] focus-visible:ring-2 focus-visible:ring-[#1595ff33]"

  const programEnabledClass = departmentInputClass
  const programEmptyClass =
    "h-[40px] rounded-[7px] border border-[var(--primary)] bg-white px-3 pr-8 !text-[10px] !font-normal text-[#111827] shadow-none placeholder:!text-[10px] placeholder:text-[#b0b8c8] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[color:rgba(108,93,211,0.22)]"
  const programDisabledClass =
    "h-[40px] rounded-[7px] border border-[#c6cedd] px-3 pr-8 !text-[10px] !font-normal text-[#111827] shadow-none placeholder:!text-[10px] placeholder:text-[#b0b8c8] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"

  return (
    <div
      className="w-full px-1"
      onMouseDownCapture={(event) => {
        const targetNode = event.target as Node

        if (
          isDepartmentOpen &&
          departmentDropdownRef.current &&
          !departmentDropdownRef.current.contains(targetNode)
        ) {
          setIsDepartmentOpen(false)
        }

        if (
          isProgramOpen &&
          programDropdownRef.current &&
          !programDropdownRef.current.contains(targetNode)
        ) {
          setIsProgramOpen(false)
        }

        if (isSortOpen && sortDropdownRef.current && !sortDropdownRef.current.contains(targetNode)) {
          setIsSortOpen(false)
        }
      }}
    >
      <input type="hidden" {...form.register("programActivityRelationDepartment")} />
      <input type="hidden" {...form.register("programActivityRelationProgram")} />
      <input type="hidden" {...form.register("programActivityRelationSort")} />

      <div className="flex w-full items-end justify-between gap-3 py-0.5">
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <div className="w-[180px] space-y-1">
            <label className="block text-[10px] text-[#111827]" htmlFor="par-department-trigger">
              Department
            </label>
            <div className="relative" ref={departmentDropdownRef}>
              <Input
                id="par-department-trigger"
                value={form.watch("programActivityRelationDepartment") || ""}
                readOnly
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsDepartmentOpen((prev) => !prev)}
                onBlur={() => window.setTimeout(() => setIsDepartmentOpen(false), 120)}
                onFocus={() => setIsDepartmentOpen(true)}
                placeholder="Select Department"
                className={departmentInputClass}
              />
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsDepartmentOpen((prev) => !prev)}
                className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
                aria-label="Toggle department options"
              >
                {isDepartmentOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              {isDepartmentOpen ? (
                <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                  {departmentOptions.map((department) => (
                    <button
                      key={department}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
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
                        setIsDepartmentOpen(false)
                      }}
                      className={`block w-full cursor-pointer rounded-[6px] border border-transparent px-3 py-2 text-left !text-[10px] !font-normal text-[#111827] hover:bg-[#f3f4f6] ${
                        form.watch("programActivityRelationDepartment") === department
                          ? "border-[#d8ecff] bg-[#eef8ff]"
                          : ""
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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
              <div className="relative" ref={programDropdownRef}>
                <Input
                  id="par-program-trigger"
                  value={form.watch("programActivityRelationProgram") || ""}
                  readOnly
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsProgramOpen((prev) => !prev)}
                  onBlur={() => window.setTimeout(() => setIsProgramOpen(false), 120)}
                  onFocus={() => setIsProgramOpen(true)}
                  placeholder="Select Program"
                  className={isProgramEmpty ? programEmptyClass : programEnabledClass}
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsProgramOpen((prev) => !prev)}
                  className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
                  aria-label="Toggle program options"
                >
                  {isProgramOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
                {isProgramOpen ? (
                  <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                    {programOptions.length > 0 ? (
                      programOptions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            form.setValue("programActivityRelationProgram", name, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                            setIsProgramOpen(false)
                          }}
                          className={`block w-full cursor-pointer rounded-[6px] border border-transparent px-3 py-2 text-left !text-[10px] !font-normal text-[#111827] hover:bg-[#f3f4f6] ${
                            form.watch("programActivityRelationProgram") === name
                              ? "border-[#d8ecff] bg-[#eef8ff]"
                              : ""
                          }`}
                        >
                          {name}
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#eceff5] bg-white px-3 py-4">
                        <img
                          src={tableEmptyIcon}
                          alt=""
                          className="h-[73px] w-[82px] object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
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
          <div className="relative" ref={sortDropdownRef}>
            <Input
              id="par-sort-trigger"
              value={form.watch("programActivityRelationSort") || ""}
              readOnly
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsSortOpen((prev) => !prev)}
              onBlur={() => window.setTimeout(() => setIsSortOpen(false), 120)}
              onFocus={() => setIsSortOpen(true)}
              placeholder="Sorted dropdown sample"
              aria-label="Sorted dropdown"
              className={departmentInputClass}
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
              aria-label="Toggle sort options"
            >
              {isSortOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {isSortOpen ? (
              <div className="absolute right-0 z-10 mt-1 max-h-[180px] w-full min-w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      form.setValue("programActivityRelationSort", option, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                      setIsSortOpen(false)
                    }}
                    className={`block w-full cursor-pointer rounded-[6px] border border-transparent px-3 py-2 text-left !text-[10px] !font-normal text-[#111827] hover:bg-[#f3f4f6] ${
                      form.watch("programActivityRelationSort") === option
                        ? "border-[#d8ecff] bg-[#eef8ff]"
                        : ""
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
