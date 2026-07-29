import type { ReactNode } from "react"
import { History, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import editIconImg from "@/assets/edit-icon.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { Department } from "../types"
import { ContactInfo } from "./DepartmentTable"

export type DepartmentCardViewProps = {
  departments: Department[]
  isLoading?: boolean
  canUpdateDepartment?: boolean
  showActionColumn?: boolean
  isSuperAdmin?: boolean
  usersById?: Map<string, any>
  onEdit?: (id: string) => void
  onHistory?: (dept: { id: string; code: string; name: string }) => void
  footer?: ReactNode
}

export function DepartmentCardView({
  departments,
  isLoading,
  canUpdateDepartment,
  showActionColumn = true,
  isSuperAdmin = false,
  usersById,
  onEdit,
  onHistory,
  footer,
}: DepartmentCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`department-card-skeleton-${idx}`}
              className="rounded-[12px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
                <div className="h-4 w-1/2 rounded bg-white/40" />
                <div className="h-5 w-12 rounded bg-white/40" />
              </div>
              <div className="p-5 space-y-4">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="h-16 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-16 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-16 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {departments.map((dept) => {
            const canEditThisRow = canUpdateDepartment || dept.canEdit
            const fullAddress = [dept.address?.street, dept.address?.city, dept.address?.state, dept.address?.zip]
              .filter(Boolean)
              .join(", ")

            return (
              <div
                key={`mobile-dept-${dept.id}`}
                className="department-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col transition-all hover:shadow-md"
              >
                {/* Card Header: PURPLE background in both dark & light modes */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3.5 text-white gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-bold text-[15px] truncate tracking-wide">
                      {dept.code} - {dept.name}
                    </span>
                  </div>
                  {showActionColumn && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSuperAdmin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onHistory?.({
                              id: dept.id,
                              code: dept.code,
                              name: dept.name,
                            })
                          }
                          className="size-8 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors"
                          aria-label={`View history for ${dept.name}`}
                        >
                          <History className="size-[16px]" strokeWidth={2.2} />
                        </Button>
                      )}
                      {canEditThisRow && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit?.(dept.id)}
                          className="size-8 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors"
                          aria-label={`Edit ${dept.name}`}
                        >
                          <img
                            src={editIconImg}
                            alt="Edit"
                            aria-hidden="true"
                            className="size-[16px] object-contain brightness-0 invert"
                          />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 space-y-4 flex-1 bg-white dark:bg-[#0c0d12]">
                  {/* Address Box */}
                  <div className="flex items-start gap-2.5 rounded-lg bg-[#F9FAFB] dark:bg-zinc-900/50 p-3 border border-gray-100 dark:border-zinc-800/80">
                    <MapPin className="size-4 text-[#6C5DD3] shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9ca3af]">
                        Address
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[13px] leading-relaxed mt-0.5 break-words">
                        {fullAddress || "No address provided"}
                      </span>
                    </div>
                  </div>

                  {/* Contacts Section if permitted */}
                  {canUpdateDepartment && (
                    <div className="space-y-2.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9ca3af] block">
                        Contact Details
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* Primary Contact */}
                        <div className="flex flex-col gap-1.5 rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-2.5">
                          <span className="text-[11px] font-semibold text-[#6C5DD3] dark:text-[#a799ff] border-b border-gray-100 dark:border-zinc-800 pb-1">
                            Primary Contact
                          </span>
                          <div className="pt-0.5">
                            <ContactInfo
                              contactId={dept.primaryContactId}
                              contact={dept.primaryContact}
                              resolved={dept.primaryContactId ? usersById?.get(dept.primaryContactId) ?? null : null}
                            />
                          </div>
                        </div>

                        {/* Secondary Contact */}
                        <div className="flex flex-col gap-1.5 rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-2.5">
                          <span className="text-[11px] font-semibold text-[#6C5DD3] dark:text-[#a799ff] border-b border-gray-100 dark:border-zinc-800 pb-1">
                            Secondary Contact
                          </span>
                          <div className="pt-0.5">
                            <ContactInfo
                              contactId={dept.secondaryContactId}
                              contact={dept.secondaryContact}
                              resolved={dept.secondaryContactId ? usersById?.get(dept.secondaryContactId) ?? null : null}
                            />
                          </div>
                        </div>

                        {/* Billing Contact */}
                        <div className="flex flex-col gap-1.5 rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-2.5">
                          <span className="text-[11px] font-semibold text-[#6C5DD3] dark:text-[#a799ff] border-b border-gray-100 dark:border-zinc-800 pb-1">
                            Billing Contact
                          </span>
                          <div className="pt-0.5">
                            <ContactInfo
                              contactId={dept.billingContactId}
                              contact={dept.billingContact}
                              resolved={dept.billingContactId ? usersById?.get(dept.billingContactId) ?? null : null}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settings & Active Status Bar */}
                  <div className="rounded-lg bg-[#F9FAFB] dark:bg-zinc-900/60 p-3 border border-gray-100 dark:border-zinc-800">
                    <div className="grid grid-cols-3 gap-3 items-center text-center divide-x divide-gray-200 dark:divide-zinc-800">
                      <div className="flex flex-col items-center gap-1.5 px-1">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap">
                          Allow Multi
                        </span>
                        <img
                          src={dept.settings?.allowMultiCodes ? statusCheckImg : statusCrossImg}
                          alt={dept.settings?.allowMultiCodes ? "Check" : "Cross"}
                          className="h-[15px] w-[15px]"
                        />
                      </div>

                      <div className="flex flex-col items-center gap-1.5 px-1">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap">
                          Multi Codes
                        </span>
                        {dept.settings?.multiCodes && dept.settings.multiCodes.split(",").filter(Boolean).length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-1">
                            {dept.settings.multiCodes.split(",").filter(Boolean).map((code, idx) => (
                              <span key={idx} className="text-[12px] font-medium text-[#111827] dark:text-white bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <img
                            src={statusCrossImg}
                            alt="Cross"
                            className="h-[15px] w-[15px]"
                          />
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1.5 px-1">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap">
                          Active
                        </span>
                        <img
                          src={dept.active ? statusCheckImg : statusCrossImg}
                          alt={dept.active ? "Active" : "Inactive"}
                          className="h-[15px] w-[15px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
