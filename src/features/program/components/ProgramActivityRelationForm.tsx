import { ChevronDown, ChevronUp } from "lucide-react"
import { useMemo, useRef, useState } from "react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Input } from "@/components/ui/input"
import {
  getMockProgramActivityRelationSortOptions,
  getMockProgramDepartments,
  getMockTimeStudyProgramNamesForDepartment,
} from "../mock"
import type { ProgramActivityRelationFormProps } from "../types"

export function ProgramActivityRelationForm({ form }: ProgramActivityRelationFormProps) {
  const departmentOptions = useMemo(() => {
    return [...getMockProgramDepartments()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )
  }, [])

  const selectedDepartment = form.watch("programActivityRelationDepartment") || ""
  const programOptions = useMemo(
    () => getMockTimeStudyProgramNamesForDepartment(selectedDepartment),
    [selectedDepartment]
  )
  const sortOptions = useMemo(() => getMockProgramActivityRelationSortOptions(), [])

  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false)
  const [isProgramOpen, setIsProgramOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const departmentDropdownRef = useRef<HTMLDivElement | null>(null)
  const programDropdownRef = useRef<HTMLDivElement | null>(null)
  const sortDropdownRef = useRef<HTMLDivElement | null>(null)

  const programDisabled = !selectedDepartment.trim()
  const isProgramEmpty = !programDisabled && programOptions.length === 0

  const departmentInputClass =
    "h-[40px] rounded-[7px] border border-[#c6cedd] bg-white px-3 pr-8 !text-[10px] !font-normal text-[#111827] shadow-none placeholder:!text-[10px] placeholder:text-[#b0b8c8] focus-visible:border-[#1595ff] focus-visible:ring-2 focus-visible:ring-[#1595ff33]"

  const programEnabledClass = departmentInputClass
  const programEmptyClass =
    "h-[40px] rounded-[7px] border border-[var(--primary)] bg-white px-3 pr-8 !text-[10px] !font-normal text-[#111827] shadow-none placeholder:!text-[10px] placeholder:text-[#b0b8c8] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[color:rgba(108,93,211,0.22)]"
  const programDisabledClass =
    "h-[40px] rounded-[7px] border border-[#c6cedd] px-3 pr-8 !text-[10px] !font-normal text-[#111827] shadow-none placeholder:!text-[10px] placeholder:text-[#b0b8c8] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:!border-[0.8px] disabled:!border-[#cfd4dd] disabled:!bg-[#d2d4d9]/20 disabled:!text-black disabled:opacity-100"

  return (
    <div
      className="w-full px-1"
      onMouseDownCapture={(event) => {
        const targetNode = event.target as Node

        if (
          isDepartmentOpen &&
          departmentDropdownRef.current &&
          !departmentDropdownRef.current.contains(targetNode)
        ) {
          setIsDepartmentOpen(false)
        }

        if (
          isProgramOpen &&
          programDropdownRef.current &&
          !programDropdownRef.current.contains(targetNode)
        ) {
          setIsProgramOpen(false)
        }

        if (isSortOpen && sortDropdownRef.current && !sortDropdownRef.current.contains(targetNode)) {
          setIsSortOpen(false)
        }
      }}
    >
      <input type="hidden" {...form.register("programActivityRelationDepartment")} />
      <input type="hidden" {...form.register("programActivityRelationProgram")} />
      <input type="hidden" {...form.register("programActivityRelationSort")} />

      <div className="flex w-full items-end justify-between gap-3 py-0.5">
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <div className="w-[180px] space-y-1">
            <label className="block text-[10px] text-[#111827]" htmlFor="par-department-trigger">
              Department
            </label>
            <div className="relative" ref={departmentDropdownRef}>
              <Input
                id="par-department-trigger"
                value={form.watch("programActivityRelationDepartment") || ""}
                readOnly
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsDepartmentOpen((prev) => !prev)}
                onBlur={() => window.setTimeout(() => setIsDepartmentOpen(false), 120)}
                onFocus={() => setIsDepartmentOpen(true)}
                placeholder="Select Department"
                className={departmentInputClass}
              />
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsDepartmentOpen((prev) => !prev)}
                className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
                aria-label="Toggle department options"
              >
                {isDepartmentOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              {isDepartmentOpen ? (
                <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                  {departmentOptions.map((department) => (
                    <button
                      key={department}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        form.setValue("programActivityRelationDepartment", department, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                        form.setValue("programActivityRelationProgram", "", {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                        setIsDepartmentOpen(false)
                      }}
                      className={`block w-full cursor-pointer rounded-[6px] border border-transparent px-3 py-2 text-left !text-[10px] !font-normal text-[#111827] hover:bg-[#f3f4f6] ${
                        form.watch("programActivityRelationDepartment") === department
                          ? "border-[#d8ecff] bg-[#eef8ff]"
                          : ""
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="w-[318px] space-y-1">
            <label className="block text-[10px] text-[#111827]" htmlFor="par-program-trigger">
              Program
            </label>
            {programDisabled ? (
              <Input
                id="par-program-trigger"
                value={form.watch("programActivityRelationProgram") || ""}
                disabled
                readOnly
                tabIndex={-1}
                placeholder="Select Program"
                className={programDisabledClass}
              />
            ) : (
              <div className="relative" ref={programDropdownRef}>
                <Input
                  id="par-program-trigger"
                  value={form.watch("programActivityRelationProgram") || ""}
                  readOnly
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsProgramOpen((prev) => !prev)}
                  onBlur={() => window.setTimeout(() => setIsProgramOpen(false), 120)}
                  onFocus={() => setIsProgramOpen(true)}
                  placeholder="Select Program"
                  className={isProgramEmpty ? programEmptyClass : programEnabledClass}
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setIsProgramOpen((prev) => !prev)}
                  className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
                  aria-label="Toggle program options"
                >
                  {isProgramOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
                {isProgramOpen ? (
                  <div className="absolute z-10 mt-1 max-h-[180px] w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                    {programOptions.length > 0 ? (
                      programOptions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            form.setValue("programActivityRelationProgram", name, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                            setIsProgramOpen(false)
                          }}
                          className={`block w-full cursor-pointer rounded-[6px] border border-transparent px-3 py-2 text-left !text-[10px] !font-normal text-[#111827] hover:bg-[#f3f4f6] ${
                            form.watch("programActivityRelationProgram") === name
                              ? "border-[#d8ecff] bg-[#eef8ff]"
                              : ""
                          }`}
                        >
                          {name}
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-[6px] border border-[#eceff5] bg-white px-3 py-4">
                        <img
                          src={tableEmptyIcon}
                          alt=""
                          className="h-[73px] w-[82px] object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="w-[205px] shrink-0 space-y-1">
          <label
            className="block h-[10px] text-[10px] leading-[10px] text-transparent select-none"
            htmlFor="par-sort-trigger"
          >
            .
          </label>
          <div className="relative" ref={sortDropdownRef}>
            <Input
              id="par-sort-trigger"
              value={form.watch("programActivityRelationSort") || ""}
              readOnly
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsSortOpen((prev) => !prev)}
              onBlur={() => window.setTimeout(() => setIsSortOpen(false), 120)}
              onFocus={() => setIsSortOpen(true)}
              placeholder="Sorted dropdown sample"
              aria-label="Sorted dropdown"
              className={departmentInputClass}
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="absolute right-0 top-0 inline-flex h-full w-[24px] cursor-pointer items-center justify-center text-[#6b7280]"
              aria-label="Toggle sort options"
            >
              {isSortOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {isSortOpen ? (
              <div className="absolute right-0 z-10 mt-1 max-h-[180px] w-full min-w-full overflow-auto rounded-[7px] border border-[#d9deea] bg-white p-1.5 shadow-[0_8px_18px_rgba(17,24,39,0.12)]">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      form.setValue("programActivityRelationSort", option, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                      setIsSortOpen(false)
                    }}
                    className={`block w-full cursor-pointer rounded-[6px] border border-transparent px-3 py-2 text-left !text-[10px] !font-normal text-[#111827] hover:bg-[#f3f4f6] ${
                      form.watch("programActivityRelationSort") === option
                        ? "border-[#d8ecff] bg-[#eef8ff]"
                        : ""
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
