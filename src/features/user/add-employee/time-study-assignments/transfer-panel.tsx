
import { Check, Search } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

function RowCheckbox({ isSelected, readOnly, hideCheckbox }: { isSelected: boolean; readOnly?: boolean; hideCheckbox?: boolean }) {
  if (hideCheckbox) return <div className="size-4.5 shrink-0" />
  if (readOnly) return <ReadOnlyCheckbox />
  return (
    <div
      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${isSelected
          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
        }`}
    >
      <Check className="size-3.5 stroke-3" />
    </div>
  )
}

const ROW_NAME_MAX_LENGTH = 70

function truncateLabelName(name: string, maxLength = ROW_NAME_MAX_LENGTH): string {
  if (name.length <= maxLength) return name
  return `${name.slice(0, maxLength)}…`
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
  const nameColorClass = readOnly ? "text-[#111827]" : isSelected ? "text-[#6C5DD3]" : "text-[#111827]"
  const displayName = truncateLabelName(item.name)
  const showFullNameTooltip = item.name.length > ROW_NAME_MAX_LENGTH

  if (item.code) {
    return (
      <span className="flex min-w-0 flex-1 items-center overflow-hidden">
        <span className="shrink-0 font-bold text-[#6C5DD3]">
          ({item.code}
          {item.isMultiCode ? "**" : ""})
        </span>
        <span className="shrink-0 font-bold text-[#111827]"> — </span>
        <span
          className={`min-w-0 ${nameColorClass}`}
          title={showFullNameTooltip ? item.name : undefined}
        >
          {displayName}
        </span>
      </span>
    )
  }
  return (
    <span
      className={`block min-w-0 flex-1 ${nameColorClass}`}
      title={showFullNameTooltip ? item.name : undefined}
    >
      {displayName}
    </span>
  )
}

/**
 * Single numbered oval badge with a tooltip shown on hover.
 * number: the oval label (1 or 2)
 * tooltipText: the ancestor name shown on hover
 */
function OvalBadge({ number, tooltipText }: { number: number; tooltipText: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex shrink-0 h-[22px] w-[16px] cursor-help items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#6C5DD3] border border-[#6C5DD3] select-none"
        >
          {number}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-center text-[11px]">
        {tooltipText || "—"}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * TransferRow — renders a single program row.
 *
 * Uses item.level (set by DFS in buildHierarchicalProgramItems) and item.ancestors
 * for hierarchy display. Matches the target design from the reference screenshot:
 *   - Grandparent (depth 0): no ovals, no indent, horizontal tree line tick
 *   - Parent (depth 1): oval ① → tooltip = grandparent name, indented with line ticks
 *   - Child (depth 2+): ovals ① ② → tooltip 1 = grandparent, tooltip 2 = direct parent, indented with line ticks
 */
function TransferRow({
  item,
  isSelected,
  readOnly,
  onToggle,
}: {
  item: AddEmployeeTimeStudyTransferItem
  isSelected: boolean
  readOnly?: boolean
  minLevel: number
  onToggle?: () => void
}) {
  // Use absolute depth (relative to root level 1) to ensure ovals and indentation
  // remain consistent even when list items are filtered or subsetted.
  const depth = Math.max(0, (item.level ?? 1) - 1)

  // ancestors[0] = grandparent, ancestors[last] = direct parent
  const grandParentName = item.ancestors?.[0]?.name ?? ""
  const directParentName =
    item.ancestors && item.ancestors.length > 0
      ? item.ancestors[item.ancestors.length - 1].name
      : ""

  const renderTreeConnectors = () => {
    return (
      <div className="flex shrink-0 items-center gap-[2px] h-full mr-1">
        {/* Left Tick */}
        <div className="w-[8px] h-px bg-[#E5E7EB] shrink-0" />
        
        {depth >= 1 && (
          <>
            {/* Oval 1 */}
            <OvalBadge number={1} tooltipText={grandParentName} />
            {/* Middle Tick */}
            <div className="w-[4px] h-px bg-[#E5E7EB] shrink-0" />
          </>
        )}

        {depth >= 2 && (
          <>
            {/* Oval 2 */}
            <OvalBadge number={2} tooltipText={directParentName} />
            {/* Right Tick */}
            <div className="w-[4px] h-px bg-[#E5E7EB] shrink-0" />
          </>
        )}
      </div>
    )
  }

  const rowBody = (
    <>
      {/* Continuous Vertical Line */}
      <div className="absolute left-4 top-0 h-full w-px bg-[#E5E7EB] z-10" />

      <div
        className="flex min-w-0 flex-1 items-center text-[10px] font-medium pl-4"
      >
        <TooltipProvider>
          {renderTreeConnectors()}
        </TooltipProvider>
        <RowLabel item={item} isSelected={isSelected} readOnly={readOnly} />
      </div>
      <RowCheckbox isSelected={isSelected} readOnly={readOnly} hideCheckbox={item.id.includes("apportioning-")} />
    </>
  )

  if (readOnly) {
    return (
      <div
        className="group relative z-0 flex cursor-not-allowed items-center justify-between py-0.5 pr-3 text-left"
        aria-disabled="true"
      >
        {rowBody}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative z-0 flex w-full cursor-pointer items-center justify-between py-0.5 pr-3 text-left transition-colors ${isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
        }`}
    >
      {rowBody}
    </button>
  )
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
    <div className="flex flex-col pb-2">
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

