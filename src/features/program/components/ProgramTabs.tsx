import { cn } from "@/lib/utils"
import type { ProgramTabsProps } from "../types"

export function ProgramTabs({ tabs, activeTab, onChange }: ProgramTabsProps) {
  return (
    <div className="border-b border-[#eef0f5] p-2 bg-[#f8fafc]">
      <div
        className="flex flex-wrap md:grid select-none gap-2 md:gap-0 bg-transparent min-w-0"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 min-w-[120px] md:min-w-0 flex h-auto min-h-[42px] md:h-[53px] cursor-pointer items-center justify-center rounded-[8px] border px-3 py-2 text-[11.5px] md:text-[12.6px] font-semibold transition-colors text-center",
            activeTab === tab
              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
              : "border-[#e8e9ef] bg-white text-[var(--primary)] hover:bg-[#F3F0FF]"
          )}
        >
          {tab}
        </button>
      ))}
      </div>
    </div>
  )
}
