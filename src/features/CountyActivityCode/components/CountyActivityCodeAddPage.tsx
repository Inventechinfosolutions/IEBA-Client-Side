import { ChevronLeft, ChevronRight, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGetActivityCodeById } from "@/features/master-code/queries/getMasterCodes"

import {
  normalizeCatalogMatchForCountyActivityGrid,
  parseMasterCodeDisplay,
} from "../api/countyActivityApi"
import {
  CountyActivityAddPageMode,
  CountyActivityGridRowType,
} from "../enums/CountyActivity.enum"
import type {
  ApiActivityNestedDepartmentResDto,
  CountyActivityAddFormMergeContext,
  CountyActivityAddFormValues,
  CountyActivityCodeAddPageProps,
} from "../types"


function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function mergeCountyActivityAddFormForSubmit(
  raw: CountyActivityAddFormValues,
  ctx: CountyActivityAddFormMergeContext,
): CountyActivityAddFormValues {
  let v = { ...raw }
  if (ctx.copyFromMasterEnabled && ctx.masterRow) {
    const row = ctx.masterRow
    const pct = Number.parseFloat(row.ffpPercent)
    v = {
      ...v,
      countyActivityCode: (row.code ?? "").trim(),
      countyActivityName: row.name.trim(),
      description: stripHtmlTags((row.activityDescription ?? "").trim()),
      match: normalizeCatalogMatchForCountyActivityGrid(row.match),
      percentage: Number.isFinite(pct) ? pct : 0,
    }
  }
  if (
    ctx.tab === CountyActivityGridRowType.SUB &&
    ctx.selectedPrimaryId?.trim() &&
    ctx.subParentDetail &&
    String(ctx.subParentDetail.activity.id) === ctx.selectedPrimaryId.trim()
  ) {
    const { activity, departmentNames } = ctx.subParentDetail
    v = {
      ...v,
      masterCodeType: activity.activityCodeType.trim(),
      masterCode: parseMasterCodeDisplay(activity.activityCode),
      department:
        departmentNames.length > 0 ? departmentNames.join(", ") : v.department,
    }
  }
  return v
}

