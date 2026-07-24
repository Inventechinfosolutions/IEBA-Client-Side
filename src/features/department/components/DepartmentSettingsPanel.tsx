import { useState } from "react"
import { type Path, type UseFormSetValue } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { X, Search, ChevronDown, Check, Plus } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { useGetMasterCodeOptions } from "../queries/getMasterCodeOptions"
import { DEPARTMENT_SETTINGS_ROWS } from "../types"
import type { DepartmentUpsertValues } from "../types"
import { DepartmentEditContextHeader } from "./DepartmentEditContextHeader"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { ApportioningHistoryPopover } from "./ApportioningHistoryPopover"

type Settings = DepartmentUpsertValues["settings"]

export type DepartmentSettingsPanelProps = {
    departmentId: string | undefined
    currentCode: string
    currentName: string
    settings: Settings
    setValue: UseFormSetValue<DepartmentUpsertValues>
    canUpdateDepartment: boolean
    isSubmitting: boolean
    onSave: () => void
    onExit: () => void
}

export function DepartmentSettingsPanel({
    departmentId,
    currentCode,
    currentName,
    settings,
    setValue,
    canUpdateDepartment,
    isSubmitting,
    onSave,
    onExit,
}: DepartmentSettingsPanelProps) {
    const [isMultiCodesOpen, setIsMultiCodesOpen] = useState(false)
    const [multiCodesSearch, setMultiCodesSearch] = useState("")

    const masterCodesQuery = useGetMasterCodeOptions(isMultiCodesOpen)
    const masterCodeOptions = masterCodesQuery.data ?? []
    const isLoadingMasterCodes = masterCodesQuery.isLoading || masterCodesQuery.isFetching
    const masterCodesErrorMessage =
        masterCodesQuery.error instanceof Error
            ? masterCodesQuery.error.message
            : masterCodesQuery.isError
                ? "Failed to load master codes"
                : null
    const masterCodesIsError = masterCodesQuery.isError

    const filteredRows = DEPARTMENT_SETTINGS_ROWS.filter(
        s => s.key !== "allowMultiCodes" || canUpdateDepartment
    )

    function removeSetting(key: string) {
        setValue(`settings.${key}` as Path<DepartmentUpsertValues>, false)
        if (key === "apportioning") {
            setValue("settings.autoApportioning", false)
            setValue("settings.manualApportioning", false)
        }
        if (key === "removeStartEndTime") {
            setValue("settings.removeAutoFillEndTime", false)
        }
        if (key === "allowMultiCodes") {
            setValue("settings.allowActivationStartDateAndEndDate", false)
            setValue("settings.multiCodes", "")
        }
    }

    function addSetting(key: string) {
        setValue(`settings.${key}` as Path<DepartmentUpsertValues>, true)
        if (key === "apportioning") {
            setValue("settings.autoApportioning", true)
            setValue("settings.manualApportioning", false)
        }
        if (key === "removeStartEndTime") {
            setValue("settings.removeAutoFillEndTime", false)
        }
    }

    const selectedRows = filteredRows.filter(s => !!settings[s.key as keyof Settings])
    const remainingRows = filteredRows.filter(s => !settings[s.key as keyof Settings])

    return (
        <div className="px-4 sm:px-6 pb-6">
            {departmentId && (
                <DepartmentEditContextHeader
                    code={currentCode}
                    departmentName={currentName}
                />
            )}

            {/* Split-panel layout — always show both panels */}
            <div className="py-4 flex flex-col md:flex-row gap-3 min-h-[320px]">

                {/* LEFT — Unassigned Settings panel */}
                <div className="w-full md:w-1/2 flex flex-col rounded-[12px] border border-[#6C5DD3] overflow-hidden shadow-[0_4px_20px_#6C5DD320]">
                    {/* Header */}
                    <div className="flex h-12 items-center px-4 bg-[#6C5DD3]">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-[600] text-white tracking-wide">Unassigned Settings</span>
                            {remainingRows.length > 0 && (
                                <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-white text-[#6C5DD3] text-[11px] font-[700] px-1.5">
                                    {remainingRows.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Body — unselected rows only */}
                    <div className="flex-1 divide-y divide-[#F3F4F6] overflow-y-auto bg-white min-h-[160px]">
                        {remainingRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#9CA3AF]">
                                <span className="text-[13px] italic">All settings are assigned</span>
                            </div>
                        ) : (
                            remainingRows.map((setting) => {
                                const isDisabled =
                                    (setting.key === "removeAutoFillEndTime" && !!settings.removeStartEndTime) ||
                                    (setting.key === "allowActivationStartDateAndEndDate" && !settings.allowMultiCodes)
                                return (
                                    <div
                                        key={setting.key}
                                        className={`px-4 py-3 bg-white transition-colors duration-200 ${isDisabled ? "opacity-40" : "hover:bg-[#F5F3FF]"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`rem-${setting.key}`}
                                                    checked={false}
                                                    disabled={isDisabled}
                                                    onCheckedChange={() => addSetting(setting.key)}
                                                    className="h-[16px] w-[16px] border-[#D1D5DB] shrink-0 cursor-pointer"
                                                />
                                                <Label
                                                    htmlFor={`rem-${setting.key}`}
                                                    className={`text-[13px] font-[500] text-[#374151] ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                                                >
                                                    {setting.label}
                                                </Label>
                                            </div>
                                            <TooltipProvider delayDuration={100}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            disabled={isDisabled}
                                                            onClick={() => {
                                                                if (isDisabled) return
                                                                addSetting(setting.key)
                                                            }}
                                                            className="shrink-0 rounded-full p-0.5 text-[#9CA3AF] hover:text-green-500 hover:bg-green-50 transition-colors disabled:cursor-not-allowed"
                                                        >
                                                            <Plus className="size-3.5" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Add</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT — Assigned Settings panel */}
                <div className="w-full md:w-1/2 flex flex-col rounded-[12px] border border-[#6C5DD3] overflow-hidden shadow-[0_4px_20px_#6C5DD320]">
                    {/* Header */}
                    <div className="flex h-12 items-center px-4 bg-[#6C5DD3]">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-[600] text-white tracking-wide">Assigned Settings</span>
                            {selectedRows.length > 0 && (
                                <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-white text-[#6C5DD3] text-[11px] font-[700] px-1.5">
                                    {selectedRows.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Body — selected rows only */}
                    <div className="flex-1 divide-y divide-[#F3F4F6] overflow-y-auto min-h-[160px]">
                        {selectedRows.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#9CA3AF]">
                                <span className="text-[13px] italic">No settings selected</span>
                                <span className="text-[12px]">Click &ldquo;+&rdquo; on the left to configure</span>
                            </div>
                        ) : (
                            selectedRows.map((setting) => (
                                <div key={setting.key} className="px-4 py-3 bg-white hover:bg-gray-50 transition-colors duration-200">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`sel-${setting.key}`}
                                                checked={true}
                                                onCheckedChange={() => removeSetting(setting.key)}
                                                className="h-[16px] w-[16px] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:border-[#6C5DD3] shrink-0"
                                            />
                                            <Label htmlFor={`sel-${setting.key}`} className="text-[13px] font-[500] text-[#374151] cursor-pointer flex items-center">
                                                {setting.label}
                                                {setting.key === "apportioning" && departmentId && (
                                                    <ApportioningHistoryPopover departmentId={departmentId} />
                                                )}
                                            </Label>
                                        </div>
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="shrink-0 rounded-full p-0.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        onClick={() => removeSetting(setting.key)}
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Remove</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    {/* Apportioning radio */}
                                    {setting.key === "apportioning" && (
                                        <div className="ml-7 mt-2">
                                            <RadioGroup
                                                value={settings.manualApportioning ? "manual" : "auto"}
                                                onValueChange={(value) => {
                                                    setValue("settings.autoApportioning", value === "auto")
                                                    setValue("settings.manualApportioning", value === "manual")
                                                }}
                                                className="flex flex-row flex-wrap gap-4 sm:gap-6"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value="auto" id="dept-auto" className="border-[#D1D5DB] data-checked:border-[#6C5DD3] data-checked:bg-[#6C5DD3]" />
                                                    <Label htmlFor="dept-auto" className="text-[13px] font-[400] text-[#374151] cursor-pointer">Auto Apportioning</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <RadioGroupItem value="manual" id="dept-manual" className="border-[#D1D5DB] data-checked:border-[#6C5DD3] data-checked:bg-[#6C5DD3]" />
                                                    <Label htmlFor="dept-manual" className="text-[13px] font-[400] text-[#374151] cursor-pointer">Manual Apportioning</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    )}

                                    {/* Apportioning start/end date */}
                                    {setting.key === "apportioning" && (
                                        <div className="ml-7 mt-3 space-y-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[380px]">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[13px] font-[500] text-[#374151]">Start Date</Label>
                                                    <TitleCaseInput
                                                        type="date"
                                                        className="h-9 text-sm rounded-[6px] border-[#D1D5DB] bg-white px-3 w-full"
                                                        value={settings.apportioningStartDate || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value || null
                                                            setValue("settings.apportioningStartDate", val)
                                                            if (val && settings.apportioningEndDate && settings.apportioningEndDate < val) {
                                                                setValue("settings.apportioningEndDate", null)
                                                                toast.error("End date must be equal or greater than start date")
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[13px] font-[500] text-[#374151]">End Date</Label>
                                                    <TitleCaseInput
                                                        type="date"
                                                        className="h-9 text-sm rounded-[6px] border-[#D1D5DB] bg-white px-3 w-full"
                                                        value={settings.apportioningEndDate || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value || null
                                                            setValue("settings.apportioningEndDate", val)
                                                            if (val && settings.apportioningStartDate && val < settings.apportioningStartDate) {
                                                                setValue("settings.apportioningEndDate", null)
                                                                toast.error("End date must be equal or greater than start date")
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {setting.key === "allowMultiCodes" && (
                                        <div className="ml-7 mt-2">
                                            <div className="relative w-full max-w-[280px]">
                                                <div
                                                    className="flex min-h-[40px] w-full items-center gap-1 rounded-[10px] border border-[#D1D5DB] bg-white px-3 py-1 cursor-pointer"
                                                    onClick={() => setIsMultiCodesOpen(!isMultiCodesOpen)}
                                                >
                                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                                        {(() => {
                                                            const selected = (settings.multiCodes || "").split(",").filter(Boolean)
                                                            return selected.length > 0 ? selected.map((code) => (
                                                                <span key={code} className="inline-flex items-center gap-1 rounded-[6px] bg-[#EEF2FF] px-2 py-0.5 text-[12px] text-[#6C5DD3] font-[500]">
                                                                    {code}
                                                                    <button type="button" className="text-[#6C5DD3] hover:text-red-500" onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        const current = (settings.multiCodes || "").split(",")
                                                                        setValue("settings.multiCodes", current.filter(c => c !== code).join(","))
                                                                    }}><X className="size-3" /></button>
                                                                </span>
                                                            )) : <span className="text-[#9CA3AF] text-[13px]">Select codes</span>
                                                        })()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 border-l border-[#E5E7EB] pl-2">
                                                        <Search className="size-3.5 text-[#C4C4C4]" />
                                                        <ChevronDown className={`size-3.5 text-[#9CA3AF] transition-transform ${isMultiCodesOpen ? "rotate-180" : ""}`} />
                                                    </div>
                                                </div>
                                                {isMultiCodesOpen && (
                                                    <div className="absolute top-[calc(100%+4px)] z-50 w-full rounded-[12px] border border-[#E5E7EB] bg-white p-2 shadow-[0_8px_24px_#0000001A]">
                                                        <div className="mb-2 px-1">
                                                            <div className="relative">
                                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#9CA3AF]" />
                                                                <TitleCaseInput
                                                                    className="h-8 pl-8 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0 border-[#E5E7EB] rounded-[8px]"
                                                                    placeholder="Search..."
                                                                    value={multiCodesSearch}
                                                                    onChange={(e) => setMultiCodesSearch(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[180px] overflow-auto space-y-0.5">
                                                            {masterCodesIsError && masterCodesErrorMessage && (
                                                                <div className="px-3 py-2 text-[12px] text-red-600">{masterCodesErrorMessage}</div>
                                                            )}
                                                            {isLoadingMasterCodes && (
                                                                <div className="flex justify-center py-2"><Spinner className="size-4 text-[#6C5DD3]" /></div>
                                                            )}
                                                            {!isLoadingMasterCodes && !masterCodesIsError && masterCodeOptions.length === 0 && (
                                                                <div className="px-3 py-2 text-[12px] text-[#6B7280]">No codes found</div>
                                                            )}
                                                            {(isLoadingMasterCodes ? [] : masterCodeOptions)
                                                                .filter(opt => opt.toLowerCase().includes(multiCodesSearch.toLowerCase()))
                                                                .map((opt) => {
                                                                    const isSelected = (settings.multiCodes || "").split(",").includes(opt)
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            type="button"
                                                                            className="group flex w-full items-center justify-between rounded-[6px] px-3 py-1.5 text-left text-[13px] hover:bg-[#F3F4F6]"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                const current = settings.multiCodes ? settings.multiCodes.split(",") : []
                                                                                setValue("settings.multiCodes", (isSelected ? current.filter(c => c !== opt) : [...current, opt]).join(","))
                                                                            }}
                                                                        >
                                                                            <span className={`${isSelected ? "font-[500] text-[#6C5DD3]" : ""} dark:group-hover:text-white!`}>{opt}</span>
                                                                            {isSelected && <Check className="size-3.5 text-[#6C5DD3] dark:group-hover:text-white!" />}
                                                                        </button>
                                                                    )
                                                                })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4">
                <Button
                    type="button"
                    onClick={onSave}
                    className="w-full sm:w-[140px] h-[48px] sm:h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[15px] sm:text-[16px] font-[500]"
                >
                    Save
                </Button>
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onExit}
                    className="w-full sm:w-[140px] h-[48px] sm:h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[15px] sm:text-[16px] font-[500]"
                >
                    Exit
                </Button>
            </div>
        </div>
    )
} 