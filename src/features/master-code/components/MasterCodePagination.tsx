import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"
import type { MasterCodePaginationProps } from "@/features/master-code/types"

export function MasterCodePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
}: MasterCodePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-right", totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [
      1,
      "ellipsis-left",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis-right",
      totalPages,
    ]
  })()

  return (
    <div className="mt-4 flex items-center rounded-[6px] bg-white px-5 py-3 shadow-[0_2px_10px_rgba(16,24,40,0.08)]">
      <div className="ml-auto flex items-center gap-4">
        <p className="text-[12px] text-[#8f93a1]">Total {totalItems} items</p>
        <Pagination className="mx-0 w-auto justify-start">
          <PaginationContent className="gap-2 text-xs">
            <PaginationItem>
              <PaginationLink
                href="#"
                size="icon"
                aria-disabled={currentPage === 1}
                className="inline-flex size-6 items-center justify-center rounded border border-transparent text-[#8f93a1] no-underline hover:bg-[#f5f5f8] data-[active=true]:border-transparent data-[active=true]:bg-transparent data-[active=true]:text-[#8f93a1] data-[active=true]:font-normal [&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:opacity-40"
                onClick={(event) => {
                  event.preventDefault()
                  if (currentPage === 1) return
                  onPageChange(Math.max(1, currentPage - 1))
                }}
              >
                <ChevronLeft className="size-3.5" />
              </PaginationLink>
            </PaginationItem>
            {pages.map((page, index) =>
              typeof page === "number" ? (
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
              ) : (
                <PaginationItem key={`${page}-${index}`}>
                  <span className="inline-flex size-7 items-center justify-center text-xs text-[#8f93a1]">
                    ...
                  </span>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationLink
                href="#"
                size="icon"
                aria-disabled={currentPage === totalPages}
                className="inline-flex size-6 items-center justify-center rounded border border-transparent text-[#8f93a1] no-underline hover:bg-[#f5f5f8] data-[active=true]:border-transparent data-[active=true]:bg-transparent data-[active=true]:text-[#8f93a1] data-[active=true]:font-normal [&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:opacity-40"
                onClick={(event) => {
                  event.preventDefault()
                  if (currentPage === totalPages) return
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }}
              >
                <ChevronRight className="size-3.5" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="flex items-center gap-2 text-xs">
          <div className="ml-3 inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#d8dae3] bg-white px-2 py-1 text-xs text-[#1f2937] shadow-[0_1px_1px_rgba(16,24,40,0.03)]">
            {pageSize} / page
            <ChevronDown className="size-3 text-[#8f93a1]" />
          </div>
        </div>
      </div>
    </div>
  )
}
