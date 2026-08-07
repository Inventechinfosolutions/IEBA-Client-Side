import { Search, Check } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { DepartmentReportOption } from "../types"
import { coerceReportVisibilityFlag } from "../lib/departmentReport.utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type ReportAudienceFlagsMap = Record<
  string,
  { visibleToAdmin: boolean; visibleToUser: boolean }
>

export type TransferPanelProps = {
  title: string
  items: DepartmentReportOption[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onSelectAll: (checked: boolean) => void
  searchValue: string
  onSearchChange: (value: string) => void
  /** When true, show Admin / User visibility toggles on each Selected report row. */
  showAudienceFlags?: boolean
  audienceFlags?: ReportAudienceFlagsMap
  onAudienceFlagChange?: (
    reportId: string,
    flag: "visibleToAdmin" | "visibleToUser",
    value: boolean,
  ) => void
}

function MoveSelectCheckbox({
  checked,
  onToggle,
  ariaLabel,
}: {
  checked: boolean
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-checked={checked}
      role="checkbox"
      onClick={onToggle}
      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all cursor-pointer ${
        checked
          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
      }`}
    >
      <Check className="size-3 stroke-[3]" />
    </button>
  )
}

/** Compact Admin/User control — only the checkbox fills when checked. */
function AudiencePill({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`${label} view`}
      title={`${label} can see this report`}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className="inline-flex h-6 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-1.5 text-[11px] font-medium text-[#374151] transition-colors cursor-pointer select-none hover:border-[#C4B5FD]"
    >
      <span
        className={`flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
          checked
            ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
            : "border-[#D1D5DB] bg-white text-transparent"
        }`}
      >
        <Check className="size-2.5 stroke-[3]" />
      </span>
      <span className="leading-none">{label}</span>
    </button>
  )
}

export function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onSelectAll,
  searchValue,
  onSearchChange,
  showAudienceFlags = false,
  audienceFlags = {},
  onAudienceFlagChange,
}: TransferPanelProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(String(item.id)))

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white flex-1 min-w-0">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[12px] font-medium text-white select-none">
        <span className="flex-1 truncate min-w-0">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span>All</span>
          <button
            type="button"
            onClick={() => onSelectAll(!allSelected)}
            className={`flex size-4 items-center justify-center rounded-[3px] border transition-colors ${
              allSelected ? "bg-white text-[#6C5DD3]" : "border-white/20 bg-white text-transparent"
            }`}
          >
            {allSelected && <Check className="size-3 stroke-[3.5] text-[#6C5DD3]" />}
          </button>
          <span className="min-w-[16px] text-center font-bold">{items.length}</span>
        </div>
      </div>

      <div className="border-b border-[#E5E7EB] p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search here"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-[8px] border border-[#E5E7EB] bg-white pl-9 pr-3 text-[12px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] outline-none transition-all"
          />
        </div>
      </div>

      <div className="h-[300px] overflow-y-auto py-1 px-1">
        {items.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {items.map((item) => {
              const id = String(item.id)
              const isSelected = selectedIds.includes(id)
              const flags = audienceFlags[id] ?? {
                visibleToAdmin: coerceReportVisibilityFlag(item.visibleToAdmin, true),
                visibleToUser: coerceReportVisibilityFlag(item.visibleToUser, true),
              }

              if (showAudienceFlags) {
                return (
                  <div
                    key={item.id}
                    className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12px] border border-transparent ${
                      isSelected
                        ? "bg-[#F3F0FF] border-[#E8E4FF]"
                        : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <MoveSelectCheckbox
                      checked={isSelected}
                      onToggle={() => onToggleItem(id)}
                      ariaLabel={`Select ${item.label} to move`}
                    />

                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onToggleItem(id)}
                            className={`truncate flex-1 min-w-0 text-left cursor-pointer ${
                              isSelected ? "text-[#6C5DD3] font-medium" : "text-[#374151]"
                            }`}
                          >
                            {item.label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={4}
                          className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                        >
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <AudiencePill
                        label="Admin"
                        checked={flags.visibleToAdmin}
                        onChange={(next) =>
                          onAudienceFlagChange?.(id, "visibleToAdmin", next)
                        }
                      />
                      <AudiencePill
                        label="User"
                        checked={flags.visibleToUser}
                        onChange={(next) =>
                          onAudienceFlagChange?.(id, "visibleToUser", next)
                        }
                      />
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={item.id}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 rounded-[6px] text-[12px] ${
                    isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                  }`}
                >
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onToggleItem(id)}
                          className={`truncate flex-1 min-w-0 text-left cursor-pointer ${
                            isSelected ? "text-[#6C5DD3]" : "text-[#374151]"
                          }`}
                        >
                          {item.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={4}
                        className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <MoveSelectCheckbox
                    checked={isSelected}
                    onToggle={() => onToggleItem(id)}
                    ariaLabel={`Select ${item.label}`}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[250px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-16 object-contain opacity-60" />
          </div>
        )}
      </div>
    </div>
  )
}
