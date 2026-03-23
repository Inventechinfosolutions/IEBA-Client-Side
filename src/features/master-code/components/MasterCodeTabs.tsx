import { cn } from "@/lib/utils"
import { type MasterCodeTab } from "@/features/master-code/types"

type MasterCodeTabsProps = {
  tabs: MasterCodeTab[]
  activeTab: MasterCodeTab
  onChange: (tab: MasterCodeTab) => void
}

export function MasterCodeTabs({
  tabs,
  activeTab,
  onChange,
}: MasterCodeTabsProps) {
  return (
    <div
      className="grid select-none gap-px overflow-hidden rounded-[8px] border border-[#e8e9ef] bg-white p-px"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex h-10 cursor-pointer items-center justify-center rounded-[7px] bg-white px-2 text-[12px] leading-none font-medium tracking-wide text-[var(--primary)] transition-colors",
            activeTab === tab
              ? "bg-[var(--primary)] text-white"
              : "bg-white hover:bg-[color-mix(in_oklab,var(--primary)_8%,white)]"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
