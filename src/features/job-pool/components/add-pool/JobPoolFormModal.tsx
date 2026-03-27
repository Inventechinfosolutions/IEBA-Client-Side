import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { jobPoolFormSchema } from "../../schemas"
import type { JobPoolFormModalProps, JobPoolFormValues } from "../../types"
import { DEPARTMENTS } from "../../mock"

// Refactored Sections
import { JobClassificationSection } from "./JobClassificationSection"
import { ActivitySection } from "./ActivitySection"
import { EmployeeSection } from "./EmployeeSection"

export function JobPoolFormModal({
  open,
  mode,
  initialValues,
  isSubmitting,
  onOpenChange,
  onSave,
}: JobPoolFormModalProps) {
  const form = useForm<JobPoolFormValues>({
    resolver: zodResolver(jobPoolFormSchema),
    defaultValues: initialValues,
  })

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false)
  const departmentDropdownRef = useRef<HTMLDivElement>(null)

  // --- Form Watching ---
  const watchActive = form.watch("active")

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        showClose={false}
        overlayClassName="bg-black/35"
        className="max-w-[1400px] w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden rounded-[10px]!"
      >
        <form 
          onSubmit={form.handleSubmit(onSave)} 
          className="h-full flex flex-col"
          onMouseDownCapture={(event) => {
            if (isDepartmentOpen && departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target as Node)) {
              setIsDepartmentOpen(false)
            }
          }}
        >
          {/* Header Section */}
          <div className="flex flex-col border-b border-[#F3F4F6]">
            <div className="flex items-center justify-between px-8 py-6">
              <h2 className="text-[24px] font-semibold text-[#111827]">
                {mode === "add" ? "Add Job Pool" : "Edit Job Pool"}
              </h2>
              <label 
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => form.setValue("active", !watchActive)}
              >
                <div
                  className={`flex size-5 items-center justify-center rounded-[4px] border shadow-sm transition-all ${
                    watchActive ? "bg-[#6C5DD3] border-[#6C5DD3] text-white" : "bg-white border-[#E5E7EB] text-transparent hover:border-[#D1D5DB]"
                  }`}
                >
                  <Check className="size-3.2 stroke-3" />
                </div>
                <span className="text-[15px] font-medium text-[#374151]">Active</span>
              </label>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto program-table-scroll">
            <div className="p-8">
              {/* Top Row: Department and Job Pool Name */}
              <div className="grid grid-cols-[1fr_60px_1fr] gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#374151]">Department</label>
                  <div className="relative w-[230px]" ref={departmentDropdownRef}>
                    <Input
                      value={form.watch("department") || ""}
                      readOnly
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsDepartmentOpen((prev) => !prev)}
                      placeholder="Select Department"
                      className="h-[60px]! w-full rounded-[8px] border border-[#E5E7EB] bg-white px-5 pr-10 text-[15px] font-normal text-[#111827] shadow-none placeholder:text-[#9CA3AF] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsDepartmentOpen((prev) => !prev)}
                      className="absolute right-0 top-0 inline-flex h-full w-[40px] cursor-pointer items-center justify-center text-[#6b7280]"
                    >
                      {isDepartmentOpen ? (
                        <ChevronUp className="size-5" />
                      ) : (
                        <ChevronDown className="size-5" />
                      )}
                    </button>
                    {isDepartmentOpen && (
                      <div className="absolute z-100 mt-1 max-h-[220px] w-full overflow-auto rounded-[8px] border border-[#EEF0F5] bg-white p-1 shadow-xl">
                        {DEPARTMENTS.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              form.setValue("department", dept, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              })
                              setIsDepartmentOpen(false)
                            }}
                            className={`block w-full cursor-pointer rounded-[4px] px-4 py-2 text-left text-[14px] font-normal text-[#374151] hover:bg-[#F3F4F6] ${
                              form.watch("department") === dept ? "bg-[#F3F0FF] text-[#6C5DD3]" : ""
                            }`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Spacer matching the arrows column */}
                <div />

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#374151]">Job Pool</label>
                  <Input
                    {...form.register("name")}
                    placeholder="Job Pool Name"
                    disabled={!form.watch("department")}
                    className="h-[60px]! rounded-[10px] border-[#E5E7EB] bg-white px-5 text-[15px] disabled:cursor-not-allowed! disabled:bg-[#F3F4F6] disabled:opacity-75"
                  />
                </div>
              </div>

              {/* Modular Sections */}
              <div className="space-y-10 mt-10">
                <JobClassificationSection form={form} />
                <ActivitySection form={form} />
                <EmployeeSection form={form} />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#F3F4F6] px-8 py-5">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 min-w-[100px] cursor-pointer rounded-[8px] bg-[#6C5DD3] text-white hover:bg-[#5B4DC5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              onClick={handleClose}
              className="h-11 min-w-[100px] cursor-pointer rounded-[10px] bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]"
            >
              Exit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
