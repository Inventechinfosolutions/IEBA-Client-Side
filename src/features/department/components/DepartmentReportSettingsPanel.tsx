import { useState, useMemo } from "react"
import { FileText, Search, Plus, X, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDepartmentReportSettings } from "../hooks/useDepartmentReportSettings"
import type { DepartmentReportOption, DepartmentReportSettingsPanelProps } from "../types"
import { DepartmentEditContextHeader } from "./DepartmentEditContextHeader"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const labelClassName = "mb-2 block text-[13px] font-[500] text-[#374151]"

type DepartmentReportMultiSelectFieldProps = {
  reportOptions: DepartmentReportOption[]
  serverMappedReportIds: string
  isLoading: boolean
  onSelectedReportIdsChange: (reportIdsCsv: string) => void
}

function DepartmentReportMultiSelectField({
  reportOptions,
  serverMappedReportIds,
  isLoading,
  onSelectedReportIdsChange,
}: DepartmentReportMultiSelectFieldProps) {
  const [userReportIds, setUserReportIds] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const selectedIds = useMemo(() => {
    const raw = userReportIds ?? serverMappedReportIds
    return raw
      .split(/[,;\n]+/g)
      .map((p) => p.trim())
      .filter(Boolean)
  }, [userReportIds, serverMappedReportIds])

  const { availableReports, selectedReports } = useMemo(() => {
    const selected = reportOptions.filter((opt) => selectedIds.includes(String(opt.id)))
    const available = reportOptions.filter((opt) => !selectedIds.includes(String(opt.id)))
    return { availableReports: available, selectedReports: selected }
  }, [reportOptions, selectedIds])

  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableReports
    const query = searchQuery.toLowerCase()
    return availableReports.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query)
    )
  }, [availableReports, searchQuery])

  const filteredSelected = useMemo(() => {
    if (!searchQuery.trim()) return selectedReports
    const query = searchQuery.toLowerCase()
    return selectedReports.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query)
    )
  }, [selectedReports, searchQuery])

  const handleAdd = (id: number) => {
    const nextIds = [...selectedIds, String(id)]
    const csv = nextIds.join(", ")
    setUserReportIds(csv)
    onSelectedReportIdsChange(csv)
  }

  const handleRemove = (id: number) => {
    const nextIds = selectedIds.filter((x) => x !== String(id))
    const csv = nextIds.join(", ")
    setUserReportIds(csv)
    onSelectedReportIdsChange(csv)
  }

  if (isLoading) {
    return (
      <div className="flex h-[57px] w-full items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFBFD] px-3 py-2 text-sm text-gray-400">
        Loading reports…
      </div>
    )
  }

  return (
    <div className="w-full rounded-[8px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
      {/* Accordion / Collapsible Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-gray-400 shrink-0" />
          <span className="text-[14px] font-[500] text-[#111827]">
            Reports selected
          </span>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#6C5DD3] px-1.5 text-[11px] font-bold text-white leading-none">
            {selectedReports.length}
          </span>
        </div>
        <div>
          {isOpen ? (
            <ChevronUp className="size-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="size-4 text-gray-400 shrink-0" />
          )}
        </div>
      </div>

      {/* Accordion / Collapsible Content */}
      {isOpen && (
        <div className="border-t border-[#E5E7EB] p-4 bg-white">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#FAFBFD] border border-[#E5E7EB] rounded-[6px] outline-none placeholder:text-gray-400 focus:border-[#6C5DD3] focus:ring-1 focus:ring-[#6C5DD3]/20"
            />
          </div>

          {/* Two Columns Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Available Column */}
            <div>
              <div className="text-[11px] font-bold text-gray-400 tracking-wider mb-2">
                AVAILABLE ({availableReports.length})
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                {filteredAvailable.length === 0 ? (
                  <div className="text-[12px] text-gray-400 py-2">
                    {searchQuery ? "No matching reports" : "No available reports"}
                  </div>
                ) : (
                  filteredAvailable.map((r) => (
                    <TooltipProvider key={r.id} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleAdd(r.id)}
                            className="flex w-full items-center gap-2 text-left py-1.5 px-2 rounded-[6px] text-[13px] text-[#374151] hover:bg-gray-50 transition-colors group cursor-pointer"
                          >
                            <Plus className="size-3.5 text-gray-400 shrink-0 group-hover:text-[#6C5DD3] transition-colors" />
                            <span className="truncate">{r.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={4}
                          className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                        >
                          {r.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
                )}
              </div>
            </div>

            {/* Selected Column */}
            <div>
              <div className="text-[11px] font-bold text-[#6C5DD3] tracking-wider mb-2">
                SELECTED ({selectedReports.length})
              </div>
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                {filteredSelected.length === 0 ? (
                  <div className="text-[12px] text-gray-400 py-2">
                    No reports selected
                  </div>
                ) : (
                  filteredSelected.map((r) => (
                    <TooltipProvider key={r.id} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleRemove(r.id)}
                            className="flex w-full items-center gap-2 text-left py-1.5 px-3 rounded-[6px] text-[13px] font-[500] bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] transition-colors border border-[#E0E7FF] cursor-pointer group"
                          >
                            <X className="size-3 text-[#4F46E5] shrink-0 group-hover:text-red-500 transition-colors" />
                            <span className="truncate">{r.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={4}
                          className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                        >
                          {r.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DepartmentReportSettingsPanel({
  departmentId,
  departmentCode,
  departmentName,
  reportOptions,
  mappedReports,
  isReportOptionsLoading,
  isMappedReportsLoading,
  isSubmitting = false,
  onEnsureDepartmentId,
  onExit,
}: DepartmentReportSettingsPanelProps) {
  const {
    countyNameDisplay,
    serverMappedReportIds,
    multiSelectKey,
    isSaving,
    setPendingReportIds,
    saveMappedReports,
  } = useDepartmentReportSettings({
    departmentId,
    departmentName,
    mappedReports,
    onEnsureDepartmentId,
  })

  const showDepartmentSummary = Boolean(departmentCode?.trim() || departmentName?.trim())
  const isReportDataLoading = isReportOptionsLoading || isMappedReportsLoading
  const saveDisabled = isSubmitting || isSaving

  return (
    <div className="px-6 pb-6">
      {showDepartmentSummary && (
        <DepartmentEditContextHeader
          countyName={countyNameDisplay}
          code={departmentCode}
          departmentName={departmentName}
        />
      )}

      <div className="py-8 min-h-[220px]">
        <label className={labelClassName}>Reports</label>
        <DepartmentReportMultiSelectField
          key={multiSelectKey}
          reportOptions={reportOptions}
          serverMappedReportIds={serverMappedReportIds}
          isLoading={isReportDataLoading}
          onSelectedReportIdsChange={setPendingReportIds}
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          disabled={saveDisabled}
          onClick={() => void saveMappedReports()}
          className="w-[140px] h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[16px] font-[500]"
        >
          Save
        </Button>
        <Button
          type="button"
          disabled={saveDisabled}
          onClick={onExit}
          className="w-[140px] h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[16px] font-[500]"
        >
          Exit
        </Button>
      </div>
    </div>
  )
}
