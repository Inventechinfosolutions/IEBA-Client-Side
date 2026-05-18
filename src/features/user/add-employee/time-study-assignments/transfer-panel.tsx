
import { Check, Search } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { ScrollArea } from "@/components/ui/scroll-area"

import type {
  AddEmployeeTimeStudyJobPoolSection,
  AddEmployeeTimeStudyTransferItem,
  AddEmployeeTimeStudyTransferPanelProps,
} from "../types"
import { Spinner } from "@/components/ui/spinner"

function itemMatchesSearch(item: AddEmployeeTimeStudyTransferItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.name.toLowerCase().includes(q) ||
    (item.code ?? "").toLowerCase().includes(q) ||
    item.department.toLowerCase().includes(q)
  )
}

function filterJobPoolSection(
  section: AddEmployeeTimeStudyJobPoolSection,
  search: string,
): AddEmployeeTimeStudyJobPoolSection | null {
  const items = section.items.filter((item) => itemMatchesSearch(item, search))
  return items.length > 0 ? { ...section, items } : null
}

function ReadOnlyCheckbox() {
  return (
    <div
      aria-hidden
      className="pointer-events-none flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border border-[#D1D5DB] bg-white shadow-sm"
    />
  )
}

function RowCheckbox({ isSelected, readOnly }: { isSelected: boolean; readOnly?: boolean }) {
  if (readOnly) return <ReadOnlyCheckbox />
  return (
    <div
      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
        isSelected
          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
      }`}
    >
      <Check className="size-3.5 stroke-3" />
    </div>
  )
}

function RowLabel({
  item,
  isSelected,
  readOnly,
}: {
  item: AddEmployeeTimeStudyTransferItem
  isSelected: boolean
  readOnly?: boolean
}) {
  if (item.code) {
    return (
      <>
        <span className={`font-bold ${readOnly ? "text-[#6C5DD3]" : isSelected ? "text-[#6C5DD3]" : "text-[#6C5DD3]"}`}>
          ({item.code}
          {item.isMultiCode ? "**" : ""})
        </span>
        <span className="font-bold text-[#111827]"> — </span>
        <span className={readOnly ? "text-[#111827]" : isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
          {item.name}
        </span>
      </>
    )
  }
  return (
    <span className={readOnly ? "text-[#111827]" : isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
      {item.name}
    </span>
  )
}

function TransferRow({
  item,
  isSelected,
  readOnly,
  minLevel,
  onToggle,
}: {
  item: AddEmployeeTimeStudyTransferItem
  isSelected: boolean
  readOnly?: boolean
  minLevel: number
  onToggle?: () => void
}) {
  const rawLevel = item.level ?? minLevel
  const badgeCount = Math.max(0, rawLevel - minLevel)

  const rowBody = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1 py-2">
        <TreeBranch />
        {badgeCount > 0 &&
          Array.from({ length: badgeCount }).map((_, i) => {
            const ancestor = item.ancestors?.[i]
            return (
              <div key={i} className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="relative flex size-[18px] shrink-0 cursor-help items-center justify-center rounded-full border border-[#6C5DD3] bg-[#F9FAFB] text-[9px] font-medium text-[#111827] shadow-[0_4px_8px_rgba(0,0,0,0.15)] -translate-y-px"
                        style={{ zIndex: 11 }}
                      >
                        {i + 1}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{ancestor?.name || `Parent ${i + 1}`}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {i < badgeCount - 1 && <TreeConnector />}
              </div>
            )
          })}
        {badgeCount > 0 && <TreeConnector />}
        <div className="ml-1 flex flex-wrap items-center gap-1 text-[10px] font-medium">
          <RowLabel item={item} isSelected={isSelected} readOnly={readOnly} />
        </div>
      </div>
      <RowCheckbox isSelected={isSelected} readOnly={readOnly} />
    </>
  )

  if (readOnly) {
    return (
      <div className="group relative z-0 flex cursor-default items-center justify-between py-1 pr-3 text-left">
        {rowBody}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative z-0 flex w-full cursor-pointer items-center justify-between py-1 pr-3 text-left transition-colors ${
        isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
      }`}
    >
      {rowBody}
    </button>
  )
}

function TreeBranch() {
  return <div className="h-px w-2.5 shrink-0 bg-[#E5E7EB]" style={{ marginLeft: "30px" }} />
}

