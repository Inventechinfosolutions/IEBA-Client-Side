import { X, CheckCircle2, ShieldAlert, AlertCircle } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

type TimestudyAllowedDept = {
  departmentId: number
  departmentName?: string | null
  allowed: boolean
  startDate?: string | null
  endDate?: string | null
  message?: string | null
}

type ApportioningSummaryItem = {
  departmentId: number
  departmentName: string
  apportioningPercent: number
  allocatedMinutes: number
  enteredMinutes: number
  remainingMinutes: number
  apportioningType?: string
  supervisorConsumedMinutes?: number
  outOfDateRange?: boolean
  startDate?: string | null
  endDate?: string | null
  message?: string | null
}

type ApportioningDrawerProps = {
  open: boolean
  onClose: () => void
  timestudyAllowedRaw?: TimestudyAllowedDept[]
  apportioningSummary?: ApportioningSummaryItem[]
  dropdownData?: Array<{ departmentId: number; departmentName: string }>
}

export function ApportioningDrawer({
  open,
  onClose,
  timestudyAllowedRaw,
  apportioningSummary,
  dropdownData,
}: ApportioningDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        showCloseButton={false}
        className="data-[side=right]:w-full sm:max-w-[462px] p-0 bg-white z-[60] sm:z-[40] border-l border-gray-100 shadow-xl !top-0 sm:!top-[72px] !h-full sm:!h-[calc(100vh-72px)] flex flex-col gap-0"
        overlayClassName="top-0 sm:top-[72px] z-[50] sm:z-[40]"
        side="right"
      >
        <SheetHeader className="p-6 pb-4 border-b border-[#E5E7EB] shrink-0 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-[20px] font-bold text-[#6C5DD3]">
            Time Study Details
          </SheetTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="group flex sm:hidden items-center gap-1 text-[15px] font-semibold text-[#6C5DD3] hover:text-[#5B4DBF] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <span className="transform group-hover:-translate-x-0.5 transition-transform duration-200 text-[18px] font-bold leading-none -mt-[2px]">
                &lsaquo;
              </span>
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="size-5" />
            </button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-68px)] sm:h-[calc(100vh-140px)]">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-[13px] font-bold text-[#6C5DD3] uppercase tracking-wider mb-3">
                Time Study Periods
              </h3>
              <div className="space-y-3">
                {(!timestudyAllowedRaw || timestudyAllowedRaw.length === 0) ? (
                  <div className="text-[12px] text-gray-500 py-3 italic bg-gray-50 border border-gray-200 rounded-lg text-center">
                    No department assignments found.
                  </div>
                ) : (
                  timestudyAllowedRaw.map((dept) => {
                    const match = dropdownData?.find((d) => d.departmentId === dept.departmentId)
                    const deptName = dept.departmentName || match?.departmentName || "Assigned Department"
                    return (
                      <div
                        key={dept.departmentId}
                        className="flex flex-col gap-3 p-5 rounded-xl border border-gray-200 bg-white text-[13px] shadow-sm hover:border-[#6C5DD3]/30 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[14px] font-bold text-gray-900 truncate" title={deptName}>
                            {deptName}
                          </span>
                          {dept.allowed ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-[6px] border border-emerald-200 shrink-0">
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                              Allowed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-[6px] border border-destructive/20 shrink-0">
                              <ShieldAlert className="size-3.5 text-destructive" />
                              Not Allowed
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] font-medium">
                          <div>
                            <span className="text-gray-500 font-medium">Start Date:</span>{" "}
                            {dept.startDate ? <span className="font-bold text-gray-900">{dept.startDate}</span> : <span className="text-gray-400 italic text-[12px]">Not Configured</span>}
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">End Date:</span>{" "}
                            {dept.endDate ? <span className="font-bold text-gray-900">{dept.endDate}</span> : <span className="text-gray-400 italic text-[12px]">Not Configured</span>}
                          </div>
                        </div>
                        {dept.message && (
                          <p
                            className="text-[13px] text-gray-700 font-medium leading-snug"
                            dangerouslySetInnerHTML={{ __html: `<b>Note:</b> ${dept.message}` }}
                          />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E7EB]">
              <h3 className="text-[13px] font-bold text-[#6C5DD3] uppercase tracking-wider mb-3">
                Apportioning
              </h3>
              <div className="space-y-3">
                {apportioningSummary && apportioningSummary.length > 0 ? (
                  apportioningSummary.map((item) => (
                    <div
                      key={item.departmentId}
                      className="flex flex-col gap-3 p-5 rounded-xl border border-gray-200 bg-white text-[13px] shadow-sm hover:border-[#6C5DD3]/30 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14px] font-bold text-gray-900 truncate" title={item.departmentName}>
                          {item.departmentName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.apportioningType && item.apportioningType !== "none" && (
                            <span className="text-[12px] uppercase font-semibold px-2.5 py-0.5 rounded-[6px] bg-[#6C5DD3]/10 text-[#6C5DD3] border border-[#6C5DD3]/20 font-mono">
                              {item.apportioningType}
                            </span>
                          )}
                          {item.outOfDateRange ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-[6px] border border-destructive/20">
                              <ShieldAlert className="size-3.5 text-destructive" />
                              Not Allowed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-[6px] border border-emerald-200">
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                              Allowed
                            </span>
                          )}
                        </div>
                      </div>
                      {item.outOfDateRange ? (
                        <div className="w-full">
                          {(item.startDate || item.endDate) && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-[#1f2937] font-medium mb-2">
                              {item.startDate && (
                                <div>
                                  <span className="text-gray-500 font-medium">Start Date:</span>{" "}
                                  <span className="font-bold text-gray-900">{item.startDate}</span>
                                </div>
                              )}
                              {item.endDate && (
                                <div>
                                  <span className="text-gray-500 font-medium">End Date:</span>{" "}
                                  <span className="font-bold text-gray-900">{item.endDate}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <p
                            className="text-[13px] text-gray-700 font-medium leading-snug"
                            dangerouslySetInnerHTML={{ __html: `<b>Note:</b> ${item.message}` }}
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-[#1f2937] font-medium">
                          {item.startDate && (
                            <div>
                              <span className="text-gray-500 font-medium">Start Date:</span>{" "}
                              <span className="font-bold text-gray-900">{item.startDate}</span>
                            </div>
                          )}
                          {item.endDate && (
                            <div>
                              <span className="text-gray-500 font-medium">End Date:</span>{" "}
                              <span className="font-bold text-gray-900">{item.endDate}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 font-medium">Percent:</span>{" "}
                            <span className="font-bold text-gray-900">{item.apportioningPercent}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Allocated:</span>{" "}
                            <span className="font-bold text-gray-900">{item.allocatedMinutes} Min.</span>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Supervisor Consumed:</span>{" "}
                            <span className="font-bold text-[#6C5DD3]">{item.supervisorConsumedMinutes ?? 0} Min.</span>
                          </div>
                          {item.apportioningType !== "manual" && (
                            <div>
                              <span className="text-gray-500 font-medium">Reportee Minutes:</span>{" "}
                              <span className="font-bold text-[#6C5DD3]">{item.enteredMinutes} Min.</span>
                            </div>
                          )}
                          <div className="col-span-2 border-t border-gray-100 pt-1.5 mt-0.5">
                            <span className="text-gray-500 font-medium">Remaining:</span>{" "}
                            <span className="font-bold text-[#6C5DD3]">{item.remainingMinutes} Min.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[13px] text-gray-500 py-3 italic bg-gray-50 border border-gray-200 rounded-lg text-center">
                    No apportioning details found.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex items-center justify-center gap-2">
              <AlertCircle className="size-4 text-[#F97316] shrink-0" />
              <span className="text-[12px] text-gray-500 font-medium italic">
                For any enquiry and updates please contact your system admin.
              </span>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
