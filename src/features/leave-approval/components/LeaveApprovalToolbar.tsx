import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { leaveApprovalFiltersSchema } from "../schemas"
import { leaveApprovalStatusLabel, leaveApprovalStatusValues } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalFilters, LeaveApprovalToolbarProps } from "../types"

export function LeaveApprovalToolbar({
  defaultValues,
  userOptions,
  isSubmitting = false,
  onSearch,
}: LeaveApprovalToolbarProps) {
  const form = useForm<LeaveApprovalFilters>({
    resolver: zodResolver(leaveApprovalFiltersSchema),
    defaultValues,
    mode: "onSubmit",
  })

  const handleSubmit = form.handleSubmit((values) => onSearch(values))

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-transparent px-0 py-0"
    >
      <div className="flex flex-wrap items-end gap-6">
        <div className="w-[140px]">
          <label className="mb-2 block text-[12px] text-[#111827]">Type</label>
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={[
                  { value: "All", label: "All" },
                  ...leaveApprovalStatusValues
                    .filter((s) => s !== "draft")
                    .map((s) => ({
                      value: leaveApprovalStatusLabel[s],
                      label: leaveApprovalStatusLabel[s],
                    })),
                ]}
                placeholder="All"
                className="!h-[45px] !min-h-[45px] !w-[140px] !rounded-[8px] !border-[#d6d7dc] !text-[12px] focus-visible:!border-[#6C5DD3] focus-visible:!ring-0"
                contentClassName="max-h-[224px]"
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[12px]"
              />
            )}
          />
        </div>

        <div className="w-[140px]">
          <label className="mb-2 block text-[12px] text-[#111827]">Select User</label>
          <Controller
            name="userId"
            control={form.control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value ?? "all"}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={[
                  { value: "all", label: "All", key: "all" },
                  ...userOptions.map((opt) => ({
                    value: opt.id,
                    label: opt.label,
                    key: opt.id,
                  })),
                ]}
                placeholder="All"
                className="!h-[45px] !min-h-[45px] !w-[140px] !rounded-[6px] !border-[#d6d7dc] !text-[12px] focus-visible:!border-[#6C5DD3] focus-visible:!ring-0"
                contentClassName="max-h-[224px]"
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[12px]"
              />
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-[40px] min-w-[110px] cursor-pointer rounded-[10px] bg-[#6C5DD3] px-8 text-[12px] font-medium text-white hover:bg-[#6C5DD3] disabled:cursor-not-allowed disabled:opacity-70"
        >
          Search
        </Button>
      </div>
    </form>
  )
}


