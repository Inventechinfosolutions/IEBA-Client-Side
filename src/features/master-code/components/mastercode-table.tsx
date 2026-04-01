import { Fragment, useMemo, useState } from "react"
import DOMPurify from "dompurify"
import {
  ChevronDown,
  ChevronRight,
  Triangle,
} from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  MasterCodeSortKey,
  MasterCodeSortState,
  MasterCodeTableProps,
} from "@/features/master-code/types"

const getRowCodeNumber = (code: string | undefined) => {
  const parsed = Number.parseInt(code ?? "", 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function MasterCodeTable({
  codeType,
  rows,
  isLoading,
  onEditRow,
}: MasterCodeTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [sortState, setSortState] = useState<MasterCodeSortState>({
    key: "code",
    direction: "asc",
  })
  const headers = [
    `${codeType} Code`,
    `${codeType} Code Name`,
    "SPMP",
    "Allocable",
    `${codeType} (%)`,
    "Match",
    "Status",
    "Action",
  ]
  const sortedRows = useMemo(() => {
    const sorted = [...rows]
    sorted.sort((a, b) => {
      const aNum = getRowCodeNumber(a.code)
      const bNum = getRowCodeNumber(b.code)
      const compareByCode =
        aNum === null || bNum === null
          ? (a.code ?? "").localeCompare(b.code ?? "", undefined, {
              numeric: true,
              sensitivity: "base",
            })
          : aNum - bNum

      return sortState.direction === "asc" ? compareByCode : -compareByCode
    })
    return sorted
  }, [rows, sortState])

  const handleSort = (key: MasterCodeSortKey) => {
    setSortState((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        }
      }

      return {
        key,
        direction: "asc",
      }
    })
  }

  const skeletonRows = Array.from({ length: 10 }, (_, index) => `skeleton-row-${index}`)

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: "120px" }} />
          <col style={{ width: "470px" }} />
          <col style={{ width: "74px" }} />
          <col style={{ width: "84px" }} />
          <col style={{ width: "84px" }} />
          <col style={{ width: "74px" }} />
          <col style={{ width: "74px" }} />
          <col style={{ width: "78px" }} />
        </colgroup>
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            {headers.map((header, idx) => (
              <TableHead
                key={header}
                className={`h-10 border-r border-[#6C5DD3] bg-[var(--primary)] px-3 text-[12px] font-medium text-white last:border-r-0 ${
                  idx === 0 ||
                  idx === 2 ||
                  idx === 3 ||
                  idx === 4 ||
                  idx === 5 ||
                  idx === 6 ||
                  idx === 7
                    ? "text-center"
                    : ""
                }`}
              >
                {idx < 2 ? (
                  (() => {
                    const key: MasterCodeSortKey = idx === 0 ? "code" : "name"
                    const isActive = sortState.key === key
                    return (
                  <button
                    type="button"
                    onClick={() => handleSort(key)}
                    className={`inline-flex w-full cursor-pointer items-center gap-1.5 ${
                      idx === 0 ? "justify-center" : ""
                    }`}
                  >
                    <span>{header}</span>
                    {isActive ? (
                      <Triangle
                        className={`size-[5px] fill-white text-white transition-transform ${
                          sortState.direction === "asc" ? "" : "rotate-180"
                        }`}
                      />
                    ) : (
                      <Triangle className="size-[5px] fill-white text-white" />
                    )}
                  </button>
                    )
                  })()
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      idx === 0 ||
                      idx === 2 ||
                      idx === 3 ||
                      idx === 4 ||
                      idx === 5 ||
                      idx === 6 ||
                      idx === 7
                        ? "w-full justify-center"
                        : ""
                    }`}
                  >
                    {header}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? skeletonRows.map((rowId) => (
                <TableRow key={rowId} className="h-10 border-b border-[#eff0f5] hover:bg-transparent">
                  <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                      <Skeleton className="h-3.5 w-8" />
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                    <Skeleton className="h-3.5 w-[80%]" />
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                    <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                    <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                    <Skeleton className="mx-auto h-3.5 w-10" />
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                    <Skeleton className="mx-auto h-3.5 w-4" />
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                    <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center">
                    <Skeleton className="mx-auto h-3.5 w-3.5 rounded-sm" />
                  </TableCell>
                </TableRow>
              ))
            : sortedRows.map((row) => {
                const isExpanded = expandedRowId === row.id
                const sanitizedActivityDescription = DOMPurify.sanitize(
                  row.activityDescription ?? "",
                  {
                    ALLOWED_TAGS: [
                      "ul",
                      "ol",
                      "li",
                      "b",
                      "strong",
                      "i",
                      "em",
                      "br",
                      "p",
                    ],
                  }
                )

                return (
                  <Fragment key={row.id}>
                    <TableRow className="min-h-[40px] border-b border-[#eff0f5] hover:bg-transparent">
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#232735] whitespace-normal break-words">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRowId((prev) => (prev === row.id ? null : row.id))
                            }
                            className="inline-flex cursor-pointer items-center text-[var(--primary)]"
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>
                          <span>{row.code ?? ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] whitespace-normal break-all text-[#262a35]">
                        {row.name}
                      </TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                        {row.spmp ? (
                          <img
                            src={tableCheckIcon}
                            alt=""
                            aria-hidden="true"
                            className="mx-auto size-[12px] object-contain"
                          />
                        ) : (
                          <img
                            src={tableCloseIcon}
                            alt=""
                            aria-hidden="true"
                            className="mx-auto size-[12px] object-contain"
                          />
                        )}
                      </TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                        {row.allocable ? (
                          <img
                            src={tableCheckIcon}
                            alt=""
                            aria-hidden="true"
                            className="mx-auto size-[12px] object-contain"
                          />
                        ) : (
                          <img
                            src={tableCloseIcon}
                            alt=""
                            aria-hidden="true"
                            className="mx-auto size-[12px] object-contain"
                          />
                        )}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#262a35] whitespace-normal break-words">
                        {row.ffpPercent}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#262a35] whitespace-normal break-words">
                        {row.match}
                      </TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                        {row.status ? (
                          <img
                            src={tableCheckIcon}
                            alt=""
                            aria-hidden="true"
                            className="mx-auto size-[12px] object-contain"
                          />
                        ) : (
                          <img
                            src={tableCloseIcon}
                            alt=""
                            aria-hidden="true"
                            className="mx-auto size-[12px] object-contain"
                          />
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onEditRow(row)}
                          className="inline-flex cursor-pointer items-center opacity-80 drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100"
                        >
                          <img
                            src={tableEditIcon}
                            alt=""
                            aria-hidden="true"
                            className="size-[11px] object-contain"
                          />
                        </button>
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="border-b border-[#eff0f5] hover:bg-transparent">
                        <TableCell colSpan={8} className="px-4 py-3 text-left">
                          <p className="text-[12px] font-medium text-[var(--primary)]">
                            Activity Description
                          </p>
                          <div
                            className="mt-1.5 pl-20 max-w-[1110px] whitespace-normal break-words text-[12px] leading-5 text-[#4b5563] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
                            dangerouslySetInnerHTML={{
                              __html: sanitizedActivityDescription,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })}
        </TableBody>
      </Table>
    </div>
  )
}

