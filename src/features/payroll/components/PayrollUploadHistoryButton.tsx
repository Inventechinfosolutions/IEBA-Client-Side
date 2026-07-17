import { Download, Eye } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

import { downloadPayrollUpload } from "../api/payrollApi"
import { usePayrollUploads } from "../hooks/usePayrollUploads"
import type { PayrollUploadItem } from "../types"
import { triggerBrowserDownloadBlob } from "../utils/payrollCsv"

function formatUploadedAt(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

export function PayrollUploadHistoryButton() {
  const [open, setOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const uploadsModule = usePayrollUploads(1, 50, open)

  const handleDownload = async (item: PayrollUploadItem) => {
    setDownloadingId(item.id)
    try {
      const blob = await downloadPayrollUpload(item.id)
      triggerBrowserDownloadBlob(item.fileName || "payroll-upload.xlsx", blob)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed."
      toast.error(message)
    } finally {
      setDownloadingId(null)
    }
  }

  const items = uploadsModule.data?.items ?? []
  const total = uploadsModule.data?.total ?? 0
  const isLoading = uploadsModule.isLoading || uploadsModule.isFetching

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-(--primary) hover:opacity-80"
        aria-label="View upload history"
      >
        <Eye className="size-4" aria-hidden />
        History
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[85vh] w-[min(920px,calc(100vw-2rem))] max-w-[920px] overflow-hidden rounded-[10px] border-0 p-0 shadow-[0_8px_30px_rgba(16,24,40,0.18)]"
          style={{ "--primary": "#6C5DD3" } as React.CSSProperties}
        >
          <DialogHeader className="border-b border-[#e7e9f2] px-5 py-4 text-left">
            <DialogTitle className="text-[16px] font-semibold text-[#111827]">
              Upload History
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[min(60vh,520px)] overflow-auto px-5 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-[14px] text-[#6b7280]">
                <Spinner className="size-4 text-[#6C5DD3]" />
                Loading history…
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-[#6b7280]">No upload history yet.</p>
            ) : (
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#e7e9f2] text-[#6b7280]">
                      <th className="px-2 py-2 font-medium">File</th>
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Records</th>
                      <th className="px-2 py-2 font-medium">Uploaded</th>
                      <th className="px-2 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-[#f3f4f6] text-[#111827]">
                        <td className="max-w-[260px] truncate px-2 py-2.5" title={item.fileName}>
                          {item.fileName}
                        </td>
                        <td className="px-2 py-2.5 capitalize">{item.payrolltype ?? "—"}</td>
                        <td className="px-2 py-2.5">{item.recordsCreated}</td>
                        <td className="whitespace-nowrap px-2 py-2.5">
                          {formatUploadedAt(item.createdAt)}
                        </td>
                        <td className="px-2 py-2.5">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={downloadingId === item.id}
                            onClick={() => handleDownload(item)}
                            className="h-8 gap-1.5 rounded-[6px] border-[#d6d7dc] px-3 text-[12px] font-medium text-[#111827] hover:bg-[#f9fafb]"
                          >
                            {downloadingId === item.id ? (
                              <Spinner className="size-3.5 text-[#6C5DD3]" />
                            ) : (
                              <Download className="size-3.5 text-(--primary)" aria-hidden />
                            )}
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {total > items.length ? (
                  <p className="mt-3 text-[12px] text-[#6b7280]">
                    Showing {items.length} of {total} uploads
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
