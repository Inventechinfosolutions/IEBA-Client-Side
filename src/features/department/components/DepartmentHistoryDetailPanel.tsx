import { ArrowRight, Check, X } from "lucide-react"

import {
  formatDepartmentHistoryReportLabel,
  getDepartmentHistoryCreatedAtDisplay,
  getDepartmentHistoryCreatedByDisplay,
  getDepartmentHistoryDetailSections,
  getDepartmentHistoryReports,
  getDepartmentHistoryUpdatedAtDisplay,
  getDepartmentHistoryUpdatedByDisplay,
  type DepartmentHistorySnapshotItem,
} from "../lib/departmentHistoryDisplay"
import type { DepartmentHistoryRecord } from "../queries/departmentHistory"

type DepartmentHistoryDetailPanelProps = {
  row: DepartmentHistoryRecord
}

function BooleanPill({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        enabled ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#F3F4F6] text-[#6B7280]"
      }`}
    >
      {enabled ? <Check className="size-3" /> : <X className="size-3" />}
      <span className="truncate">{label}</span>
    </div>
  )
}

function RemovedValuePill({ enabled }: { enabled: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-medium text-[#B91C1C]">
      {enabled ? <Check className="size-3" /> : <X className="size-3" />}
      {enabled ? "Yes" : "No"}
    </span>
  )
}

function AddedValuePill({ enabled }: { enabled: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-medium text-[#027A48]">
      {enabled ? <Check className="size-3" /> : <X className="size-3" />}
      {enabled ? "Yes" : "No"}
    </span>
  )
}

function ChangeItem({ item }: { item: DepartmentHistorySnapshotItem }) {
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
          <ArrowRight className="size-3.5 text-[#9CA3AF]" />
          <AddedValuePill enabled={item.newEnabled!} />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[8px] border border-[#F3F4F6] bg-white px-3 py-2">
      <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
      <div
        className="mt-0.5 text-[13px] font-medium break-words"
        title={item.fullValue}
      >
        <span className="inline-flex max-w-full rounded-[4px] bg-[#FEF2F2] px-1.5 py-0.5 text-[#B91C1C] break-words whitespace-normal text-left">
          {item.previousValue}
        </span>
        <ArrowRight className="mx-1.5 inline size-3.5 text-[#9CA3AF]" />
        <span className="inline-flex max-w-full rounded-[4px] bg-[#ECFDF3] px-1.5 py-0.5 text-[#027A48] break-words whitespace-normal text-left">
          {item.newValue}
        </span>
      </div>
    </div>
  )
}

export function DepartmentHistoryDetailPanel({ row }: DepartmentHistoryDetailPanelProps) {
  const reports = getDepartmentHistoryReports(row)
  const sections = getDepartmentHistoryDetailSections(row, {
    hideReportIds: reports.length > 0,
  })

  return (
    <div className="space-y-4 border-t border-[#E5E7EB] bg-[#FAFAFC] px-4 py-4 w-full min-w-0">
      {/* Top Metadata Container */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-[13px] md:grid-cols-4 rounded-[10px] bg-white p-3.5 border border-[#E5E7EB]">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            Created By
          </div>
          <div className="mt-1 text-[#111827] font-medium text-[11px] sm:text-[12px] leading-tight">
            {getDepartmentHistoryCreatedByDisplay(row)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            Created At
          </div>
          <div className="mt-1 text-[#111827] font-medium text-[11px] sm:text-[12px] leading-tight">
            {getDepartmentHistoryCreatedAtDisplay(row)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            Updated By
          </div>
          <div className="mt-1 text-[#111827] font-medium text-[11px] sm:text-[12px] leading-tight">
            {getDepartmentHistoryUpdatedByDisplay(row)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
            Updated At
          </div>
          <div className="mt-1 text-[#111827] font-medium text-[11px] sm:text-[12px] leading-tight">
            {getDepartmentHistoryUpdatedAtDisplay(row)}
          </div>
        </div>
      </div>

      {/* Mapped Reports */}
      {reports.length > 0 ? (
        <section>
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Mapped Reports ({reports.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {reports.map((report) => (
              <div
                key={`${report.id ?? report.code}-${report.name}`}
                className="flex items-start gap-2.5 rounded-[8px] border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-2.5 text-[12px] font-medium text-[#5B4DC5] w-full min-w-0"
                title={formatDepartmentHistoryReportLabel(report)}
              >
                <span className="font-semibold shrink-0 bg-[#6C5DD3] text-white px-2 py-0.5 rounded-[4px] text-[11px] mt-0.5">
                  {report.code || "RPT"}
                </span>
                <span className="whitespace-normal break-words text-[#374151] font-medium text-[12px] leading-snug flex-1">
                  {report.name || formatDepartmentHistoryReportLabel(report)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.title}>
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            {section.title}
          </h4>

          {section.title === "Department Settings" && section.items[0]?.kind === "boolean" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[8px] border border-[#F3F4F6] bg-white px-3 py-2 text-[12px]"
                >
                  <span className="text-[#374151] font-medium truncate mr-2">{item.label}</span>
                  <BooleanPill
                    enabled={Boolean(item.enabled)}
                    label={Boolean(item.enabled) ? "Enabled" : "Disabled"}
                  />
                </div>
              ))}
            </div>
          ) : section.items[0]?.kind === "change" ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <ChangeItem key={item.label} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[8px] border border-[#F3F4F6] bg-white px-3 py-2"
                >
                  <div className="text-[11px] font-medium text-[#6B7280]">{item.label}</div>
                  <div
                    className="mt-0.5 text-[13px] font-medium text-[#111827] break-words"
                    title={item.fullValue}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
