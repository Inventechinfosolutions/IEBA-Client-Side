import { cn } from "@/lib/utils"
import type { ProgramTabsProps } from "../types"

export function ProgramTabs({ tabs, activeTab, onChange }: ProgramTabsProps) {
  return (
    <div className="border-b border-[#eef0f5]">
      <div className="grid grid-cols-1 sm:grid-cols-3 select-none gap-1 sm:gap-0 bg-white p-1 sm:p-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={cn(
              "flex h-[44px] sm:h-[53px] cursor-pointer items-center justify-center rounded-[8px] border px-3 text-[12px] sm:text-[12.6px] leading-tight font-medium tracking-wide transition-colors",
              activeTab === tab
                ? "border-[var(--primary)] bg-[var(--primary)] text-white font-semibold"
                : "border-[#e8e9ef] bg-white text-[var(--primary)] hover:bg-[#f9fafb]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  )
}
