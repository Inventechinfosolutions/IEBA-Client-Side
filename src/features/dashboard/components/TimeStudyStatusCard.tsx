import { useState } from "react"
import { Clock } from "lucide-react"
import iconApproved from "@/assets/icon-approved.png"
import iconPending from "@/assets/icon-pending.png"
import iconNotSubmitted from "@/assets/icon-not-submitted.png"
import type { TimeStudyStatusCardProps, StatusRowProps } from "../types"
import { TimeStudyStatusModal, type ModalVariant } from "./TimeStudyStatusModal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TimeStudyStatusCard({
  approved,
  pendingApproval,
  notSubmitted,
  isLoading,
  userId,
}: TimeStudyStatusCardProps) {
  const [activeModal, setActiveModal] = useState<ModalVariant | null>(null)
  
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all")

  return (
    <>
      <div className="flex h-full flex-col rounded-[10px] bg-white p-4 shadow-[0_0_20px_0_#0000001a]">
        {/* Header with Title and Filters on the same line */}
        <div className="flex items-center justify-between gap-2.5 mb-4 pb-2.5 border-b border-[#f0f0f5]">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6C5DD3] shrink-0">
              <Clock className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-[13px] font-semibold text-[#1a1a2e] tracking-tight">Time Study Status</span>
          </div>

          {/* Filters layout */}
          <div className="flex items-center gap-1.5 select-none">
            {/* Month Filter */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger size="sm" className="h-7 w-[75px] text-[11px] rounded-md border-[#e5e7eb] bg-white px-2">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white">
                <SelectItem value="all">Month</SelectItem>
                <SelectItem value="1">Jan</SelectItem>
                <SelectItem value="2">Feb</SelectItem>
                <SelectItem value="3">Mar</SelectItem>
                <SelectItem value="4">Apr</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">Jun</SelectItem>
                <SelectItem value="7">Jul</SelectItem>
                <SelectItem value="8">Aug</SelectItem>
                <SelectItem value="9">Sep</SelectItem>
                <SelectItem value="10">Oct</SelectItem>
                <SelectItem value="11">Nov</SelectItem>
                <SelectItem value="12">Dec</SelectItem>
              </SelectContent>
            </Select>

            {/* Year Filter */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger size="sm" className="h-7 w-[74px] text-[11px] rounded-md border-[#e5e7eb] bg-white px-2">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white">
                <SelectItem value="all">Year</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>

            {/* Quarter Filter */}
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger size="sm" className="h-7 w-[84px] text-[11px] rounded-md border-[#e5e7eb] bg-white px-2">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-white">
                <SelectItem value="all">Quarter</SelectItem>
                <SelectItem value="q1">Q1</SelectItem>
                <SelectItem value="q2">Q2</SelectItem>
                <SelectItem value="q3">Q3</SelectItem>
                <SelectItem value="q4">Q4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-around">
          {/* Row — Approved */}
          <StatusRow
            icon={iconApproved}
            label="Approved"
            count={approved}
            actionLabel="View"
            onAction={() => setActiveModal("approved")}
            loading={isLoading}
          />

          {/* Row — Pending Approval */}
          <StatusRow
            icon={iconPending}
            label="Pending Approval"
            count={pendingApproval}
            actionLabel="Approve"
            onAction={() => setActiveModal("pending")}
            loading={isLoading}
          />

          {/* Row — Not Submitted */}
          <StatusRow
            icon={iconNotSubmitted}
            label="Not Submitted"
            count={notSubmitted}
            actionLabel="Notify"
            onAction={() => setActiveModal("notSubmitted")}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Modal */}
      {activeModal && (
        <TimeStudyStatusModal
          open={!!activeModal}
          onClose={() => setActiveModal(null)}
          variant={activeModal}
          month={selectedMonth}
          year={selectedYear}
          quarter={selectedQuarter}
          userId={userId}
        />
      )}
    </>
  )
}

function StatusRow({
  icon,
  label,
  count,
  actionLabel,
  onAction,
  loading,
}: StatusRowProps) {
  return (
    <div
      className="grid items-center gap-3"
      style={{ gridTemplateColumns: "40px 1fr 96px" }}
    >
      {/* Image icon */}
      <img src={icon} alt={label} className="h-10 w-10 shrink-0 object-contain" />

      {/* Label & Count Container */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-[#374151] truncate">{label}</span>
        {loading ? (
          <div className="h-4 w-5 animate-pulse rounded bg-[#e5e7eb]" />
        ) : (
          <span className="text-sm font-bold text-[#1a1a2e]">{count}</span>
        )}
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={onAction}
        className="rounded-xl bg-[#6C5DD3] py-2.5 text-sm text-white hover:bg-[#5a4db8] active:scale-95 transition-all duration-150 w-full text-center shadow-[0_0_20px_0_#0003]"
      >
        {actionLabel}
      </button>
    </div>
  )
}
