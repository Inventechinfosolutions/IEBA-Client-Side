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
      className="grid overflow-hidden rounded-[8px] border border-[#e8e9ef] bg-white"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "h-11 cursor-pointer border-r border-[#ececf1] text-[14px] font-medium tracking-wide text-[var(--primary)] transition-colors last:border-r-0",
            activeTab === tab
              ? "m-1 rounded-md bg-[var(--primary)] text-white"
              : "bg-white hover:bg-[color-mix(in_oklab,var(--primary)_8%,white)]"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
