import { cn } from "@/lib/utils"
import type { ProgramTabsProps } from "../types"

export function ProgramTabs({ tabs, activeTab, onChange }: ProgramTabsProps) {
  return (
    <div className="border-b border-[#eef0f5]">
      <div
        className="grid select-none gap-0 bg-white"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex h-[53px] cursor-pointer items-center justify-center rounded-[8px] border px-3 text-[12.6px] leading-none font-medium tracking-wide text-[var(--primary)]",
            activeTab === tab
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[#e8e9ef] bg-white text-[var(--primary)]"
          )}
        >
          {tab}
        </button>
      ))}
      </div>
    </div>
  )
}
