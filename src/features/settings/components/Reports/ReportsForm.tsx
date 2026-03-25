import { Controller, useFormContext } from "react-hook-form"
import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SettingsFormValues } from "@/features/settings/types"

type ReportOption = { key: string; label: string }
type ActivityOption = { code: string; label: string }

const reportOptions: ReportOption[] = [
  { key: "DSSRPT1", label: "DSSRPT1 Employee Indiv..." },
  { key: "DSSRPT2", label: "DSSRPT2 TIME STUDY H..." },
  { key: "DSSRPT3", label: "DSSRPT3 TIME STUDY S..." },
  { key: "DSSRPT4", label: "DSSRPT4 TIME STUDY S..." },
  { key: "DSSRPT5", label: "DSSRPT5 SALARY & BEN..." },
]

const activityOptions: ActivityOption[] = [
  { code: "00031", label: "IHSS Quality Assurance (A 03/05)" },
  { code: "00071", label: "Relative/Non-Relative Home Approvals" },
  { code: "00161", label: "Title IV-E Waiver Evaluation (R 06/07)" },
  { code: "00261", label: "State Only Cal-Learn Elig (C 9/12)" },
  { code: "00271", label: "State Only Cal-Learn Case Mgmt (C9/12)" },
  { code: "00301", label: "State Only KINGAP (C12/12)" },
  { code: "00311", label: "KINGAP NonFed Eligible (C 03/11)" },
  { code: "00361", label: "Two Parent Families (State Only) Stage One Child Care" },
]

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"
const selectTriggerClassName =
  "h-[48px] w-[145px] rounded-[10px] border border-[#d6d7dc] bg-white px-[11px] text-[14px] text-[#111827] shadow-none focus-visible:border-[#cfc6ff] focus-visible:ring-0"
const chipInputClassName =
  "flex h-[45px] w-[353px] items-center gap-2 rounded-[10px] border border-[#d6d7dc] bg-white px-[11px] text-[14px] text-[#111827] shadow-none"

export function ReportsForm() {
  const { control, getValues, setValue, watch } = useFormContext<SettingsFormValues>()
  const selectedCodes = watch("reports.selectedActivityCodes")
  const [activitySearch, setActivitySearch] = useState("")

  const selectedActivities = (selectedCodes ?? [])
    .map((code) => activityOptions.find((a) => a.code === code))
    .filter((x): x is ActivityOption => Boolean(x))

  const toggleActivity = (code: string) => {
    const current = getValues("reports.selectedActivityCodes") ?? []
    const exists = current.includes(code)
    const next = exists ? current.filter((c) => c !== code) : [...current, code]
    setValue("reports.selectedActivityCodes", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const filteredActivities = useMemo(() => {
    const q = activitySearch.trim().toLowerCase()
    if (!q) return activityOptions
    return activityOptions.filter((a) => `${a.code} ${a.label}`.toLowerCase().includes(q))
  }, [activitySearch])

  return (
    <div className="bg-transparent px-2 py-3">
      <div className="grid grid-cols-[190px_180px_353px] items-start gap-10">
        <div>
          <label className={labelClassName}>Reports</label>
          <Controller
            name="reports.reportKey"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className={selectTriggerClassName}>
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent className="min-w-[260px]">
                  {reportOptions.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <label className={labelClassName}>Select Included Activities</label>
          <Controller
            name="reports.selectedActivityCodes"
            control={control}
            render={() => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(chipInputClassName, "justify-between")}
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      {selectedActivities.length === 0 ? (
                        <span className="text-[14px] text-[#9ca3af]">
                          Select Excluded Activity
                        </span>
                      ) : (
                        selectedActivities.slice(0, 1).map((a) => (
                          <span
                            key={a.code}
                            className="inline-flex max-w-full items-center gap-1 rounded-[8px] bg-[#eef0f5] px-2 py-1 text-[13px] text-[#111827]"
                          >
                            <span className="truncate">
                              {a.code} {a.label}
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              className="ml-1 inline-flex size-4 items-center justify-center rounded-[4px] text-[#6b7280] hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleActivity(a.code)
                              }}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter" && e.key !== " ") return
                                e.preventDefault()
                                e.stopPropagation()
                                toggleActivity(a.code)
                              }}
                              aria-label={`Remove ${a.code}`}
                            >
                              <X className="size-3" />
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                    <Search className="size-4 text-[#9ca3af]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="bottom"
                  avoidCollisions={false}
                  sideOffset={6}
                  className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
                >
                  <div className="border-b border-[#e7e9f2] p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                      <Input
                        value={activitySearch}
                        onChange={(e) => setActivitySearch(e.target.value)}
                        placeholder="Search activity..."
                        className="h-[38px] rounded-[10px] border border-[#d6d7dc] bg-white pl-9 pr-3 text-[14px] shadow-none focus-visible:border-[#cfc6ff] focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  <div className="max-h-[260px] overflow-auto p-1">
                    {filteredActivities.length === 0 ? (
                      <div className="px-3 py-6 text-center text-[13px] text-[#6b7280]">
                        No activity found.
                      </div>
                    ) : (
                      filteredActivities.map((a) => {
                        const checked = (selectedCodes ?? []).includes(a.code)
                        return (
                          <button
                            type="button"
                            key={a.code}
                            onClick={() => toggleActivity(a.code)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left hover:bg-[#f3f4f8]",
                              checked ? "bg-[#eef0f5]" : "bg-transparent"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleActivity(a.code)}
                              className="size-[14px] border-[#cfd6e4] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                              aria-label={`Toggle ${a.code}`}
                            />
                            <span className="truncate text-[14px] text-[#111827]">
                              {a.code} {a.label}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[8px] border border-[#e7e9f2]">
        <div className="flex items-center justify-between bg-[var(--primary)] px-4 py-2">
          <div className="w-full text-center text-[13px]  text-white">
            Included Activity Codes
          </div>
          <Search className="size-4 text-white" />
        </div>

        <Table>
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="border-b-0" />
          </TableHeader>
          <TableBody>
            {selectedActivities.length === 0 ? (
              <TableRow>
                <TableCell className="h-[120px] text-center text-[13px] text-[#6b7280]">
                  No data
                </TableCell>
              </TableRow>
            ) : (
              selectedActivities.map((a) => (
                <TableRow key={a.code}>
                  <TableCell className="text-center text-[13px] text-[#111827]">
                    {a.code} {a.label}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="submit"
          className="h-[44px] w-[88px] rounded-[10px] bg-[var(--primary)] px-0 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
        >
          Save
        </Button>
      </div>
    </div>
  )
}

