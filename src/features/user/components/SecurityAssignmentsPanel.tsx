import { useFormContext } from "react-hook-form"

import { type UserModuleFormValues } from "@/features/user/types"

export function SecurityAssignmentsPanel() {
  const { watch } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()

  return (
    <div className="pt-1">
      <p className="select-none text-[12px] font-semibold uppercase text-[#111827]">{employeeName}</p>
    </div>
  )
}
