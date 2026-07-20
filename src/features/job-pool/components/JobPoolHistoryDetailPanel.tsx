import type { ReactNode } from "react"
import { ArrowRight, Check, X } from "lucide-react"

import {
  getJobPoolHistoryDetailSections,
  isJobPoolHistoryFullWidthField,
  type JobPoolHistoryDetailItem,
} from "../lib/jobPoolHistoryDisplay"
import type { JobPoolHistoryRecord } from "../queries/jobPoolHistory"

type JobPoolHistoryDetailPanelProps = {
  row: JobPoolHistoryRecord
}

function display(value: unknown): string {
  if (value == null || String(value).trim() === "") return "—"
  return String(value).trim()
}

function DetailCard({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex h-full min-h-[68px] flex-col rounded-[8px] border border-[#F3F4F6] bg-white px-3 py-2.5 ${className}`}
    >
      {children}
    </div>
  )
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

function ChangeItem({ item }: { item: JobPoolHistoryDetailItem }) {
  const isBooleanChange =
    item.kind === "change" &&
    typeof item.previousEnabled === "boolean" &&
    typeof item.newEnabled === "boolean"

  if (isBooleanChange) {
    return (
      <DetailCard>
        <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1.5">
          <RemovedValuePill enabled={item.previousEnabled!} />
          <ArrowRight className="size-3.5 shrink-0 text-[#9CA3AF]" />
          <AddedValuePill enabled={item.newEnabled!} />
        </div>
      </DetailCard>
    )
  }

  return (
    <DetailCard>
      <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1.5 text-[13px] font-medium">
        <span className="inline-flex max-w-full rounded-[4px] bg-[#FEF2F2] px-1.5 py-0.5 text-[#B91C1C] break-words whitespace-normal text-left">
          {item.previousValue}
        </span>
        <ArrowRight className="size-3.5 shrink-0 text-[#9CA3AF]" />
        <span className="inline-flex max-w-full rounded-[4px] bg-[#ECFDF3] px-1.5 py-0.5 text-[#027A48] break-words whitespace-normal text-left">
          {item.newValue}
        </span>
      </div>
    </DetailCard>
  )
}

function TextItem({ item }: { item: JobPoolHistoryDetailItem }) {
  return (
    <DetailCard>
      <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
      <div className="mt-auto pt-1 text-[13px] font-medium text-[#111827] break-words">
        {item.value}
      </div>
    </DetailCard>
  )
}

function sectionGridClass(layout: "grid-3" | "grid-2" | "stack"): string {
  if (layout === "stack") return "grid grid-cols-1 gap-3"
  if (layout === "grid-2") return "grid grid-cols-1 gap-3 sm:grid-cols-2"
  return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
}

function itemGridClass(item: JobPoolHistoryDetailItem, layout: "grid-3" | "grid-2" | "stack"): string {
  if (layout === "stack" || isJobPoolHistoryFullWidthField(item.key)) {
    return "col-span-full"
  }
  return ""
}

export function JobPoolHistoryDetailPanel({ row }: JobPoolHistoryDetailPanelProps) {
  const sections = getJobPoolHistoryDetailSections(row)
  const createdBy = display(row.createdByUserName ?? row.createdByName)
  const updatedBy = display(row.updatedByUserName ?? row.updatedByName)
  const hasAudit = createdBy !== "—" || updatedBy !== "—"

  if (!hasAudit && sections.length === 0) {
    return (
      <div className="border-t border-[#E5E7EB] bg-[#FAFAFC] px-4 py-4 text-[13px] text-[#6B7280]">
        No additional details for this record.
      </div>
    )
  }

  return (
    <div className="space-y-4 border-t border-[#E5E7EB] bg-[#FAFAFC] px-4 py-4">
      {hasAudit ? (
        <section>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Audit
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {createdBy !== "—" ? (
              <DetailCard>
                <div className="text-[11px] font-medium text-[#6B7280]">Created By</div>
                <div className="mt-auto pt-1 text-[13px] font-medium text-[#111827] break-words">
                  {createdBy}
                </div>
              </DetailCard>
            ) : null}
            {updatedBy !== "—" ? (
              <DetailCard>
                <div className="text-[11px] font-medium text-[#6B7280]">Updated By</div>
                <div className="mt-auto pt-1 text-[13px] font-medium text-[#111827] break-words">
                  {updatedBy}
                </div>
              </DetailCard>
            ) : null}
          </div>
        </section>
      ) : null}

      {sections.map((section) => (
        <section key={section.title}>
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">
            {section.title}
          </h4>
          <div className={`${sectionGridClass(section.layout)} items-stretch`}>
            {section.items.map((item) => (
              <div key={item.key} className={itemGridClass(item, section.layout)}>
                {item.kind === "change" ? <ChangeItem item={item} /> : <TextItem item={item} />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