function TreeConnector() {
  return <div className="h-px w-1.5 shrink-0 bg-[#E5E7EB]" />
}

function ItemTree({
  items,
  selectedIds,
  onToggleItem,
  minLevel,
  readOnly = false,
}: {
  items: AddEmployeeTimeStudyTransferItem[]
  selectedIds: string[]
  onToggleItem?: (id: string) => void
  minLevel: number
  readOnly?: boolean
}) {
  if (items.length === 0) return null

  return (
    <div className="relative flex flex-col pb-2">
      <div
        className="pointer-events-none absolute bottom-0 top-0 w-px bg-[#E5E7EB]"
        style={{ left: "30px", zIndex: 10 }}
      />
      {items.map((item) => (
        <TransferRow
          key={item.id}
          item={item}
          isSelected={readOnly ? false : selectedIds.includes(item.id)}
          readOnly={readOnly}
          minLevel={minLevel}
          onToggle={readOnly ? undefined : () => onToggleItem?.(item.id)}
        />
      ))}
    </div>
  )
}

function DisabledHeaderCheckbox() {
  return <RowCheckbox isSelected={false} readOnly />
}

function JobPoolBlock({
  section,
  minLevel,
}: {
  section: AddEmployeeTimeStudyJobPoolSection
  minLevel: number
}) {
  return (
    <div className="flex flex-col">
      <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-2 text-[10px] font-semibold text-[#6C5DD3]">
        <span className="min-w-0">{section.sectionTitle}</span>
        <DisabledHeaderCheckbox />
      </div>
      <ItemTree items={section.items} selectedIds={[]} minLevel={minLevel} readOnly />
    </div>
  )
}

export function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
  searchValue,
  onSearchChange,
  selectedDept,
  isLoading = false,
  jobPoolSection = null,
}: AddEmployeeTimeStudyTransferPanelProps) {
  const filteredJobPoolSection = jobPoolSection
    ? filterJobPoolSection(jobPoolSection, searchValue)
    : null
  const hasMainContent = items.length > 0
  const hasAnyContent = hasMainContent || Boolean(filteredJobPoolSection)
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))
  const jobPoolItemLevels = filteredJobPoolSection?.items ?? []
  const allLevels = [...items, ...jobPoolItemLevels].map((i) => i.level ?? 1)
  const minLevel = allLevels.length > 0 ? Math.min(...allLevels) : 1

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[11px] font-medium text-white">
        <span className="flex-1">{title}</span>
      </div>

      <PanelSearchBar searchValue={searchValue} onSearchChange={onSearchChange} />

      <ScrollArea className="relative h-[220px] py-2 px-2">
        {isLoading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        ) : null}
        {hasAnyContent ? (
          <div className="flex flex-col">
            {filteredJobPoolSection ? (
              <JobPoolBlock section={filteredJobPoolSection} minLevel={minLevel} />
            ) : null}
            {hasMainContent ? (
              <div
                className={
                  filteredJobPoolSection
                    ? "mt-2 flex flex-col border-t border-[#E5E7EB] pt-2"
                    : "flex flex-col"
                }
              >
                <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-2 text-[10px] font-semibold text-[#374151]">
                  <span className="min-w-0">{selectedDept}</span>
                  <button
                    type="button"
                    onClick={onToggleAll}
                    className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                      allSelected
                        ? "border-[#6C5DD3] bg-white text-[#6C5DD3]"
                        : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                    }`}
                    aria-label={`Toggle all ${selectedDept}`}
                  >
                    <Check className="size-3.5 stroke-3" />
                  </button>
                </div>

                <div className="px-4 py-1">
                  <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                    {title.includes("Activities") ? "Activities" : "Programs"}
                  </span>
                </div>

                <ItemTree
                  items={items}
                  selectedIds={selectedIds}
                  onToggleItem={onToggleItem}
                  minLevel={minLevel}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-20 object-contain opacity-80" />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function PanelSearchBar({
  searchValue,
  onSearchChange,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
}) {
  return (
    <div className="border-b border-[#E5E7EB] p-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
        <TitleCaseInput
          placeholder="Search here"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-[8px] border-[#E5E7EB] bg-white pl-9 text-[12px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] transition-all"
        />
      </div>
    </div>
  )
}
