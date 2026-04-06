import { EmployeePanel } from "../components/employee-panel"
import type { AddEmployeeFormPageProps } from "../types"

export function AddEmployeeFormPage({
  mode,
  initialValues,
  securityContextUserId,
  onCancel,
  onSave,
}: AddEmployeeFormPageProps) {
  return (
    <div className="rounded-[10px] border border-[#e6e7ef] bg-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:p-5">
      <EmployeePanel
        mode={mode}
        initialValues={initialValues}
        securityContextUserId={securityContextUserId ?? null}
        onCancel={onCancel}
        onSave={onSave}
      />
    </div>
  )
}
