import { EmployeePanel } from "@/features/user/components/EmployeePanel"
import { type UserFormPanelProps } from "@/features/user/types"

type UserFormPageProps = UserFormPanelProps

export function UserFormPage({ mode, initialValues, onCancel, onSave }: UserFormPageProps) {
  return (
    <div className="rounded-[10px] border border-[#e6e7ef] bg-gray-100 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:p-5">
      <EmployeePanel
        mode={mode}
        initialValues={initialValues}
        onCancel={onCancel}
        onSave={onSave}
      />
    </div>
  )
}
