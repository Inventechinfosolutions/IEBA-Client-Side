import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LeaveApprovalPaginationProps } from "../types"

const PAGE_SIZES = [10, 20, 50] as const

export function LeaveApprovalPagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: LeaveApprovalPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)))
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="mt-4 flex items-center gap-4 rounded-[6px] bg-white px-5 py-3 shadow-[0_2px_10px_rgba(16,24,40,0.08)]">
      <p className="text-[12px] text-[#8f93a1]">Total {totalItems} items</p>

      <div className="ml-auto flex items-center gap-4">
        <Pagination className="mx-0 w-auto justify-start">
          <PaginationContent className="gap-2 text-xs">
            <PaginationItem>
              <PaginationLink
                href="#"
                size="icon"
                aria-disabled={currentPage === 1}
                className="inline-flex size-6 items-center justify-center rounded border border-transparent text-[#8f93a1] no-underline hover:bg-[#f5f5f8] [&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:opacity-40"
                onClick={(event) => {
                  event.preventDefault()
                  if (currentPage === 1) return
                  onPageChange(Math.max(1, currentPage - 1))
                }}
              >
                {"<"}
              </PaginationLink>
            </PaginationItem>

            {pages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  size="icon"
                  isActive={page === currentPage}
                  className={`inline-flex size-7 items-center justify-center rounded border text-xs no-underline ${
                    page === currentPage
                      ? "border-[#d8dae3] bg-white font-medium text-[#1f2937]"
                      : "border-transparent text-[#8f93a1] hover:border-[#d8dae3]"
                  }`}
                  onClick={(event) => {
                    event.preventDefault()
                    onPageChange(page)
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationLink
                href="#"
                size="icon"
                aria-disabled={currentPage === totalPages}
                className="inline-flex size-6 items-center justify-center rounded border border-transparent text-[#8f93a1] no-underline hover:bg-[#f5f5f8] [&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:opacity-40"
                onClick={(event) => {
                  event.preventDefault()
                  if (currentPage === totalPages) return
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }}
              >
                {">"}
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[96px] rounded-[8px] border border-[#e5e7ef] bg-white text-[12px] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[90] rounded-[8px] border border-[#d9deea] bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)} className="cursor-pointer rounded-[6px] px-3 py-2 text-[12px]">
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

