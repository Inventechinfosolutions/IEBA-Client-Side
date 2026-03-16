import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

type MasterCodePaginationProps = {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function MasterCodePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
}: MasterCodePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pageTwo = Math.min(totalPages, 2)

  return (
    <div className="mt-4 flex items-center rounded-[6px] bg-white px-5 py-3 shadow-[0_2px_10px_rgba(16,24,40,0.08)]">
      <div className="ml-auto flex items-center gap-4">
        <p className="text-[12px] text-[#8f93a1]">Total {totalItems} items</p>
        <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded border border-transparent text-[#8f93a1] hover:bg-[#f5f5f8]"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          type="button"
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded border border-[#d8dae3] bg-white text-xs font-medium text-[#1f2937]"
          onClick={() => onPageChange(1)}
        >
          1
        </button>
        <button
          type="button"
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded border border-transparent text-xs text-[#8f93a1] hover:border-[#d8dae3]"
          onClick={() => onPageChange(pageTwo)}
        >
          {pageTwo}
        </button>
        <button
          type="button"
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded border border-transparent text-[#8f93a1] hover:bg-[#f5f5f8]"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight className="size-3.5" />
        </button>
        <div className="ml-3 inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#d8dae3] bg-white px-2 py-1 text-xs text-[#1f2937] shadow-[0_1px_1px_rgba(16,24,40,0.03)]">
          {pageSize} / page
          <ChevronDown className="size-3 text-[#8f93a1]" />
        </div>
      </div>
      </div>
    </div>
  )
}
