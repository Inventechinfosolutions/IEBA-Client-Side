import { ChevronLeft, ChevronRight, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CountyActivityCodeAddPageProps } from "../types"

const CODE_TYPE_OPTIONS = ["FFP", "NFFP"] as const
const CODE_OPTIONS = [
  { label: "6 * SPMP Training", value: 6 },
  { label: "8 * SPMP Program Planning", value: 8 },
] as const
const DEPARTMENTS = ["Social Services", "Public Health", "Human Services"] as const

export function CountyActivityCodeAddPage({
  form,
  onSubmit,
  onClose,
  mode = "add",
}: CountyActivityCodeAddPageProps) {
  const [tab, setTab] = useState<"primary" | "sub">("primary")
  const [leftSearch, setLeftSearch] = useState("")
  const [rightSearch, setRightSearch] = useState("")
  const [selectedLeft, setSelectedLeft] = useState<string[]>([])
  const [selectedRight, setSelectedRight] = useState<string[]>([])

  const departmentValue = form.watch("department")
  const assignedDepartments = useMemo(() => {
    const value = departmentValue.trim()
    if (!value) return []
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }, [departmentValue])

  const unassignedDepartments = useMemo(
    () => DEPARTMENTS.filter((item) => !assignedDepartments.includes(item)),
    [assignedDepartments]
  )

  const filteredUnassigned = useMemo(
    () =>
      unassignedDepartments.filter((item) =>
        item.toLowerCase().includes(leftSearch.trim().toLowerCase())
      ),
    [leftSearch, unassignedDepartments]
  )
  const filteredAssigned = useMemo(
    () =>
      assignedDepartments.filter((item) =>
        item.toLowerCase().includes(rightSearch.trim().toLowerCase())
      ),
    [assignedDepartments, rightSearch]
  )

  const moveToAssigned = () => {
    if (selectedLeft.length === 0) return
    const next = [...new Set([...assignedDepartments, ...selectedLeft])]
    form.setValue("department", next.join(", "), { shouldValidate: true })
    setSelectedLeft([])
  }

  const moveToUnassigned = () => {
    if (selectedRight.length === 0) return
    const next = assignedDepartments.filter((item) => !selectedRight.includes(item))
    form.setValue("department", next.join(", "), { shouldValidate: true })
    setSelectedRight([])
  }

  const handleSave = () => {
    if (tab === "primary" && assignedDepartments.length === 0) {
      form.setError("department", { message: "Department is required", type: "manual" })
      return
    }
    onSubmit()
  }

  return (
    <div className="rounded-[18px] border border-[#EBEDF0] bg-white">
      <div className="grid grid-cols-2 border-b border-[#E9EAEC]">
        <button
          type="button"
          onClick={() => setTab("primary")}
          className={`h-[62px] text-[18px] font-normal ${
            tab === "primary" ? "bg-[#6C5DD3] text-white" : "bg-white text-[#6C5DD3]"
          }`}
        >
          Primary County Activity Code
        </button>
        <button
          type="button"
          onClick={() => setTab("sub")}
          className={`h-[62px] text-[18px] font-normal ${
            tab === "sub" ? "bg-[#6C5DD3] text-white" : "bg-white text-[#6C5DD3]"
          }`}
        >
          Sub County Activity Code
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
        className="space-y-4 p-6"
      >
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="flex items-center gap-2 text-[16px] text-[#1F2937]">
            {tab === "primary" && mode !== "edit" && (
              <>
                <Checkbox />
                <span>Copy Code</span>
              </>
            )}
          </div>
          <h3 className="whitespace-nowrap text-center text-[22px] max-[1024px]:text-[22px] max-[768px]:text-[18px] font-normal text-[#1F2937]">
            {mode === "edit" ? "Edit" : "Add"}{" "}
            {tab === "primary" ? "Primary" : "Sub"} County Activity
          </h3>
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-[16px] text-[#1F2937]">
              <Checkbox
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked === true)}
              />
              <span>Active</span>
            </label>
          </div>
        </div>

        {tab === "primary" ? (
          <div className="mt-[35px] grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[14px] font-normal text-[#1F2937]">
                Code Type
              </label>
              <Select
                value={form.watch("masterCodeType")}
                onValueChange={(value) => form.setValue("masterCodeType", value)}
              >
                <SelectTrigger
                  className="data-[size=default]:h-[48px] data-[size=sm]:h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CODE_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[14px] font-normal text-[#1F2937]">
                Code
              </label>
              <Select
                value={String(form.watch("masterCode"))}
                onValueChange={(value) => form.setValue("masterCode", Number(value))}
              >
                <SelectTrigger
                  className="data-[size=default]:h-[48px] data-[size=sm]:h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                >
                  <SelectValue placeholder="Select code" />
                </SelectTrigger>
                <SelectContent>
                  {CODE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={String(item.value)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[14px] font-normal text-[#1F2937]">
                Activity Code
              </label>
              <Input
                className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                value={form.watch("countyActivityCode")}
                onChange={(event) => form.setValue("countyActivityCode", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[14px] font-normal text-[#1F2937]">
                Activity Name
              </label>
              <Input
                className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                value={form.watch("countyActivityName")}
                onChange={(event) => form.setValue("countyActivityName", event.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="mt-[40px] grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[14px] font-normal text-[#1F2937]">
                Primary Activity Code
              </label>
              <Select
                value={String(form.watch("masterCode"))}
                onValueChange={(value) => form.setValue("masterCode", Number(value))}
              >
                <SelectTrigger
                  className="data-[size=default]:h-[48px] data-[size=sm]:h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                >
                  <SelectValue placeholder="Select primary activity code" />
                </SelectTrigger>
                <SelectContent>
                  {CODE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={String(item.value)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[14px] font-normal text-[#1F2937]">
                Secondary Code
              </label>
              <Input
                className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                value={form.watch("countyActivityCode")}
                onChange={(event) => form.setValue("countyActivityCode", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[14px] font-normal text-[#1F2937]">
                Activity Name
              </label>
              <Input
                className="h-[48px] w-full rounded-[10px] border-[#D9D9D9]"
                value={form.watch("countyActivityName")}
                onChange={(event) => form.setValue("countyActivityName", event.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mt-[30px] space-y-1">
          <label className="text-[14px] font-normal text-[#1F2937]">
            Description
          </label>
          <textarea
            className="min-h-[100px] w-full rounded-[10px] border border-[#D9D9D9] px-4 py-3 text-[15px] outline-none"
            value={form.watch("description")}
            onChange={(event) => form.setValue("description", event.target.value)}
          />
        </div>

        {tab === "primary" && (
          <div className="grid grid-cols-[minmax(0,1fr)_74px_minmax(0,1fr)] gap-4">
            <div className="w-full overflow-hidden rounded-[12px] border border-[#E5E7EB]">
              <div className="flex h-[44px] items-center justify-between bg-[#6C5DD3] px-4 font-normal text-white">
                <span className="font-normal">{filteredUnassigned.length} item</span>
                <span className="font-normal">Unassigned Departments</span>
              </div>
              <div className="space-y-3 p-3">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <Input
                    value={leftSearch}
                    onChange={(event) => setLeftSearch(event.target.value)}
                    placeholder="Search here"
                    className="h-[44px] rounded-[8px] border-[#D9D9D9] pl-9"
                  />
                </div>
                <div className="min-h-[165px] space-y-2">
                  {filteredUnassigned.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 text-[14px] font-normal text-[#1F2937]"
                    >
                      <Checkbox
                        checked={selectedLeft.includes(item)}
                        onCheckedChange={(checked) =>
                          setSelectedLeft((prev) =>
                            checked === true
                              ? [...prev, item]
                              : prev.filter((entry) => entry !== item)
                          )
                        }
                      />
                      <span className="font-normal">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex min-w-[74px] flex-col items-center justify-center gap-3">
              <Button
                type="button"
                size="icon"
                onClick={moveToAssigned}
                className="h-[38px] w-[62px] rounded-[12px] bg-[#6C5DD3] hover:bg-[#5B4DC5]"
              >
                <ChevronRight className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={moveToUnassigned}
                className="h-[38px] w-[62px] rounded-[12px] bg-[#6C5DD3] hover:bg-[#5B4DC5]"
              >
                <ChevronLeft className="size-5" />
              </Button>
            </div>

            <div className="w-full overflow-hidden rounded-[12px] border border-[#E5E7EB]">
              <div className="flex h-[44px] items-center justify-between bg-[#6C5DD3] px-4 font-normal text-white">
                <span className="font-normal">{filteredAssigned.length} item</span>
                <span className="font-normal">Assigned Departments</span>
              </div>
              <div className="space-y-3 p-3">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <Input
                    value={rightSearch}
                    onChange={(event) => setRightSearch(event.target.value)}
                    placeholder="Search here"
                    className="h-[44px] rounded-[8px] border-[#D9D9D9] pl-9"
                  />
                </div>
                <div className="min-h-[165px] space-y-2">
                  {filteredAssigned.length === 0 ? (
                    <p className="pt-8 text-center text-[14px] text-[#9CA3AF]">No data</p>
                  ) : (
                    filteredAssigned.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-2 text-[14px] font-normal text-[#1F2937]"
                      >
                        <Checkbox
                          checked={selectedRight.includes(item)}
                          onCheckedChange={(checked) =>
                            setSelectedRight((prev) =>
                              checked === true
                                ? [...prev, item]
                                : prev.filter((entry) => entry !== item)
                            )
                          }
                        />
                        <span className="font-normal">{item}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "primary" && form.formState.errors.department && (
          <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>
        )}

        <div className="mt-[70px] flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-[14px] text-[#1F2937]">
              <Checkbox
                checked={form.watch("leaveCode")}
                onCheckedChange={(checked) => form.setValue("leaveCode", checked === true)}
              />
              <span>Leave Code?</span>
            </label>
            <label className="flex items-center gap-2 text-[14px] text-[#1F2937]">
              <Checkbox />
              <span>Documents Required?</span>
            </label>
            <label className="flex items-center gap-2 text-[14px] text-[#A1A1AA]">
              <Checkbox
                checked={form.watch("multipleJobPools")}
                onCheckedChange={(checked) =>
                  form.setValue("multipleJobPools", checked === true)
                }
              />
              <span>Assign Multiple Job Pools?</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              className="h-[45px] rounded-[14px] bg-[#6C5DD3] px-[25px] text-[16px] font-normal text-white hover:bg-[#5B4DC5]"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="h-[45px] rounded-[14px] bg-[#E5E7EB] px-[25px] text-[16px] font-normal text-[#111827] hover:bg-[#D1D5DB]"
            >
              Exit
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
