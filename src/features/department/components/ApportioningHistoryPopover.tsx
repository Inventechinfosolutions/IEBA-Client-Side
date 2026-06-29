import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { History } from "lucide-react"
import { useApportioningHistory } from "../queries/useApportioningHistory"
import { Spinner } from "@/components/ui/spinner"
import { format } from "date-fns"

export function ApportioningHistoryPopover({ departmentId }: { departmentId?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const query = useApportioningHistory(departmentId, isOpen)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ml-2 inline-flex items-center justify-center rounded-full p-0.5 text-[#6C5DD3] hover:bg-[#F3F0FF] hover:text-[#5244B2] transition-colors"
          title="View Apportioning History"
        >
          <History className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 z-[100] shadow-lg rounded-[8px]" align="start" side="bottom">
        <div className="text-[13px] font-bold text-[#111827] mb-3">Apportioning History</div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-[12px] border-collapse whitespace-nowrap min-w-[500px]">
            <thead className="bg-[#6b5cd6] text-white sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium border-l border-[#897ee0]">Apportioning</th>
                <th className="px-3 py-2 font-medium border-l border-[#897ee0]">Type</th>
                <th className="px-3 py-2 font-medium border-l border-[#897ee0]">Start Date</th>
                <th className="px-3 py-2 font-medium border-l border-[#897ee0]">End Date</th>
                <th className="px-3 py-2 font-medium border-l border-[#897ee0]">Updated By</th>
                <th className="px-3 py-2 font-medium border-l border-[#897ee0]">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {query.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-[#6b7280]">
                    <div className="flex justify-center items-center gap-2">
                      <Spinner className="size-4 text-[#6C5DD3]" />
                      <span>Loading history...</span>
                    </div>
                  </td>
                </tr>
              ) : query.isError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-red-500">
                    Failed to load history.
                  </td>
                </tr>
              ) : query.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-[#6b7280]">
                    No apportioning history found.
                  </td>
                </tr>
              ) : (
                query.data?.map((row) => {
                  const formatDate = (dateStr: string | null) => {
                    if (!dateStr) return "-"
                    try {
                      const d = new Date(dateStr)
                      if (isNaN(d.getTime())) return dateStr
                      return format(d, "MM/dd/yyyy")
                    } catch {
                      return dateStr
                    }
                  }

                  const formatTimestamp = (dateStr: string | null) => {
                    if (!dateStr) return "-"
                    try {
                      const d = new Date(dateStr)
                      if (isNaN(d.getTime())) return dateStr
                      return format(d, "MM/dd/yyyy HH:mm:ss")
                    } catch {
                      return dateStr
                    }
                  }

                  const typeStr = row.autoApportioning
                    ? "Auto"
                    : row.manualApportioning
                    ? "Manual"
                    : "-"

                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-[#374151] font-medium">{row.action}</td>
                      <td className="px-3 py-2 text-[#374151]">{row.apportioning ? "Yes" : "No"}</td>
                      <td className="px-3 py-2 text-[#374151]">{typeStr}</td>
                      <td className="px-3 py-2 text-[#374151]">{formatDate(row.apportioningStartDate)}</td>
                      <td className="px-3 py-2 text-[#374151]">{formatDate(row.apportioningEndDate)}</td>
                      <td className="px-3 py-2 text-[#374151]">{row.updatedBy || "System"}</td>
                      <td className="px-3 py-2 text-[#374151]">{formatTimestamp(row.updatedAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </PopoverContent>
    </Popover>
  )
}
