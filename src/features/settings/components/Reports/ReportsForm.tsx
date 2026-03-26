import { Controller, useFormContext } from "react-hook-form"
import { useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SettingsFormValues } from "@/features/settings/types"
import { useActivityOptions } from "@/features/settings/queries/getActivityOptions"
import { useReportOptions } from "@/features/settings/queries/getReportOptions"
import tableEmptyIcon from "@/assets/icons/table-empty.png"

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"
const selectTriggerClassName =
  "!h-[38px] !w-[260px] !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !text-[12px] text-[#111827] shadow-none placeholder:!text-[12px] focus-visible:border-[#cfc6ff] focus-visible:ring-0"
const chipInputClassName =
  "relative flex !h-[38px] !w-[600px] items-center gap-2 !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] text-[12px] text-[#111827] shadow-none"

export function ReportsForm() {
  const { control, getValues, setValue, watch } = useFormContext<SettingsFormValues>()
  const { data: reportOptions = [], isPending: reportsOptionsPending } = useReportOptions()
  const { data: activityOptions = [], isPending: activityOptionsPending } = useActivityOptions()

  const selectedCodes = watch("reports.selectedActivityCodes")
  const [isTableSearchOpen, setIsTableSearchOpen] = useState(false)
  const [tableSearchDraft, setTableSearchDraft] = useState("")
  const [tableSearchValue, setTableSearchValue] = useState("")
  const reportKeyValue = watch("reports.reportKey")
  const exclusionMode = watch("reports.exclusionMode")
  const isActivitiesFieldDisabled =
    !reportKeyValue || activityOptions.length === 0 || activityOptionsPending
  const isIncludeMode = exclusionMode === "include"
  const activityPickerLabel = isIncludeMode ? "Select Included Activities" : "Select Excluded Activities"
  const activityCodesTableTitle = isIncludeMode ? "Included Activity Codes" : "Excluded Activity Codes"

  const selectedReportLabel =
    reportOptions.find((r) => r.key === reportKeyValue)?.label ?? ""

  const selectedActivities = (selectedCodes ?? [])
    .map((code) => activityOptions.find((a) => a.code === code))
    .filter((x): x is (typeof activityOptions)[number] => Boolean(x))

  const removeActivity = (code: string) => {
    const current = getValues("reports.selectedActivityCodes") ?? []
    if (!current.includes(code)) return
    setValue(
      "reports.selectedActivityCodes",
      current.filter((c) => c !== code),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    )
  }

  const filteredTableActivities = (() => {
    const q = tableSearchValue.trim().toLowerCase()
    if (!q) return selectedActivities
    return selectedActivities.filter((a) => `${a.code} ${a.label}`.toLowerCase().includes(q))
  })()

  const toggleActivity = (code: string) => {
    if (isActivitiesFieldDisabled) return
    const current = getValues("reports.selectedActivityCodes") ?? []
    const exists = current.includes(code)
    const next = exists ? current.filter((c) => c !== code) : [...current, code]
    setValue("reports.selectedActivityCodes", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <div className="bg-transparent px-2 py-1">
      <div className="grid grid-cols-[260px_180px_600px] items-start gap-2">
        <div>
          <label className={labelClassName}>Reports</label>
          <Controller
            name="reports.reportKey"
            control={control}
            render={({ field }) => (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={reportsOptionsPending}
                    aria-label="Reports"
                    className={cn(
                      selectTriggerClassName,
                      "relative flex cursor-pointer items-center truncate pr-8 text-left text-[12px] disabled:cursor-not-allowed disabled:opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        !reportsOptionsPending && !selectedReportLabel && "text-[#9ca3af]",
                      )}
                    >
                      {reportsOptionsPending ? "Loading reports…" : selectedReportLabel || "Select report"}
                    </span>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  className="z-[90] max-h-[180px] w-[var(--radix-dropdown-menu-trigger-width)] overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]"
                >
                  {reportOptions.map((opt) => {
                    const selected = field.value === opt.key
                    return (
                      <DropdownMenuItem
                        key={opt.key}
                        onSelect={() => {
                          field.onChange(opt.key)
                        }}
                        className={cn(
                          "cursor-pointer rounded-[6px] px-3 py-2 text-left !text-[12px] !font-normal !text-[#111827] focus:!bg-[#FAFAFA] focus:!text-black data-[highlighted]:!bg-[#FAFAFA] data-[highlighted]:!text-black",
                          selected ? "bg-[#eef8ff]" : "bg-transparent",
                        )}
                      >
                        <span className="block w-full truncate">{opt.label}</span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </div>

        <div className="flex flex-col items-center">
          <label className={labelClassName}>Exclusion/Inclusion</label>
          <Controller
            name="reports.exclusionMode"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value === "include"}
                onCheckedChange={(checked) => field.onChange(checked ? "include" : "exclude")}
                className="mt-[10px] data-checked:bg-[var(--primary)]"
              />
            )}
          />
        </div>

        <div>
          <label className={labelClassName}>{activityPickerLabel}</label>
          <Controller
            name="reports.selectedActivityCodes"
            control={control}
            render={() => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isActivitiesFieldDisabled}>
                  <button
                    type="button"
                    disabled={isActivitiesFieldDisabled}
                    className={cn(
                      chipInputClassName,
                      "justify-between pr-8",
                      isActivitiesFieldDisabled &&
                        "cursor-not-allowed bg-[#f2f2f2] opacity-100",
                      "disabled:cursor-not-allowed"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      {selectedActivities.length === 0 ? (
                        <span className="text-[12px] text-[#9ca3af]">
                          {activityPickerLabel}
                        </span>
                      ) : (
                        <>
                          {selectedActivities.slice(0, 2).map((a) => (
                            <span
                              key={a.code}
                              className="inline-flex max-w-full items-center gap-1 rounded-[2px] bg-[#eef0f5] px-2 py-1 text-[12px] text-[#111827]"
                            >
                              <span className="truncate">
                                {a.code} {a.label}
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="ml-1 inline-flex size-4 cursor-pointer items-center justify-center rounded-[4px] text-[#6b7280]"
                                onPointerDown={(e) => {
                                  // Block Radix trigger open without suppressing click removal.
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeActivity(a.code)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter" && e.key !== " ") return
                                  e.preventDefault()
                                  e.stopPropagation()
                                  removeActivity(a.code)
                                }}
                                aria-label={`Remove ${a.code}`}
                              >
                                <X className="size-3" />
                              </span>
                            </span>
                          ))}
                          {selectedActivities.length > 2 ? (
                            <span className="inline-flex shrink-0 items-center rounded-[8px] bg-[#eef0f5] px-2 py-1 text-[12px] text-[#111827]">
                              +{selectedActivities.length - 2}...
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  avoidCollisions={false}
                  sideOffset={6}
                  className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
                >
                  {activityOptions.length === 0 ? (
                    <div className="border border-[#e7e9f2] bg-white px-3 py-2 text-[12px] text-[#6b7280]">
                      No activity codes available
                    </div>
                  ) : null}
                  <div className="max-h-[260px] overflow-auto p-1">
                    {activityOptions.map((a) => {
                      const selected = (selectedCodes ?? []).includes(a.code)
                      return (
                        <button
                          type="button"
                          key={a.code}
                          onClick={() => toggleActivity(a.code)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[#f3f4f8]",
                            selected ? "bg-[#eef8ff]" : "bg-transparent"
                          )}
                        >
                          <span className="truncate text-[12px] text-[#111827]">
                            {a.code} {a.label}
                          </span>
                          {selected ? <Check className="size-4 text-[#2563eb]" /> : null}
                        </button>
                      )
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[8px] border border-[#e7e9f2]">
        <div className="grid h-[34px] grid-cols-[1fr_14px] items-center bg-[var(--primary)]">
          <div className="relative flex items-center px-3">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-[12px] font-medium text-white">{activityCodesTableTitle}</div>
            </div>
            <div className="ml-auto flex items-center">
              <DropdownMenu open={isTableSearchOpen} onOpenChange={setIsTableSearchOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center justify-center"
                    aria-label="Open table search"
                  >
                    <Search className="size-3.5 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  className="w-[320px] rounded-[10px] border border-[#e7e9f2] bg-white p-3 shadow-[0_10px_24px_rgba(17,24,39,0.18)]"
                >
                  <Input
                    value={tableSearchDraft}
                    onChange={(e) => setTableSearchDraft(e.target.value)}
                    placeholder="Search value"
                    className="h-[40px] rounded-[10px] border border-[#d6d7dc] bg-white px-3 text-[12px] shadow-none focus-visible:border-[#cfc6ff] focus-visible:ring-0"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => setTableSearchValue(tableSearchDraft)}
                      className="h-[28px] cursor-pointer gap-2 rounded-[6px] bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#2563eb]"
                    >
                      <Search className="size-3.5 text-white" />
                      Search
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTableSearchDraft("")
                        setTableSearchValue("")
                      }}
                      className="h-[28px] cursor-pointer rounded-[6px] border border-[#d6d7dc] bg-white px-4 text-[12px] font-medium text-[#111827] hover:bg-white"
                    >
                      Reset
                    </Button>
                    <button
                      type="button"
                      className="ml-auto cursor-pointer text-[12px] font-medium text-[#2563eb] hover:underline"
                      onClick={() => {
                        // Placeholder for filter behavior; keep UI parity with design.
                      }}
                    >
                      Filter
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer text-[12px] font-medium text-[#2563eb] hover:underline"
                      onClick={() => {
                        setIsTableSearchOpen(false)
                        setTableSearchDraft(tableSearchValue)
                      }}
                    >
                      Close
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="h-full border-l border-white/30" />
        </div>

        <div className="max-h-[216px] overflow-y-scroll bg-white [scrollbar-gutter:stable]">
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="border-b-0" />
            </TableHeader>
            <TableBody className="bg-white">
              {selectedActivities.length === 0 ? (
                <TableRow className="hover:bg-white">
                  <TableCell className="h-[160px] p-0">
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <img
                        src={tableEmptyIcon}
                        alt="No data"
                        className="h-20 w-20 opacity-70"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTableActivities.length === 0 ? (
                  <TableRow className="hover:bg-white">
                    <TableCell className="h-[216px] p-0">
                      <div className="flex h-full flex-col items-center justify-center gap-2">
                        <img
                          src={tableEmptyIcon}
                          alt="No data"
                          className="h-20 w-20 opacity-70"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTableActivities.map((a) => (
                  <TableRow
                    key={a.code}
                    className="h-[36px] cursor-pointer border-b border-black/5 hover:bg-[#f3f4f8]"
                  >
                    <TableCell className="py-0 text-center text-[13px] text-[#111827]">
                      {a.code} {a.label}
                    </TableCell>
                  </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="submit"
          data-settings-section="reports"
          className="h-[44px] w-[88px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-0 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
        >
          Save
        </Button>
      </div>
    </div>
  )
}

