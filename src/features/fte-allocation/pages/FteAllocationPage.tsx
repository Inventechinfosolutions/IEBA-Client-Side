import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { EmployeesTable } from "../components/EmployeesTable"
import { ProgramTable } from "../components/ProgramTable"
import { useUpdateUserProgramAssignments } from "../mutations/updateUserProgramAssignments"
import { useGetFiscalYears } from "../queries/getFiscalYears"
import { useGetEmployees } from "../queries/getEmployees"
import { useGetPrograms } from "../queries/getPrograms"
import { fteAllocationKeys } from "../keys"
import { fteFilterDefaultValues } from "../schemas"
import type { FteFilterFormValues, ProgramsUpdateFormValues } from "../types"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function FteAllocationPage() {
  const [filters, setFilters] = useState<FteFilterFormValues>(
    fteFilterDefaultValues
  )
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  )

  const { data: fiscalYears = [] } = useGetFiscalYears()

  // Reactively select the most recent fiscal year if none is selected yet (zero useEffects!)
  const activeFiscalYearId = filters.fiscalYearId || fiscalYears[0]?.id || ""

  const { data: employees = [], isLoading: employeesLoading } =
    useGetEmployees(activeFiscalYearId, filters.inactive)
  const { data: programs = [], isLoading: programsLoading } = useGetPrograms(
    activeFiscalYearId,
    selectedEmployeeId
  )
  const queryClient = useQueryClient()

  const updateMutation = useUpdateUserProgramAssignments()

  async function handleUpdate(values: ProgramsUpdateFormValues) {
    if (!selectedEmployeeId || !activeFiscalYearId) return
    try {
      await updateMutation.mutateAsync({
        fiscalYearId: activeFiscalYearId,
        userId: selectedEmployeeId,
        isUpdate: false,
        values,
      })

      toast.success("FTE allocation updated successfully.")
      await queryClient.invalidateQueries({
        queryKey: fteAllocationKeys.programs(activeFiscalYearId, selectedEmployeeId),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update FTE allocation"
      toast.error(msg)
      await queryClient.invalidateQueries({
        queryKey: fteAllocationKeys.programs(activeFiscalYearId, selectedEmployeeId),
      })
    }
  }

  return (
    <div className="flex gap-[16px]">
      {/* ── Left Column: Select Year + Employees list ── */}
      <div className="flex w-[410px] shrink-0 flex-col gap-[16px]">
        
        {/* Select Fiscal Year (Matches Total Tab height) */}
        <div className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-[8px] bg-white px-[42px] py-[8px]">
          <span className="shrink-0 text-[14px] font-[400] text-[#1F2937]">
            Select Fiscal Year
          </span>
          <Select
            value={activeFiscalYearId}
            onValueChange={(val) => {
              setFilters((prev) => ({ ...prev, fiscalYearId: val }))
              setSelectedEmployeeId(null)
              queryClient.invalidateQueries({
                queryKey: fteAllocationKeys.employees({
                  fiscalYearId: val,
                  includeInactive: filters.inactive,
                }),
              })
            }}
          >
            <SelectTrigger className="h-8 w-[140px] shrink-0 rounded-[6px] border border-[#D9D9D9] bg-white px-[11px] text-[14px] font-[400] text-[#1F2937] shadow-none outline-none focus:border-[#4096ff] focus:ring-1 focus:ring-[#4096ff] focus:ring-offset-0 data-[state=open]:border-[#4096ff] data-[state=open]:ring-1 data-[state=open]:ring-[#4096ff]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={4}
              className="max-h-[250px] w-full min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-[6px] border-none bg-white p-[4px] shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)] [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-viewport]]:overflow-y-auto [&_[data-slot=select-viewport]]:p-0"
            >
              {fiscalYears.map((fy) => (
                <SelectItem
                  key={fy.id}
                  value={fy.id}
                  className="rounded-[4px] px-[12px] py-[6px] text-[14px] font-[400] text-[#1F2937] hover:bg-[#F5F5F5] focus:bg-[#F5F5F5] data-[state=checked]:bg-[#E6F4FF] data-[state=checked]:font-[600]"
                >
                  {fy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Employees Table */}
        <div className="w-full rounded-[8px] bg-white">
          <EmployeesTable
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            isLoading={employeesLoading}
            filters={filters}
            onInactiveChange={(inactive) =>
              setFilters((prev) => ({ ...prev, inactive }))
            }
            onEmployeeSelect={(id) => setSelectedEmployeeId(id)}
          />
        </div>
      </div>

      {/* ── Right Column: Programs + Update ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ProgramTable
          programs={programs}
          selectedEmployeeId={selectedEmployeeId}
          isLoading={programsLoading}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  )
}

