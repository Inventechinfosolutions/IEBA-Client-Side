import { Controller, useFormContext } from "react-hook-form"
import { useState } from "react"
import { ChevronDown, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import {
  MultiSelectDropdown,
  parseMultiSelectStoredValues,
} from "@/components/ui/multi-select-dropdown"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  "!h-[38px] !w-[260px] !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !text-[12px] text-[#111827] shadow-none placeholder:!text-[12px] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
const activityMultiSelectClassName =
  "!min-h-[38px] !h-[38px] !w-[600px] !max-w-[600px] !rounded-[8px] !border-[#d6d7dc] !px-[11px] !py-0 !pr-9 !text-[12px] !font-normal !leading-normal overflow-hidden"

export function ReportsForm() {
  const { control, watch } = useFormContext<SettingsFormValues>()
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

  const selectedActivities = (selectedCodes ?? [])
    .map((code) => activityOptions.find((a) => a.code === code))
    .filter((x): x is (typeof activityOptions)[number] => Boolean(x))

  const filteredTableActivities = (() => {
    const q = tableSearchValue.trim().toLowerCase()
    if (!q) return selectedActivities
    return selectedActivities.filter((a) => `${a.code} ${a.label}`.toLowerCase().includes(q))
  })()

  return (
    <div className="bg-transparent px-2 py-1">
      <div className="grid grid-cols-[260px_180px_600px] items-start gap-2">
        <div>
          <label className={labelClassName}>Reports</label>
          <Controller
            name="reports.reportKey"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={reportOptions.map((r) => ({ value: r.key, label: r.label }))}
                placeholder="Select report"
                disabled={reportsOptionsPending}
                isLoading={reportsOptionsPending}
                loadingLabel="Loading reports…"
                className={cn(
                  selectTriggerClassName,
                  "!min-h-[38px] h-[38px] !text-[12px] disabled:cursor-not-allowed disabled:opacity-70",
                  "[&_span]:!text-[12px]",
                )}
                contentClassName="max-h-[180px]"
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[12px] !font-normal"
              />
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
            render={({ field }) => (
              <MultiSelectDropdown
                value={(field.value ?? []).join(", ")}
                onChange={(next) => {
                  field.onChange(parseMultiSelectStoredValues(next))
                }}
                onBlur={field.onBlur}
                placeholder={activityPickerLabel}
                disabled={isActivitiesFieldDisabled}
                isLoading={activityOptionsPending}
                maxVisibleItems={2}
                emptyListMessage="No activity codes available"
                options={activityOptions.map((a) => ({
                  value: a.code,
                  label: `${a.code} ${a.label}`,
                }))}
                className={cn(
                  activityMultiSelectClassName,
                  "[&_span]:!text-[12px]",
                  isActivitiesFieldDisabled && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
                )}
              />
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
                    className="h-[40px] rounded-[10px] border border-[#d6d7dc] bg-white px-3 text-[12px] shadow-none focus-visible:border-[#6C5DD3] focus-visible:ring-0"
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