export function CountyActivityCodeAddPage({
  form,
  readOnly = false,
  onAddSave,
  onEditSave,
  onClose,
  mode = CountyActivityAddPageMode.ADD,
  tab: controlledTab,
  onTabChange,
  primaryActivityCodeOptions,
  selectedPrimaryId,
  onSelectedPrimaryIdChange,
  disabledTabs,
  masterCodeTypeOptions = [],
  isMasterCodeTypeOptionsLoading = false,
  masterCodeOptions = [],
  isMasterCodeOptionsLoading = false,
  departmentNames = [],
  initialDepartmentShuttle,
  readOnlyPrimaryPicker = false,
  isEditSourceLoading = false,
  subParentActivityDetail = null,
  apportioningDepartments: _apportioningDepartments = [],
  isSubmitting = false,
  onCodeDropdownOpen,
  onCodeTypeDropdownOpen,
  onPrimaryPickerDropdownOpen,
}: CountyActivityCodeAddPageProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<CountyActivityGridRowType>(
    CountyActivityGridRowType.PRIMARY,
  )
  const tab = controlledTab ?? uncontrolledTab
  const isReadOnly = readOnly === true
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

  const codeTypeSelectItems = useMemo(() => {
    const fromApi = [...masterCodeTypeOptions]
    const current = masterCodeType.trim()
    if (current.length > 0 && !fromApi.includes(current)) {
      fromApi.push(current)
    }
    return fromApi.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    )
  }, [masterCodeTypeOptions, masterCodeType])

  const copyFromMasterEnabled =
    tab === CountyActivityGridRowType.PRIMARY && copyCode && masterCode > 0
  const masterActivityId = String(masterCode)
  const masterActivityQuery = useGetActivityCodeById(masterActivityId, {
    enabled: copyFromMasterEnabled,
  })

  const masterRowForCopy = masterActivityQuery.data

  const primaryFieldsLocked = tab === CountyActivityGridRowType.PRIMARY && copyCode

  const displayCountyActivityCode =
    primaryFieldsLocked && masterRowForCopy
      ? (masterRowForCopy.code ?? "").trim()
      : form.watch("countyActivityCode")

  const displayCountyActivityName =
    primaryFieldsLocked && masterRowForCopy
      ? masterRowForCopy.name.trim()
      : form.watch("countyActivityName")

  const displayDescription =
    primaryFieldsLocked && masterRowForCopy
      ? stripHtmlTags((masterRowForCopy.activityDescription ?? "").trim())
      : form.watch("description")

  const departmentValue = form.watch("department")

  const departmentCatalogByName = useMemo(() => {
    const map = new Map<string, ApiActivityNestedDepartmentResDto>()
    if (initialDepartmentShuttle) {
      for (const d of [...initialDepartmentShuttle.assigned, ...initialDepartmentShuttle.unassigned]) {
        map.set(d.name, d)
      }
      return map
    }
    for (const name of departmentNames) {
      map.set(name, { id: 0, code: "", name, status: "active" })
    }
    return map
  }, [departmentNames, initialDepartmentShuttle])

  const assignedDepartmentRows = useMemo((): ApiActivityNestedDepartmentResDto[] => {
    const value = departmentValue.trim()
    if (!value) return []
    const names = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    return names.map(
      (name) =>
        departmentCatalogByName.get(name) ?? { id: 0, code: "", name, status: "active" },
    )
  }, [departmentCatalogByName, departmentValue])

  const unassignedDepartmentRows = useMemo((): ApiActivityNestedDepartmentResDto[] => {
    const assignedNames = new Set(assignedDepartmentRows.map((d) => d.name))
    return [...departmentCatalogByName.values()].filter((d) => !assignedNames.has(d.name))
  }, [assignedDepartmentRows, departmentCatalogByName])

  const assignedDepartments = useMemo(
    () => assignedDepartmentRows.map((d) => d.name),
    [assignedDepartmentRows],
  )

  const showBhsaSection = useMemo(() => {
    if (tab === CountyActivityGridRowType.SUB) {
      if (mode === CountyActivityAddPageMode.EDIT) {
        return assignedDepartments.some(
          (name) => name.trim().toLowerCase() === "behavioral health",
        )
      } else {
        const parentDepts = subParentActivityDetail?.departmentNames ?? []
        return parentDepts.some(
          (name) => name.trim().toLowerCase() === "behavioral health",
        )
      }
    }
    return assignedDepartments.some(
      (name) => name.trim().toLowerCase() === "behavioral health",
    )
  }, [tab, mode, assignedDepartments, subParentActivityDetail])

  const unassignedDepartments = useMemo(
    () => unassignedDepartmentRows.map((d) => d.name),
    [unassignedDepartmentRows],
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

  const assignCountyActivityDepartmentsFromPicker = () => {
    if (selectedLeft.length === 0) return
    const next = [...new Set([...assignedDepartments, ...selectedLeft])]
    form.setValue("department", next.join(", "), { shouldValidate: true })
    setSelectedLeft([])
  }

  const removeCountyActivityDepartmentsFromPicker = () => {
    if (selectedRight.length === 0) return
    const next = assignedDepartments.filter((item) => !selectedRight.includes(item))
    form.setValue("department", next.join(", "), { shouldValidate: true })
    setSelectedRight([])
  }
  const handleCountyActivityAddOrEditSave = () => {
    if (isReadOnly) return
    // Copy-from-master shows master values in the UI but RHF state can still be empty; Zod runs
    // inside handleSubmit before our merge callback, so we sync master row into the form first.
    if (tab === CountyActivityGridRowType.PRIMARY && copyFromMasterEnabled) {
      if (masterActivityQuery.isPending || masterActivityQuery.isFetching) {
        toast.error("Wait for the activity code to finish loading.")
        return
      }
      if (!masterRowForCopy) {
        toast.error("Could not load activity code to copy. Try again.")
        return
      }
      const row = masterRowForCopy
      flushSync(() => {
        form.setValue("countyActivityCode", (row.code ?? "").trim(), {
          shouldValidate: false,
          shouldDirty: true,
        })
        form.setValue("countyActivityName", row.name.trim(), {
          shouldValidate: false,
          shouldDirty: true,
        })
        form.setValue("description", stripHtmlTags((row.activityDescription ?? "").trim()), {
          shouldValidate: false,
          shouldDirty: true,
        })
        form.setValue("match", normalizeCatalogMatchForCountyActivityGrid(row.match), {
          shouldValidate: false,
          shouldDirty: true,
        })
        const pct = Number.parseFloat(row.ffpPercent)
        form.setValue("percentage", Number.isFinite(pct) ? pct : 0, {
          shouldValidate: false,
          shouldDirty: true,
        })
      })
    }

    if (mode === CountyActivityAddPageMode.EDIT) {
      if (tab === CountyActivityGridRowType.PRIMARY && assignedDepartments.length === 0) {
        form.setError("department", { message: "Department is required", type: "manual" })
        toast.error("Department is required")
        return
      }
      onEditSave?.()
      return
    }

    if (tab === CountyActivityGridRowType.PRIMARY && assignedDepartments.length === 0) {
      form.setError("department", { message: "Department is required", type: "manual" })
      toast.error("Department is required")
      return
    }

    submitAdd()
  }

  const submitAdd = () => {
    form.handleSubmit(
      (raw) => {
        const values = mergeCountyActivityAddFormForSubmit(raw, {
          tab,
          copyFromMasterEnabled,
          masterRow: masterRowForCopy,
          subParentDetail: subParentActivityDetail,
          selectedPrimaryId,
        })
        onAddSave?.(tab, values)
      },
      (errors) => {
        console.error("Add validation errors:", errors)
        toast.error("Please fill all required fields correctly.")
      },
    )()
  }


  return (
    <div className="overflow-hidden rounded-[10px] border border-[#EBEDF0] bg-white">
      <div className="grid grid-cols-2 border-b border-[#E9EAEC]">
        <button
          type="button"
          disabled={disabledTabs?.primary === true}
          onClick={() => setTab(CountyActivityGridRowType.PRIMARY)}
          className={`h-[62px] text-[18px] font-normal ${tab === CountyActivityGridRowType.PRIMARY
            ? "bg-[#6C5DD3] text-white"
            : "bg-white text-[#6C5DD3]"
            } rounded-tl-[10px] ${disabledTabs?.primary === true ? "cursor-not-allowed opacity-60" : ""
            }`}
        >
          Primary County Activity Code
        </button>
        <button
          type="button"
          disabled={disabledTabs?.sub === true}
          onClick={() => setTab(CountyActivityGridRowType.SUB)}
          className={`h-[62px] text-[18px] font-normal ${tab === CountyActivityGridRowType.SUB
            ? "bg-[#6C5DD3] text-white"
            : "bg-white text-[#6C5DD3]"
            } rounded-tr-[18px] ${disabledTabs?.sub === true ? "cursor-not-allowed opacity-60" : ""
            }`}
        >
          Sub County Activity Code
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleCountyActivityAddOrEditSave()
        }}
        className="relative space-y-4 p-6"
      >
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-b-[10px] bg-white/60">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        <div
          className={
            mode === CountyActivityAddPageMode.EDIT && isEditSourceLoading
              ? "pointer-events-none opacity-40"
              : ""
          }
        >
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex flex-col gap-1 text-[16px] text-[#1F2937]">
              {tab === CountyActivityGridRowType.PRIMARY && (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    disabled={isReadOnly}
                    checked={copyCode}
                    onCheckedChange={(checked) => form.setValue("copyCode", checked === true)}
                  />
                  <span>Copy Code</span>
                </label>
              )}
              {copyFromMasterEnabled && masterActivityQuery.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {masterActivityQuery.error instanceof Error
                    ? masterActivityQuery.error.message
                    : "Failed to load activity code"}
                </p>
              ) : null}
            </div>
            <h3 className="whitespace-nowrap text-center text-[22px] max-[1024px]:text-[22px] max-[768px]:text-[18px] font-normal text-[#1F2937]">
              {isReadOnly ? "View" : mode === CountyActivityAddPageMode.EDIT ? "Edit" : "Add"}{" "}
              {tab === CountyActivityGridRowType.PRIMARY ? "Primary" : "Sub"} County Activity
            </h3>
            <div className="flex justify-end">
              <label className="flex items-center gap-2 text-[16px] text-[#1F2937]">
                <Checkbox
                  disabled={isReadOnly}
                  checked={form.watch("active")}
                  onCheckedChange={(checked) => form.setValue("active", checked === true)}
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          {isReadOnly && (
            <div className="mx-auto w-[500px] mt-4 rounded-[8px] bg-amber-50 border border-amber-200 p-3 text-amber-800 text-[14px] font-medium flex items-center justify-center gap-2">
              <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Auto-created manual activity cannot be modified
            </div>
          )}

          {tab === CountyActivityGridRowType.PRIMARY ? (
            <div className="mt-[35px] grid min-w-0 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">Code Type</label>
                <Select
                  value={masterCodeType.trim() === "" ? undefined : masterCodeType}
                  disabled={isReadOnly}
                  onValueChange={(value) => {
                    form.setValue("masterCodeType", value)
                    form.setValue("masterCode", 0)
                    if (form.getValues("copyCode")) {
                      form.setValue("countyActivityCode", "")
                      form.setValue("countyActivityName", "")
                      form.setValue("description", "")
                    }
                  }}
                  onOpenChange={(open) => {
                    if (open) onCodeTypeDropdownOpen?.()
                  }}
                >
                  <SelectTrigger className="data-[size=default]:h-[48px] data-[size=sm]:h-[48px] h-[48px] w-full max-w-full min-w-0 rounded-[10px] border-[#D9D9D9]">
                    <SelectValue
                      placeholder={
                        isMasterCodeTypeOptionsLoading
                          ? "Loading types…"
                          : "Select type"
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
                    {isMasterCodeTypeOptionsLoading && codeTypeSelectItems.length === 0 ? (
                      <div className="flex items-center justify-center p-2 text-sm text-gray-500">
                        <Spinner className="h-4 w-4 text-[#6C5DD3] mr-2" />
                        Loading types…
                      </div>
                    ) : codeTypeSelectItems.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No types available
                      </div>
                    ) : (
                      codeTypeSelectItems.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 overflow-hidden space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">Code</label>
                <SingleSelectDropdown
                  value={
                    form.watch("masterCode") > 0 ? String(form.watch("masterCode")) : ""
                  }
                  onChange={(value) => form.setValue("masterCode", Number(value))}
                  onBlur={() => { }}
                  onOpenChange={(open) => {
                    if (open) onCodeDropdownOpen?.()
                  }}
                  options={masterCodeOptions.map((item) => ({
                    value: String(item.value),
                    label: item.label,
                  }))}
                  placeholder="Select code"
                  isLoading={isMasterCodeOptionsLoading}
                  loadingLabel="Loading codes…"
                  disabled={isReadOnly || (!isMasterCodeOptionsLoading && masterCodeOptions.length === 0)}
                  className="h-[48px] rounded-[10px] border-[#D9D9D9] text-[14px]"
                  contentClassName="z-[200]"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Activity Code
                </label>
                <TitleCaseInput
                  readOnly={isReadOnly || primaryFieldsLocked}
                  className={`h-[48px] w-full rounded-[10px] border-[#D9D9D9] ${(isReadOnly || primaryFieldsLocked) ? "cursor-not-allowed bg-muted/50" : ""
                    }`}
                  value={displayCountyActivityCode}
                  onChange={(event) =>
                    (isReadOnly || primaryFieldsLocked)
                      ? undefined
                      : form.setValue("countyActivityCode", event.target.value)
                  }
                />
                {form.formState.errors.countyActivityCode && (
                  <p className="text-[12px] text-red-500">
                    {form.formState.errors.countyActivityCode.message}
                  </p>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Activity Name
                </label>
                <TitleCaseInput
                  readOnly={isReadOnly || primaryFieldsLocked}
                  className={`h-[48px] w-full rounded-[10px] border-[#D9D9D9] ${(isReadOnly || primaryFieldsLocked) ? "cursor-not-allowed bg-muted/50" : ""
                    }`}
                  value={displayCountyActivityName}
                  onChange={(event) =>
                    (isReadOnly || primaryFieldsLocked)
                      ? undefined
                      : form.setValue("countyActivityName", event.target.value)
                  }
                />
                {form.formState.errors.countyActivityName && (
                  <p className="text-[12px] text-red-500">
                    {form.formState.errors.countyActivityName.message}
                  </p>
                )}
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
                  disabled={isReadOnly || readOnlyPrimaryPicker}
                  onOpenChange={(open) => {
                    if (open) onPrimaryPickerDropdownOpen?.()
                  }}
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
                    <TooltipProvider delayDuration={100}>
                      {(primaryActivityCodeOptions ?? []).map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block max-w-[245px] truncate">
                                {item.label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              align="center"
                              sideOffset={10}
                              className="z-[300]"
                            >
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        </SelectItem>
                      ))}
                    </TooltipProvider>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Secondary Code
                </label>
                <TitleCaseInput
                  readOnly={isReadOnly}
                  className={`h-[48px] w-full rounded-[10px] border-[#D9D9D9] ${isReadOnly ? "cursor-not-allowed bg-muted/50" : ""}`}
                  value={form.watch("countyActivityCode")}
                  onChange={(event) => isReadOnly ? undefined : form.setValue("countyActivityCode", event.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[14px] font-normal text-[#1F2937]">
                  Activity Name
                </label>
                <TitleCaseInput
                  readOnly={isReadOnly}
                  className={`h-[48px] w-full rounded-[10px] border-[#D9D9D9] ${isReadOnly ? "cursor-not-allowed bg-muted/50" : ""}`}
                  value={form.watch("countyActivityName")}
                  onChange={(event) => isReadOnly ? undefined : form.setValue("countyActivityName", event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-[30px] space-y-1">
            <label className="text-[14px] font-normal text-[#1F2937]">Description</label>
            <textarea
              readOnly={isReadOnly || primaryFieldsLocked}
              className={`min-h-[100px] w-full rounded-[10px] border border-[#D9D9D9] px-4 py-3 text-[15px] outline-none ${(isReadOnly || primaryFieldsLocked) ? "cursor-not-allowed bg-muted/50" : ""
                }`}
              value={displayDescription}
              onChange={(event) =>
                (isReadOnly || primaryFieldsLocked)
                  ? undefined
                  : form.setValue("description", event.target.value)
              }
            />
            {form.formState.errors.description && (
              <p className="text-[12px] text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
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
                    <TitleCaseInput
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
                          disabled={isReadOnly}
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
                  disabled={isReadOnly}
                  onClick={assignCountyActivityDepartmentsFromPicker}
                  className="h-[38px] w-[62px] rounded-[12px] bg-[#6C5DD3] hover:bg-[#5B4DC5]"
                >
                  <ChevronRight className="size-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  disabled={isReadOnly}
                  onClick={removeCountyActivityDepartmentsFromPicker}
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
                    <TitleCaseInput
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
                            disabled={isReadOnly}
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

          {showBhsaSection && (
            <div className="mt-8 rounded-[12px] border border-[#E5E7EB] p-5 space-y-4">
              <div className={`flex items-center justify-between ${form.watch("bhsaApplicable") ? "border-b border-[#F3F4F6] pb-3" : ""}`}>
                <h4 className="text-[18px] font-medium text-[#1F2937]">BHSA Configuration</h4>
                <label className="flex cursor-pointer items-center gap-2 text-[14px] text-[#1F2937]">
                  <Checkbox
                    disabled={isReadOnly}
                    checked={form.watch("bhsaApplicable")}
                    onCheckedChange={(checked) => {
                      form.setValue("bhsaApplicable", checked === true)
                      if (checked !== true) {
                        form.setValue("expenditureClassification", "")
                        form.setValue("bhccCategory", "")
                        form.setValue("ageGroup", "")
                        form.setValue("otherCountyExpenditureType", "")
                        form.setValue("bhsaNotes", "")
                      }
                    }}
                  />
                  <span className="font-medium text-[#1F2937]">BHSA Applicable</span>
                </label>
              </div>

              {form.watch("bhsaApplicable") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[14px] font-normal text-[#1F2937]">
                        Expenditure Classification {form.watch("bhsaApplicable") && <span className="text-red-500">*</span>}
                      </label>
                      <Select
                        value={form.watch("expenditureClassification") || undefined}
                        disabled={isReadOnly || !form.watch("bhsaApplicable")}
                        onValueChange={(value) => form.setValue("expenditureClassification", value, { shouldValidate: true })}
                      >
                        <SelectTrigger className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent className="z-[300]">
                          <SelectItem value="BHCC">BHCC</SelectItem>
                          <SelectItem value="Other County Expenditure">Other County Expenditure</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.expenditureClassification && (
                        <p className="text-[12px] text-red-500">
                          {form.formState.errors.expenditureClassification.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[14px] font-normal text-[#1F2937]">
                        BHCC Category {form.watch("bhsaApplicable") && <span className="text-red-500">*</span>}
                      </label>
                      <Select
                        value={form.watch("bhccCategory") || undefined}
                        disabled={isReadOnly || !form.watch("bhsaApplicable")}
                        onValueChange={(value) => form.setValue("bhccCategory", value, { shouldValidate: true })}
                      >
                        <SelectTrigger className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="z-[300]">
                          <SelectItem value="MH">MH</SelectItem>
                          <SelectItem value="SUD">SUD</SelectItem>
                          <SelectItem value="Both / Split in Fiscal">Both / Split in Fiscal</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.bhccCategory && (
                        <p className="text-[12px] text-red-500">
                          {form.formState.errors.bhccCategory.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[14px] font-normal text-[#1F2937]">
                        Age Group {form.watch("bhsaApplicable") && <span className="text-red-500">*</span>}
                      </label>
                      <Select
                        value={form.watch("ageGroup") || undefined}
                        disabled={isReadOnly || !form.watch("bhsaApplicable")}
                        onValueChange={(value) => form.setValue("ageGroup", value, { shouldValidate: true })}
                      >
                        <SelectTrigger className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]">
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent className="z-[300]">
                          <SelectItem value="<21">&lt;21</SelectItem>
                          <SelectItem value="21+">21+</SelectItem>
                          <SelectItem value="Both / Split in Fiscal">Both / Split in Fiscal</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.ageGroup && (
                        <p className="text-[12px] text-red-500">
                          {form.formState.errors.ageGroup.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[14px] font-normal text-[#1F2937]">
                        Other County Expenditure Type {form.watch("bhsaApplicable") && <span className="text-red-500">*</span>}
                      </label>
                      <Select
                        value={form.watch("otherCountyExpenditureType") || undefined}
                        disabled={isReadOnly || !form.watch("bhsaApplicable")}
                        onValueChange={(value) => form.setValue("otherCountyExpenditureType", value, { shouldValidate: true })}
                      >
                        <SelectTrigger className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="z-[300]">
                          <SelectItem value="Workforce">Workforce</SelectItem>
                          <SelectItem value="Capital Infrastructure">Capital Infrastructure</SelectItem>
                          <SelectItem value="Admin / Plan Mgmt / Data / Quality">Admin / Plan Mgmt / Data / Quality</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.otherCountyExpenditureType && (
                        <p className="text-[12px] text-red-500">
                          {form.formState.errors.otherCountyExpenditureType.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[14px] font-normal text-[#1F2937]">BHSA Notes</label>
                    <textarea
                      readOnly={isReadOnly}
                      disabled={!form.watch("bhsaApplicable")}
                      className={`min-h-[80px] w-full rounded-[10px] border border-[#D9D9D9] px-4 py-3 text-[15px] outline-none ${
                        (isReadOnly || !form.watch("bhsaApplicable")) ? "cursor-not-allowed bg-muted/50" : ""
                      }`}
                      value={form.watch("bhsaNotes") || ""}
                      onChange={(event) => form.setValue("bhsaNotes", event.target.value)}
                      placeholder="Enter any notes related to BHSA classification"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-[70px] flex flex-wrap items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-[14px] text-[#1F2937]">
                <Checkbox
                  disabled={isReadOnly}
                  checked={form.watch("leaveCode")}
                  onCheckedChange={(checked) => form.setValue("leaveCode", checked === true)}
                />
                <span>Leave Code?</span>
              </label>
              <label className="flex items-center gap-2 text-[14px] text-[#1F2937]">
                <Checkbox
                  disabled={isReadOnly}
                  checked={form.watch("docRequired")}
                  onCheckedChange={(checked) => form.setValue("docRequired", checked === true)}
                />
                <span>Documents Required?</span>
              </label>

              <label className="flex items-center gap-2 text-[14px] text-[#A1A1AA]">
                <Checkbox
                  disabled={isReadOnly}
                  checked={form.watch("multipleJobPools")}
                  onCheckedChange={(checked) =>
                    form.setValue("multipleJobPools", checked === true)
                  }
                />
                <span>Assign Multiple Job Pools?</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <Button
                  type="submit"
                  disabled={isSubmitting || (mode === CountyActivityAddPageMode.EDIT && isEditSourceLoading)}
                  className="h-[45px] rounded-[14px] bg-[#6C5DD3] px-[25px] text-[16px] font-normal text-white hover:bg-[#5B4DC5]"
                >
                  Save
                </Button>
              )}
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
