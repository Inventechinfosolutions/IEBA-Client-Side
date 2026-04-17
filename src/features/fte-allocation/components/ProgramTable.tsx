import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { programsUpdateFormSchema } from "../schemas"
import type { ProgramTableProps, ProgramsUpdateFormValues } from "../types"

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-[58px]">
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="6"
        y="12"
        width="44"
        height="32"
        rx="4"
        stroke="#D1D5DB"
        strokeWidth="2"
        fill="white"
      />
      <path
        d="M6 30h10l4 6h16l4-6h10"
        stroke="#D1D5DB"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
    <span className="text-[14px] font-[400] text-[#9CA3AF]">No data</span>
  </div>
)

export function ProgramTable({
  programs,
  selectedEmployeeId,
  isLoading = false,
  onUpdate,
}: ProgramTableProps) {
  const form = useForm<ProgramsUpdateFormValues>({
    resolver: zodResolver(programsUpdateFormSchema),
    values: {
      programs: programs.map((p) => ({
        ...p,
        budgetedFte: Number(p.budgetedFte),
        allocatedFte: Number(p.allocatedFte),
      })),
    },
  })

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form

  const { fields } = useFieldArray({
    control,
    name: "programs",
  })

 
  const currentPrograms = watch("programs") || []

  const totalBudgeted = currentPrograms.reduce(
    (sum, p) => sum + (Number(p.budgetedFte) || 0),
    0
  )

  const totalAllocated = currentPrograms.reduce(
    (sum, p) => sum + (Number(p.allocatedFte) || 0),
    0
  )

  return (
    <div className="flex flex-1 flex-col gap-[16px]">
      {/* ── Total summary row ─────────────────────────────────────────────── */}
      <div className="flex min-h-[60px] overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
        <div className="flex flex-1 items-center px-4 py-3">
          <span className="text-[14px] font-[700] text-[#6C5DD3]">Total</span>
        </div>
        <div className="flex w-[212px] shrink-0 items-center justify-center border-l border-[#E5E7EB] px-4 py-3">
          <span className="text-[14px] font-[700] text-[#6C5DD3]">
            {totalBudgeted.toFixed(1)}
          </span>
        </div>
        <div className="flex w-[212px] shrink-0 items-center justify-center border-l border-[#E5E7EB] px-4 py-3">
          <span className="text-[14px] font-[700] text-[#6C5DD3]">
            {totalAllocated.toFixed(1)}
          </span>
        </div>
      </div>

      {/* ── Programs table (3 columns only) ───────────────────────────────── */}
      <div className="overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white [&_[data-slot=table-container]]:max-h-[400px] [&_[data-slot=table-container]]:overflow-y-auto [&_[data-slot=table-container]]:program-table-scroll [&_[data-slot=table-container]]:scrollbar-auto">
        <Table className="w-full border-collapse table-fixed">
          <TableHeader className="sticky top-0 z-20 bg-[#6C5DD3]">
            <TableRow className="bg-[#6C5DD3] hover:bg-[#6C5DD3] border-none">
              <TableHead className="w-auto border-r border-[#FFFFFF66] px-[12px] py-[13px] text-left text-[14px] font-[400] text-white">
                Program
              </TableHead>
              <TableHead className="w-[212px] border-r border-[#FFFFFF66] px-[12px] py-[13px] text-center text-[14px] font-[400] text-white">
                Budgeted FTE
              </TableHead>
              <TableHead className="w-[212px] px-[12px] py-[13px] text-center text-[14px] font-[400] text-white">
                Allocated FTE
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-[#E5E7EB]">
                  <TableCell className="px-[12px] py-[4px]">
                    <Skeleton className="h-4 w-[70%]" />
                  </TableCell>
                  <TableCell className="px-[12px] py-[4px] text-center">
                    <Skeleton className="mx-auto h-4 w-16" />
                  </TableCell>
                  <TableCell className="px-[12px] py-[4px] text-center">
                    <Skeleton className="mx-auto h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="p-0">
                  <div className="h-[166px] w-full bg-[#f8fafc]/50">
                    <EmptyState />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, index) => (
                <TableRow
                  key={field.id}
                  className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB]"
                >
                  <TableCell className="border-r border-[#E5E7EB] px-[16px] py-[4px] text-[14px] font-[400] text-[#1F2937]">
                    {field.program}
                  </TableCell>
                  <TableCell className="border-r border-[#E5E7EB] px-[16px] py-[4px] text-center text-[14px] font-[400] text-[#1F2937]">
                    <div className="flex flex-col items-center justify-center">
                      <input
                        {...register(`programs.${index}.budgetedFte`, {
                          valueAsNumber: true,
                        })}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) e.target.value = val.toFixed(1)
                        }}
                        type="number"
                        step="0.01"
                        className="h-[42px] w-[190px] rounded-[6px] border border-[#D9D9D9] bg-white px-[16px] text-right text-[14px] outline-none focus:border-[#6C5DD3] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      {errors.programs?.[index]?.budgetedFte && (
                        <span className="mt-1 text-[12px] text-red-500">
                          {errors.programs[index].budgetedFte.message}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-[16px] py-[4px] text-center text-[14px] font-[400] text-[#1F2937]">
                    <div className="flex flex-col items-center justify-center">
                      <input
                        {...register(`programs.${index}.allocatedFte`, {
                          valueAsNumber: true,
                        })}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) e.target.value = val.toFixed(1)
                        }}
                        type="number"
                        step="0.01"
                        className="h-[42px] w-[190px] rounded-[6px] border border-[#D9D9D9] bg-white px-[16px] text-right text-[14px] outline-none focus:border-[#6C5DD3] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      {errors.programs?.[index]?.allocatedFte && (
                        <span className="mt-1 text-[12px] text-red-500">
                          {errors.programs[index].allocatedFte.message}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

     
     
      <div className="flex items-center justify-end rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-[12px] shadow-[0_0_20px_0_#0000001a]">
        <Button
          type="button"
          onClick={form.handleSubmit((values) => onUpdate(values))}
          disabled={!selectedEmployeeId}
          className="h-[44px] min-w-[120px] rounded-[10px] bg-[#6C5DD3] px-8 text-[14px] font-[400] text-white hover:bg-[#5B4DC5] disabled:opacity-50"
        >
          Update
        </Button>
      </div>
    </div>
  )
}

