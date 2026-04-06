import { ChevronLeft, ChevronRight, SearchIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { normalizeMatch } from "@/features/master-code/api"
import { useGetActivityCodeById } from "@/features/master-code/queries/getMasterCodes"

import {
  CountyActivityAddPageMode,
  CountyActivityCatalogMatchDefault,
  CountyActivityGridRowType,
  CountyActivityMasterCodeTypeOptions,
} from "../enums/CountyActivity.enum"
import type { CountyActivityCodeAddPageProps, MatchStatus } from "../types"

function masterMatchToCountyFormMatch(raw: string): MatchStatus {
  const t = normalizeMatch(raw)
  if (!t) return CountyActivityCatalogMatchDefault.NONE
  if (t.length > 5) return CountyActivityCatalogMatchDefault.NONE
  return t
}

export function CountyActivityCodeAddPage({
  form,
  onSubmit,
  onClose,
  mode = CountyActivityAddPageMode.ADD,
  tab: controlledTab,
  onTabChange,
  primaryActivityCodeOptions,
  selectedPrimaryId,
  onSelectedPrimaryIdChange,
  disabledTabs,
  masterCodeOptions = [],
  isMasterCodeOptionsLoading = false,
  departmentNames = [],
  readOnlyPrimaryPicker = false,
  isEditSourceLoading = false,
}: CountyActivityCodeAddPageProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<CountyActivityGridRowType>(
    CountyActivityGridRowType.PRIMARY,
  )
  const tab = controlledTab ?? uncontrolledTab
  const setTab = (next: CountyActivityGridRowType) => {
    onTabChange?.(next)
    if (controlledTab === undefined) setUncontrolledTab(next)
  }
  const [leftSearch, setLeftSearch] = useState("")
  const [rightSearch, setRightSearch] = useState("")
  const [selectedLeft, setSelectedLeft] = useState<string[]>([])
  const [selectedRight, setSelectedRight] = useState<string[]>([])

  const copyCode = form.watch("copyCode")
  const masterCodeType = form.watch("masterCodeType")
  const masterCode = form.watch("masterCode")

  const copyFromMasterEnabled =
    tab === CountyActivityGridRowType.PRIMARY && copyCode && masterCode > 0
  const masterActivityId = String(masterCode)
  const masterActivityQuery = useGetActivityCodeById(masterActivityId, {
    enabled: copyFromMasterEnabled,
  })

  const lastCopiedMasterSyncKeyRef = useRef<string>("")
  useEffect(() => {
    if (!copyFromMasterEnabled) {
      lastCopiedMasterSyncKeyRef.current = ""
      return
    }
    if (!masterActivityQuery.isSuccess || masterActivityQuery.data == null) return
    const syncKey = `${masterActivityQuery.data.id}:${masterActivityQuery.dataUpdatedAt}`
    if (lastCopiedMasterSyncKeyRef.current === syncKey) return

    lastCopiedMasterSyncKeyRef.current = syncKey
    const row = masterActivityQuery.data
    form.setValue("countyActivityCode", (row.code ?? "").trim(), { shouldValidate: true })
    form.setValue("countyActivityName", row.name.trim(), { shouldValidate: true })
    form.setValue("description", (row.activityDescription ?? "").trim(), {
      shouldValidate: true,
    })
    form.setValue("match", masterMatchToCountyFormMatch(row.match), { shouldValidate: true })
    const pct = Number.parseFloat(row.ffpPercent)
    form.setValue("percentage", Number.isFinite(pct) ? pct : 0, { shouldValidate: true })
  }, [
    copyFromMasterEnabled,
    form,
    masterActivityQuery.data,
    masterActivityQuery.dataUpdatedAt,
    masterActivityQuery.isSuccess,
  ])

  const lastCopyLoadErrorToastKeyRef = useRef<string>("")
  useEffect(() => {
    if (
      !copyFromMasterEnabled ||
      !masterActivityQuery.isError ||
      masterActivityQuery.error == null
    ) {
      lastCopyLoadErrorToastKeyRef.current = ""
      return
    }
    const key = `${masterActivityId}:${
      masterActivityQuery.error instanceof Error
        ? masterActivityQuery.error.message
        : "unknown"
    }`
    if (lastCopyLoadErrorToastKeyRef.current === key) return
    lastCopyLoadErrorToastKeyRef.current = key
    toast.error(
      masterActivityQuery.error instanceof Error
        ? masterActivityQuery.error.message
        : "Failed to load activity code",
    )
  }, [
    copyFromMasterEnabled,
    masterActivityId,
    masterActivityQuery.error,
    masterActivityQuery.isError,
  ])

  const primaryFieldsLocked = tab === CountyActivityGridRowType.PRIMARY && copyCode

  const departmentValue = form.watch("department")
  const assignedDepartments = useMemo(() => {
    const value = departmentValue.trim()
    if (!value) return []
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }, [departmentValue])

  const unassignedDepartments = useMemo(
    () => departmentNames.filter((item) => !assignedDepartments.includes(item)),
    [assignedDepartments, departmentNames],
  )

  const filteredUnassigned = useMemo(
    () =>
      unassignedDepartments.filter((item) =>
        item.toLowerCase().includes(leftSearch.trim().toLowerCase()),
      ),
    [leftSearch, unassignedDepartments],
  )
  const filteredAssigned = useMemo(
    () =>
      assignedDepartments.filter((item) =>
        item.toLowerCase().includes(rightSearch.trim().toLowerCase()),
      ),
    [assignedDepartments, rightSearch],
  )

  const moveToAssigned = () => {
    if (selectedLeft.length === 0) return
    const next = [...new Set([...assignedDepartments, ...selectedLeft])]
    form.setValue("department", next.join(", "), { shouldValidate: true })
    setSelectedLeft([])
  }

  const moveToUnassigned = () => {
    if (selectedRight.length === 0) return
    const next = assignedDepartments.filter((item) => !selectedRight.includes(item))
    form.setValue("department", next.join(", "), { shouldValidate: true })
    setSelectedRight([])
  }

  const handleSave = () => {
    if (tab === CountyActivityGridRowType.PRIMARY && assignedDepartments.length === 0) {
      form.setError("department", { message: "Department is required", type: "manual" })
      return
    }
    onSubmit(tab)
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#EBEDF0] bg-white">
      <div className="grid grid-cols-2 border-b border-[#E9EAEC]">
        <button
          type="button"
          disabled={disabledTabs?.primary === true}
          onClick={() => setTab(CountyActivityGridRowType.PRIMARY)}
          className={`h-[62px] text-[18px] font-normal ${
            tab === CountyActivityGridRowType.PRIMARY
              ? "bg-[#6C5DD3] text-white"
              : "bg-white text-[#6C5DD3]"
          } rounded-tl-[10px] ${
            disabledTabs?.primary === true ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          Primary County Activity Code
        </button>
        <button
          type="button"
          disabled={disabledTabs?.sub === true}
          onClick={() => setTab(CountyActivityGridRowType.SUB)}
          className={`h-[62px] text-[18px] font-normal ${
            tab === CountyActivityGridRowType.SUB
              ? "bg-[#6C5DD3] text-white"
              : "bg-white text-[#6C5DD3]"
          } rounded-tr-[18px] ${
            disabledTabs?.sub === true ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          Sub County Activity Code
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
        className="relative space-y-4 p-6"
      >
        {mode === CountyActivityAddPageMode.EDIT && isEditSourceLoading ? (
          <div className="absolute inset-0 z-10 flex min-h-[240px] items-center justify-center rounded-[10px] bg-white/85 text-[16px] text-[#6C5DD3]">
            Loading activity…
          </div>
        ) : null}
        <div
          className={
            mode === CountyActivityAddPageMode.EDIT && isEditSourceLoading
              ? "pointer-events-none opacity-40"
              : ""
          }
        >
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex items-center gap-2 text-[16px] text-[#1F2937]">
              {tab === CountyActivityGridRowType.PRIMARY && (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={copyCode}
                    onCheckedChange={(checked) => form.setValue("copyCode", checked === true)}
                  />
                  <span>Copy Code</span>
                </label>
              )}
            </div>
            <h3 className="whitespace-nowrap text-center text-[22px] max-[1024px]:text-[22px] max-[768px]:text-[18px] font-normal text-[#1F2937]">
              {mode === CountyActivityAddPageMode.EDIT ? "Edit" : "Add"}{" "}
              {tab === CountyActivityGridRowType.PRIMARY ? "Primary" : "Sub"} County Activity
            </h3>
            <div className="flex justify-end">
              <label className="flex items-center gap-2 text-[16px] text-[#1F2937]">
                <Checkbox
                  checked={form.watch("active")}
                  onCheckedChange={(checked) => form.setValue("active", checked === true)}
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          {tab === CountyActivityGridRowType.PRIMARY ? (
            <div className="mt-[35px] grid min-w-0 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">Code Type</label>
                <Select
                  value={masterCodeType.trim() === "" ? undefined : masterCodeType}
                  onValueChange={(value) => {
                    form.setValue("masterCodeType", value)
                    form.setValue("masterCode", 0)
                    if (form.getValues("copyCode")) {
                      form.setValue("countyActivityCode", "")
                      form.setValue("countyActivityName", "")
                      form.setValue("description", "")
                    }
                  }}
                >
                  <SelectTrigger className="data-[size=default]:h-[48px] data-[size=sm]:h-[48px] h-[48px] w-full max-w-full min-w-0 rounded-[10px] border-[#D9D9D9]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={1}
                    avoidCollisions={false}
                    className="w-(--radix-select-trigger-width) max-h-[280px] [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden"
                  >
                    {CountyActivityMasterCodeTypeOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 overflow-hidden space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">Code</label>
                <Select
                  value={
                    form.watch("masterCode") > 0 ? String(form.watch("masterCode")) : ""
                  }
                  onValueChange={(value) => form.setValue("masterCode", Number(value))}
                  disabled={isMasterCodeOptionsLoading || masterCodeOptions.length === 0}
                >
                  <SelectTrigger className="data-[size=default]:h-[48px] data-[size=sm]:h-[48px] h-[48px] w-full max-w-full min-w-0 rounded-[10px] border-[#D9D9D9] [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1 [&_[data-slot=select-value]]:overflow-hidden [&_[data-slot=select-value]]:text-ellipsis [&_[data-slot=select-value]]:whitespace-nowrap [&_[data-slot=select-value]]:text-left">
                    <SelectValue
                      placeholder={
                        isMasterCodeOptionsLoading
                          ? "Loading codes…"
                          : masterCodeOptions.length === 0
                            ? "No codes for this type"
                            : "Select code"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={1}
                    avoidCollisions={false}
                    className="w-(--radix-select-trigger-width) max-h-[280px] [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden"
                  >
                    {masterCodeOptions.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Activity Code
                </label>
                <Input
                  readOnly={primaryFieldsLocked}
                  className={`h-[48px] w-full rounded-[10px] border-[#D9D9D9] ${
                    primaryFieldsLocked ? "cursor-not-allowed bg-muted/50" : ""
                  }`}
                  value={form.watch("countyActivityCode")}
                  onChange={(event) => form.setValue("countyActivityCode", event.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Activity Name
                </label>
                <Input
                  readOnly={primaryFieldsLocked}
                  className={`h-[48px] w-full rounded-[10px] border-[#D9D9D9] ${
                    primaryFieldsLocked ? "cursor-not-allowed bg-muted/50" : ""
                  }`}
                  value={form.watch("countyActivityName")}
                  onChange={(event) => form.setValue("countyActivityName", event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="mt-[40px] grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <div className="min-w-0 overflow-hidden space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Primary Activity Code
                </label>
                <Select
                  value={selectedPrimaryId ?? ""}
                  onValueChange={(value) => onSelectedPrimaryIdChange?.(value)}
                  disabled={readOnlyPrimaryPicker}
                >
                  <SelectTrigger className="data-[size=default]:h-[48px] data-[size=sm]:h-[48px] h-[48px] w-full max-w-full min-w-0 rounded-[10px] border-[#D9D9D9] [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1 [&_[data-slot=select-value]]:overflow-hidden [&_[data-slot=select-value]]:text-ellipsis [&_[data-slot=select-value]]:whitespace-nowrap [&_[data-slot=select-value]]:text-left">
                    <SelectValue placeholder="Select primary activity code" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={1}
                    avoidCollisions={false}
                    className="w-(--radix-select-trigger-width) max-h-[280px] [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden"
                  >
                    {(primaryActivityCodeOptions ?? []).map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Secondary Code
                </label>
                <Input
                  className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                  value={form.watch("countyActivityCode")}
                  onChange={(event) => form.setValue("countyActivityCode", event.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Activity Name
                </label>
                <Input
                  className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                  value={form.watch("countyActivityName")}
                  onChange={(event) => form.setValue("countyActivityName", event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-[30px] space-y-1">
            <label className="text-[14px] font-normal text-[#1F2937]">Description</label>
            <textarea
              readOnly={primaryFieldsLocked}
              className={`min-h-[100px] w-full rounded-[10px] border border-[#D9D9D9] px-4 py-3 text-[15px] outline-none ${
                primaryFieldsLocked ? "cursor-not-allowed bg-muted/50" : ""
              }`}
              value={form.watch("description")}
              onChange={(event) => form.setValue("description", event.target.value)}
            />
          </div>

          {tab === CountyActivityGridRowType.PRIMARY && (
            <div className="grid grid-cols-[minmax(0,1fr)_74px_minmax(0,1fr)] gap-4">
              <div className="w-full overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                <div className="flex h-[44px] items-center justify-between bg-[#6C5DD3] px-4 font-normal text-white">
                  <span className="font-normal">{filteredUnassigned.length} item</span>
                  <span className="font-normal">Unassigned Departments</span>
                </div>
                <div className="space-y-3 p-3">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
                    <Input
                      value={leftSearch}
                      onChange={(event) => setLeftSearch(event.target.value)}
                      placeholder="Search here"
                      className="h-[44px] rounded-[8px] border-[#D9D9D9] pl-9"
                    />
                  </div>
                  <div className="min-h-[165px] space-y-2">
                    {filteredUnassigned.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 text-[14px] font-normal text-[#1F2937]"
                      >
                        <Checkbox
                          checked={selectedLeft.includes(item)}
                          onCheckedChange={(checked) =>
                            setSelectedLeft((prev) =>
                              checked === true
                                ? [...prev, item]
                                : prev.filter((entry) => entry !== item),
                            )
                          }
                        />
                        <span className="font-normal">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-w-[74px] flex-col items-center justify-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  onClick={moveToAssigned}
                  className="h-[38px] w-[62px] rounded-[12px] bg-[#6C5DD3] hover:bg-[#5B4DC5]"
                >
                  <ChevronRight className="size-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  onClick={moveToUnassigned}
                  className="h-[38px] w-[62px] rounded-[12px] bg-[#6C5DD3] hover:bg-[#5B4DC5]"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              </div>

              <div className="w-full overflow-hidden rounded-[12px] border border-[#E5E7EB]">
                <div className="flex h-[44px] items-center justify-between bg-[#6C5DD3] px-4 font-normal text-white">
                  <span className="font-normal">{filteredAssigned.length} item</span>
                  <span className="font-normal">Assigned Departments</span>
                </div>
                <div className="space-y-3 p-3">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
                    <Input
                      value={rightSearch}
                      onChange={(event) => setRightSearch(event.target.value)}
                      placeholder="Search here"
                      className="h-[44px] rounded-[8px] border-[#D9D9D9] pl-9"
                    />
                  </div>
                  <div className="min-h-[165px] space-y-2">
                    {filteredAssigned.length === 0 ? (
                      <p className="pt-8 text-center text-[14px] text-[#9CA3AF]">No data</p>
                    ) : (
                      filteredAssigned.map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 text-[14px] font-normal text-[#1F2937]"
                        >
                          <Checkbox
                            checked={selectedRight.includes(item)}
                            onCheckedChange={(checked) =>
                              setSelectedRight((prev) =>
                                checked === true
                                  ? [...prev, item]
                                  : prev.filter((entry) => entry !== item),
                              )
                            }
                          />
                          <span className="font-normal">{item}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === CountyActivityGridRowType.PRIMARY && form.formState.errors.department && (
            <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>
          )}

          <div className="mt-[70px] flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-[14px] text-[#1F2937]">
                <Checkbox
                  checked={form.watch("leaveCode")}
                  onCheckedChange={(checked) => form.setValue("leaveCode", checked === true)}
                />
                <span>Leave Code?</span>
              </label>
              <label className="flex items-center gap-2 text-[14px] text-[#1F2937]">
                <Checkbox
                  checked={form.watch("docRequired")}
                  onCheckedChange={(checked) => form.setValue("docRequired", checked === true)}
                />
                <span>Documents Required?</span>
              </label>
              <label className="flex items-center gap-2 text-[14px] text-[#A1A1AA]">
                <Checkbox
                  checked={form.watch("multipleJobPools")}
                  onCheckedChange={(checked) =>
                    form.setValue("multipleJobPools", checked === true)
                  }
                />
                <span>Assign Multiple Job Pools?</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={mode === CountyActivityAddPageMode.EDIT && isEditSourceLoading}
                className="h-[45px] rounded-[14px] bg-[#6C5DD3] px-[25px] text-[16px] font-normal text-white hover:bg-[#5B4DC5]"
              >
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="h-[45px] rounded-[14px] bg-[#E5E7EB] px-[25px] text-[16px] font-normal text-[#111827] hover:bg-[#D1D5DB]"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
