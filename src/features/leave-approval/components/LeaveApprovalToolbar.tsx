import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { leaveApprovalFiltersSchema } from "../schemas"
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
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                }}
              >
                <SelectTrigger className="!h-[45px] !w-[140px] rounded-[8px] border border-[#d6d7dc] bg-white text-[12px] shadow-none focus-visible:border-[#cfc6ff] focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  sideOffset={6}
                  align="start"
                  className="ieba-select-scroll z-[90] w-[--radix-select-trigger-width] min-w-[--radix-select-trigger-width] rounded-[8px] border-0 bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)] [&_[data-slot=select-item-indicator]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-viewport]]:h-auto [&_[data-slot=select-viewport]]:max-h-[224px] [&_[data-slot=select-viewport]]:overflow-y-auto"
                >
                  {(["All", "Approved", "Rejected", "Withdraw"] as const).map((opt) => (
                    <SelectItem
                      key={opt}
                      value={opt}
                      className="cursor-pointer rounded-[6px] px-3 py-2 text-[12px] text-[#111827] hover:bg-[#FAFAFA] focus:bg-[#FAFAFA] data-[state=checked]:bg-[#eef8ff]"
                    >
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="w-[140px]">
          <label className="mb-2 block text-[12px] text-[#111827]">Select User</label>
          <Controller
            name="userId"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value ?? "all"}
                onValueChange={(v) => {
                  field.onChange(v)
                }}
              >
                <SelectTrigger className="!h-[45px] !w-[140px] rounded-[6px] border border-[#d6d7dc] bg-white text-[12px] shadow-none focus-visible:border-[#cfc6ff] focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  sideOffset={6}
                  align="start"
                  className="ieba-select-scroll z-[90] w-[--radix-select-trigger-width] min-w-[--radix-select-trigger-width] rounded-[8px] border-0 bg-white p-1 shadow-[0_8px_18px_rgba(17,24,39,0.12)] [&_[data-slot=select-item-indicator]]:hidden [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden [&_[data-slot=select-viewport]]:h-auto [&_[data-slot=select-viewport]]:max-h-[224px] [&_[data-slot=select-viewport]]:overflow-y-auto"
                >
                  {userOptions.map((opt) => (
                    <SelectItem
                      key={opt.id}
                      value={opt.id}
                      className="cursor-pointer rounded-[6px] px-3 py-2 text-[12px] text-[#111827] hover:bg-[#FAFAFA] focus:bg-[#FAFAFA] data-[state=checked]:bg-[#eef8ff]"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-[40px] min-w-[110px] cursor-pointer rounded-[10px] bg-[#6b5bd6] px-8 text-[12px] font-medium text-white hover:bg-[#6b5bd6] disabled:cursor-not-allowed disabled:opacity-70"
        >
          Search
        </Button>
      </div>
    </form>
  )
}