function groupJobPoolItemsByLabel(
  items: AddEmployeeTimeStudyTransferItem[],
): Array<{ label: string; items: AddEmployeeTimeStudyTransferItem[] }> {
  const order: string[] = []
  const map = new Map<string, AddEmployeeTimeStudyTransferItem[]>()
  for (const item of items) {
    const label = item.ancestors?.[0]?.name?.trim() ?? ""
    if (!map.has(label)) {
      map.set(label, [])
      order.push(label)
    }
    map.get(label)!.push({ ...item, ancestors: [], level: 1 })
  }
  return order.map((label) => ({ label, items: map.get(label) ?? [] }))
}

function JobPoolBlock({
  section,
  minLevel,
}: {
  section: AddEmployeeTimeStudyJobPoolSection
  minLevel: number
}) {
  const groups = groupJobPoolItemsByLabel(section.items)

  return (
    <div
      className="flex cursor-not-allowed flex-col select-none"
      role="group"
      aria-label={section.sectionTitle}
      aria-disabled="true"
      title="Job pool assignments are read-only"
    >
      <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] cursor-not-allowed items-center gap-2 bg-[#F3F4F6] pl-4 pr-2 text-[10px] font-semibold text-[#6C5DD3]">
        <span className="min-w-0">{section.sectionTitle}</span>
        <DisabledHeaderCheckbox />
      </div>
      {groups.map((group) => (
        <div key={group.label || "default"} className="flex cursor-not-allowed flex-col">
          {group.label ? (
            <div className="cursor-not-allowed px-4 py-1">
              <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                {group.label}
              </span>
            </div>
          ) : null}
          <ItemTree items={group.items} selectedIds={[]} minLevel={minLevel} readOnly />
        </div>
      ))}
    </div>
  )
}

function ApportioningBlock({
  section,
  minLevel,
}: {
  section: AddEmployeeTimeStudyJobPoolSection
  minLevel: number
}) {
  const groups = groupJobPoolItemsByLabel(section.items)

  return (
    <div
      className="flex cursor-not-allowed flex-col select-none"
      role="group"
      aria-label={section.sectionTitle}
      aria-disabled="true"
      title="Apportioning assignments are read-only"
    >
      <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] cursor-not-allowed items-center gap-2 bg-[#F3F4F6] pl-4 pr-2 text-[10px] font-semibold text-[#6C5DD3]">
        <span className="min-w-0">{section.sectionTitle}</span>
        <div className="size-4.5 shrink-0" />
      </div>
      {groups.map((group) => (
        <div key={group.label || "default"} className="flex cursor-not-allowed flex-col">
          {group.label ? (
            <div className="cursor-not-allowed px-4 py-1">
              <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                {group.label}
              </span>
            </div>
          ) : null}
          <ItemTree items={group.items} selectedIds={[]} minLevel={minLevel} readOnly />
        </div>
      ))}
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
  apportioningSection = null,
}: AddEmployeeTimeStudyTransferPanelProps) {
  const filteredJobPoolSection = jobPoolSection
    ? filterJobPoolSection(jobPoolSection, searchValue)
    : null
  const filteredApportioningSection = apportioningSection
    ? filterJobPoolSection(apportioningSection, searchValue)
    : null
  const hasMainContent = items.length > 0
  const hasAnyContent = hasMainContent || Boolean(filteredJobPoolSection) || Boolean(filteredApportioningSection)
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  // Compute minLevel from all visible items so depth is relative to the shallowest item shown
  const allLevels = [
    ...items.map((i) => i.level ?? 1),
    ...(filteredJobPoolSection?.items ?? []).map((i) => i.level ?? 1),
    ...(filteredApportioningSection?.items ?? []).map((i) => i.level ?? 1),
  ]
  const minLevel = allLevels.length > 0 ? Math.min(...allLevels) : 1

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[11px] font-medium text-white">
        <span className="flex-1">{title}</span>
      </div>

      <PanelSearchBar searchValue={searchValue} onSearchChange={onSearchChange} />

      <ScrollArea className="relative h-[380px] py-2 px-2">
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
            {filteredApportioningSection ? (
              <div className={filteredJobPoolSection ? "mt-2 border-t border-[#E5E7EB] pt-2" : ""}>
                <ApportioningBlock section={filteredApportioningSection} minLevel={minLevel} />
              </div>
            ) : null}
            {hasMainContent ? (
              <div
                className={
                  filteredJobPoolSection || filteredApportioningSection
                    ? "mt-2 flex flex-col border-t border-[#E5E7EB] pt-2"
                    : "flex flex-col"
                }
              >
                <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-3 text-[10px] font-semibold text-[#374151]">
                  <span className="min-w-0">{selectedDept}</span>
                  <button
                    type="button"
                    onClick={onToggleAll}
                    className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${allSelected
                        ? "border-[#6C5DD3] bg-white text-[#6C5DD3]"
                        : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                      }`}
                    aria-label={`Toggle all ${selectedDept}`}
                  >
                    <Check className="size-3.5 stroke-3" />
                  </button>
                </div>

                <div className="px-2 py-1">
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
