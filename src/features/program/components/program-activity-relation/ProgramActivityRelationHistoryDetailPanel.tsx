import { ArrowRight, Check, X } from "lucide-react"

import {
  getParHistoryDetailSections,
  type ParHistoryDetailItem,
} from "../../lib/timeStudyProgramActivityHistoryDisplay"
import type { TimeStudyProgramActivityHistoryRecord } from "../../queries/timeStudyProgramActivityHistory"

type ProgramActivityRelationHistoryDetailPanelProps = {
  row: TimeStudyProgramActivityHistoryRecord
}

function RemovedValuePill({ enabled }: { enabled: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-medium text-[#B91C1C]">
      {enabled ? <Check className="size-3" /> : <X className="size-3" />}
      {enabled ? "Yes" : "No"}
    </span>
  )
}

function AddedValuePill({ enabled }: { enabled: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-medium text-[#027A48]">
      {enabled ? <Check className="size-3" /> : <X className="size-3" />}
      {enabled ? "Yes" : "No"}
    </span>
  )
}

function ChangeItem({ item }: { item: ParHistoryDetailItem }) {
  const isBooleanChange =
    item.kind === "change" &&
    typeof item.previousEnabled === "boolean" &&
    typeof item.newEnabled === "boolean"

  if (isBooleanChange) {
    return (
      <div className="rounded-[8px] border border-[#F3F4F6] bg-white px-3 py-2">
        <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <RemovedValuePill enabled={item.previousEnabled!} />
          <ArrowRight className="size-3.5 shrink-0 text-[#9CA3AF]" />
          <AddedValuePill enabled={item.newEnabled!} />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[8px] border border-[#F3F4F6] bg-white px-3 py-2">
      <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium">
        <span className="inline-flex max-w-full rounded-[4px] bg-[#FEF2F2] px-1.5 py-0.5 text-[#B91C1C] break-words whitespace-normal text-left">
          {item.previousValue}
        </span>
        <ArrowRight className="size-3.5 shrink-0 text-[#9CA3AF]" />
        <span className="inline-flex max-w-full rounded-[4px] bg-[#ECFDF3] px-1.5 py-0.5 text-[#027A48] break-words whitespace-normal text-left">
          {item.newValue}
        </span>
      </div>
    </div>
  )
}

export function ProgramActivityRelationHistoryDetailPanel({
  row,
}: ProgramActivityRelationHistoryDetailPanelProps) {
  const sections = getParHistoryDetailSections(row)

  if (sections.length === 0) {
    return (
      <div className="border-t border-[#E5E7EB] bg-[#FAFAFC] px-4 py-4 text-[13px] text-[#6B7280]">
        No change details for this record.
      </div>
    )
  }

  return (
    <div className="space-y-4 border-t border-[#E5E7EB] bg-[#FAFAFC] px-4 py-4">
      {sections.map((section) => (
        <section key={section.title}>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">
            {section.title}
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) =>
              item.kind === "change" ? (
                <ChangeItem key={item.key} item={item} />
              ) : (
                <div
                  key={item.key}
                  className="rounded-[8px] border border-[#F3F4F6] bg-white px-3 py-2"
                >
                  <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
                  <div className="mt-0.5 text-[13px] font-medium text-[#111827] break-words">
                    {item.value}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
