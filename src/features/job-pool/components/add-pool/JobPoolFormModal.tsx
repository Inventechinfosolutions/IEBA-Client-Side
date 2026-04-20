import { useMemo, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useGetDepartments } from "@/features/department/queries/getDepartments"
import { usePermissions } from "@/hooks/usePermissions"

import { jobPoolFormSchema } from "../../schemas"
import type { JobPoolFormModalProps, JobPoolFormValues } from "../../types"

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
  const { isDepartmentAdmin, assignedDepartmentIds } = usePermissions()
  const form = useForm<JobPoolFormValues>({
    resolver: zodResolver(jobPoolFormSchema),
    defaultValues: initialValues,
  })

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false)
  // For edit mode, initialValues.department holds a raw ID. We resolve the
  // label once the departments list is available via a derived value below.
  const [selectedDepartmentLabel, setSelectedDepartmentLabel] = useState<string>("")
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null)

  // Reset form when switching to Add mode (modal re-mounts via key, but reset for safety)
  const prevOpenRef = useRef(false)
  if (open && !prevOpenRef.current && mode === "add") {
    form.reset(initialValues)
    setSelectedDepartmentLabel("")
  }
  prevOpenRef.current = open

  const handleClose = () => {
    form.reset()
    setSelectedDepartmentLabel("")
    setIsDepartmentOpen(false)
    onOpenChange(false)
  }

  const {
    data: activeDepartmentsData,
    isLoading: isDepartmentsLoading,
  } = useGetDepartments({ status: "active", page: 1, limit: 100 }, { enabled: open })

  const activeDepartments = useMemo(() => {
    const items = activeDepartmentsData?.items ?? []
    if (isDepartmentAdmin) {
      const allowedSet = new Set(assignedDepartmentIds.map((id: number | string) => String(id)))
      return items.filter((dept: any) => allowedSet.has(String(dept.id)))
    }
    return items
  }, [activeDepartmentsData, isDepartmentAdmin, assignedDepartmentIds])


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        showClose={false}
        overlayClassName="bg-black/35"
        className="max-w-[1400px] w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden rounded-[10px]! bg-white"
      >
        <form 
          onSubmit={form.handleSubmit(onSave)} 
          className="h-full flex flex-col"
        >
          {/* Header Section */}
          <div className="flex flex-col border-b border-[#F3F4F6]">
            <div className="flex items-center justify-between px-8 py-6">
              <h2 className="text-[24px] font-semibold text-[#111827]">
                {mode === "add" ? "Add Job Pool" : "Edit Job Pool"}
              </h2>
              <Controller
                control={form.control}
                name="active"
                render={({ field }) => (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="size-5 rounded-[4px] border-[#E5E7EB] data-[state=checked]:border-[#6C5DD3] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:text-white shadow-sm"
                    />
                    <span className="text-[15px] font-medium text-[#374151]">Active</span>
                  </label>
                )}
              />
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto program-table-scroll">
            <div className="p-8">
              {/* Top Row: Department and Job Pool Name */}
              <div
                className="grid grid-cols-[minmax(0,2fr)_60px_minmax(0,2fr)] gap-4"
                onMouseDownCapture={(event) => {
                  const targetNode = event.target as Node
                  if (
                    isDepartmentOpen &&
                    departmentDropdownRef.current &&
                    !departmentDropdownRef.current.contains(targetNode)
                  ) {
                    setIsDepartmentOpen(false)
                  }
                }}
              >
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-[#374151]" htmlFor="jp-department-trigger">Department</label>
                  <input type="hidden" {...form.register("department")} />
                  <div className="relative" ref={departmentDropdownRef}>
                    <Input
                      id="jp-department-trigger"
                      value={
                        selectedDepartmentLabel ||
                        activeDepartments.find(d => String(d.id) === String(form.watch("department")))?.name ||
                        ""
                      }
                      readOnly
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => mode !== "edit" && setIsDepartmentOpen((prev) => !prev)}
                      onBlur={() => window.setTimeout(() => setIsDepartmentOpen(false), 120)}
                      onFocus={() => mode !== "edit" && setIsDepartmentOpen(true)}
                      placeholder="Select Department"
                      className={
                        mode === "edit"
                          ? "h-[57px] rounded-[8px] border border-[#cfd4dd] bg-[#d2d4d9]/20 px-3 pr-8 text-[12px]! font-normal! text-[#111827] shadow-none pointer-events-auto cursor-not-allowed! opacity-100"
                          : "h-[57px] rounded-[8px] border border-[#c6cedd] bg-white px-3 pr-8 text-[12px]! font-normal! text-[#111827] shadow-none placeholder:text-[12px]! placeholder:text-[#b0b8c8] focus-visible:border-[#1595ff] focus-visible:ring-2 focus-visible:ring-[#1595ff33]"
                      }
                    />
                    <button
                      type="button"
                      disabled={mode === "edit"}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => mode !== "edit" && setIsDepartmentOpen((prev) => !prev)}
                      className={`absolute right-0 top-0 inline-flex h-full w-[24px] items-center justify-center text-[#6b7280] ${mode === "edit" ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                      aria-label="Toggle department options"
                    >
                      {isDepartmentOpen ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                    {isDepartmentOpen && mode !== "edit" ? (
                      <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                        {isDepartmentsLoading ? (
                          <div className="px-3 py-2 text-[11px] text-[#6b7280]">
                            Loading departments...
                          </div>
                        ) : activeDepartments.length === 0 ? (
                          <div className="px-3 py-2 text-[11px] text-[#6b7280]">
                            No active departments available.
                          </div>
                        ) : (
                          <ul className="space-y-0.5">
                            {activeDepartments.map((dept) => {
                              const id = dept.id
                              const label = dept.name ?? ""

                              return (
                                <li key={id}>
                                  <button
                                    type="button"
                                    className="w-full rounded-[5px] px-3 py-1.5 text-left text-[12px] text-[#111827] hover:bg-[#f3f4ff]"
                                    onClick={() => {
                                      if (id) {
                                        form.setValue("department", String(id), {
                                          shouldDirty: true,
                                          shouldTouch: true,
                                          shouldValidate: true,
                                        })
                                        // Reset dependent selections when department changes
                                        form.setValue("assignedJobClassificationIds", [])
                                        form.setValue("assignedEmployeeIds", [])
                                        
                                        setSelectedDepartmentLabel(label)
                                        setIsDepartmentOpen(false)
                                      }
                                    }}
                                  >
                                    {label}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    ) : null}
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
                    className="h-[60px]! rounded-[10px] border-[#E5E7EB] bg-white px-5 text-[12px] disabled:pointer-events-auto disabled:cursor-not-allowed! disabled:bg-[#F3F4F6] disabled:opacity-75"
                  />
                </div>
              </div>

              {/* Modular Sections */}
              <div className="space-y-10 mt-10">
                {(() => {
                  const deptId = form.watch("department")
                  const currentDeptName = activeDepartments.find(d => String(d.id) === String(deptId))?.name || ""
                  
                  return (
                    <>
                      <JobClassificationSection form={form} departmentName={currentDeptName} />
                      <ActivitySection form={form} departmentName={currentDeptName} />
                      <EmployeeSection form={form} departmentName={currentDeptName} />
                    </>
                  )
                })()}
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
