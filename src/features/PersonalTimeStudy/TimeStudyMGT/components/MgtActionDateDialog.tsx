import { useMemo, useState, type ReactElement } from "react"
import { toIsoYmdFromDate } from "@/lib/dates"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { MgtActionDateRange } from "../api/timeStudyMGTApi"
import type { MgtDayStatusMap } from "../types"

type MgtActionDateDialogProps = {
  action: "approved" | "rejected" | "opened" | "notify"
  dates: Date[]
  dayStatuses: MgtDayStatusMap
  trigger: ReactElement
  isSubmitting: boolean
  onConfirm: (dateRanges: MgtActionDateRange[]) => Promise<void>
}

const actionLabels: Record<string, string> = {
  approved: "Approve",
  rejected: "Reject",
  opened: "Unlock",
  notify: "Notify",
}

function normalizeStatus(status: unknown): string {
  return String(status ?? "").toLowerCase().trim()
}

function isPendingSubmissionStatus(status: unknown): boolean {
  const s = normalizeStatus(status)
  return (
    s.startsWith("submitted") ||
    s.includes("target met") ||
    s.includes("equal hours") ||
    s === "less_hours" ||
    s === "more_hours" ||
    s === "equal_hours" ||
    s === "submittedless" ||
    s === "submittedexceed"
  )
}

function isApprovedStatus(status: unknown): boolean {
  const s = normalizeStatus(status)
  return s === "approved" || s === "approved_time_entry"
}

function isUnlockableStatus(status: unknown): boolean {
  const s = normalizeStatus(status)
  return isApprovedStatus(s) || s === "rejected" || isPendingSubmissionStatus(s)
}

function isNotifyEligibleStatus(status: unknown): boolean {
  const s = normalizeStatus(status)
  if (!s || s === "notsubmitted" || s === "opened" || s === "draft" || s === "rejected") {
    return true
  }
  return !isPendingSubmissionStatus(s) && !isApprovedStatus(s)
}

function isDayEligibleForAction(
  action: MgtActionDateDialogProps["action"],
  status: unknown,
): boolean {
  if (action === "approved") return isPendingSubmissionStatus(status)
  // Reject: submitted days + already approved days (supervisor may roll back selected approved days).
  if (action === "rejected") {
    return isPendingSubmissionStatus(status) || isApprovedStatus(status)
  }
  if (action === "opened") return isUnlockableStatus(status)
  return isNotifyEligibleStatus(status)
}

function formatStatusLabel(status: unknown): string {
  const s = normalizeStatus(status)
  if (!s || s === "notsubmitted") return "Not submitted"
  if (s === "opened" || s === "draft") return "Saved / draft"
  if (s === "less_hours" || s === "submittedless") return "Submitted (less hours)"
  if (s === "more_hours" || s === "submittedexceed") return "Submitted (more hours)"
  if (s === "equal_hours" || s === "submitted") return "Submitted"
  if (s === "approved_time_entry") return "Approved"
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")
}

function buildSelectedRanges(dates: Date[], selectedDateKeys: string[]): MgtActionDateRange[] {
  const selected = new Set(selectedDateKeys)
  const ranges: MgtActionDateRange[] = []

  dates.forEach((date, index) => {
    const dateKey = toIsoYmdFromDate(date)
    if (!selected.has(dateKey)) return

    const previousDateKey = index > 0 ? toIsoYmdFromDate(dates[index - 1]) : null
    const continuesRange = previousDateKey !== null && selected.has(previousDateKey)

    if (continuesRange) {
      ranges[ranges.length - 1].endDate = dateKey
    } else {
      ranges.push({ startDate: dateKey, endDate: dateKey })
    }
  })

  return ranges
}

export function MgtActionDateDialog({
  action,
  dates,
  dayStatuses,
  trigger,
  isSubmitting,
  onConfirm,
}: MgtActionDateDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDateKeys, setSelectedDateKeys] = useState<string[]>([])

  const eligibleDates = useMemo(
    () =>
      dates.filter((date) => {
        const dateKey = toIsoYmdFromDate(date)
        return isDayEligibleForAction(action, dayStatuses[dateKey]?.status)
      }),
    [action, dates, dayStatuses],
  )

  const eligibleDateKeys = eligibleDates.map(toIsoYmdFromDate)
  const actionLabel = actionLabels[action] ?? "Apply action"
  const allSelected =
    eligibleDateKeys.length > 0 && selectedDateKeys.length === eligibleDateKeys.length

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return
    setOpen(nextOpen)
    if (nextOpen) setSelectedDateKeys(eligibleDateKeys)
  }

  const toggleDate = (dateKey: string, checked: boolean) => {
    setSelectedDateKeys((current) =>
      checked
        ? [...current, dateKey]
        : current.filter((selectedDateKey) => selectedDateKey !== dateKey),
    )
  }

  const handleConfirm = async () => {
    const dateRanges = buildSelectedRanges(eligibleDates, selectedDateKeys)
    if (dateRanges.length === 0) return

    try {
      await onConfirm(dateRanges)
      setOpen(false)
    } catch {
      // The mutation displays the API error and leaves the dialog open for retry.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[480px] rounded-xl border-0 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-[#E5E7EB] px-6 py-5">
          <DialogTitle className="text-[18px] text-[#111827]">
            Select days to {actionLabel.toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            Only days eligible for this action are listed. Choose one day, several days, or all
            eligible days.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          {eligibleDates.length === 0 ? (
            <p className="py-6 text-sm text-[#6B7280]">
              No eligible days in this week for {actionLabel.toLowerCase()}.
            </p>
          ) : (
            <>
              <label className="flex cursor-pointer items-center gap-3 border-b border-[#E5E7EB] py-4 font-medium text-[#374151]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    setSelectedDateKeys(checked === true ? eligibleDateKeys : [])
                  }
                />
                All eligible days ({eligibleDateKeys.length})
              </label>

              <div className="divide-y divide-[#F0F1F3]">
                {eligibleDates.map((date) => {
                  const dateKey = toIsoYmdFromDate(date)
                  const checked = selectedDateKeys.includes(dateKey)
                  const statusLabel = formatStatusLabel(dayStatuses[dateKey]?.status)
                  return (
                    <label
                      key={dateKey}
                      className="flex cursor-pointer items-center gap-3 py-3 text-sm text-[#374151]"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          toggleDate(dateKey, nextChecked === true)
                        }
                      />
                      <span className="w-24 font-medium">
                        {date.toLocaleDateString("en-US", { weekday: "long" })}
                      </span>
                      <span className="text-[#6B7280]">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="ml-auto text-xs text-[#9CA3AF]">{statusLabel}</span>
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-[#E5E7EB] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selectedDateKeys.length === 0 || isSubmitting}
            onClick={handleConfirm}
            className="bg-[#6C5DD3] hover:bg-[#5B4CC4]"
          >
            {isSubmitting ? "Applying..." : `${actionLabel} selected`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
