import { addEmployeeTabs } from "../constants/user-form-tabs"
import type { AddEmployeeFormTabsProps } from "../types"

export function UserFormTabs({ activeTab, onTabChange, disabledTabs = [] }: AddEmployeeFormTabsProps) {
  return (
    <div className="grid select-none grid-cols-2 gap-1 rounded-[8px] border border-[#e8ebf2] bg-white p-1 text-[12px] text-[#596077] sm:grid-cols-4 sm:gap-px sm:p-px">
      {addEmployeeTabs.map((tab) => {
        const isDisabled = disabledTabs.includes(tab.id)
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            disabled={isDisabled}
            className={`h-11 rounded-[8px] bg-[#fafbfe] px-2 sm:px-4 text-[11px] sm:text-[12px] font-medium transition-colors ${
              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
            } ${
              activeTab === tab.id
                ? "bg-[var(--primary)] text-white shadow-[0_2px_6px_rgba(108,93,211,0.3)]"
                : "text-[var(--primary)]"
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
