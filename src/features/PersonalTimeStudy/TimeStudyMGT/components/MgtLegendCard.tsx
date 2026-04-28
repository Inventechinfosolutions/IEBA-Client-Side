import { Check, X, Unlock, Bell } from "lucide-react"

// Legend items matching the screenshot exactly
const LEGEND_ITEMS = [
  { label: "Approved Time Entry", color: "#6B7280", icon: "1" },
  { label: "Less Hours",          color: "#F97316", icon: "1" },
  { label: "More Hours",          color: "#EF4444", icon: "1" },
  { label: "Equal Hours",         color: "#22C55E", icon: "1" },
  { label: "Submitted",           color: "#3B82F6", icon: "1" },
] as const

const ACTION_ITEMS = [
  {
    label: "Approve",
    textColor: "text-gray-700",
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] shrink-0">
        <Check className="size-2.5 text-white" aria-hidden />
      </span>
    ),
  },
  {
    label: "Reject",
    textColor: "text-gray-700",
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] shrink-0">
        <X className="size-2.5 text-white" aria-hidden />
      </span>
    ),
  },
  {
    label: "Unlock",
    textColor: "text-gray-700",
    icon: (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-white shrink-0">
        <Unlock className="size-4 text-gray-500" aria-hidden />
      </span>
    ),
  },
  {
    label: "Notify",
    textColor: "text-gray-700",
    icon: (
      <span className="relative inline-flex size-5 items-center justify-center shrink-0">
        <Bell className="size-4" style={{ fill: "#6c5dd3", stroke: "#6c5dd3" }} aria-hidden />
      </span>
    ),
  },
] as const

export function MgtLegendCard() {
  return (
    <div className="rounded-[6px] bg-white p-6 shadow-[0_4px_16px_rgba(16,24,40,0.12)]">
      <div className="flex flex-col gap-3">
        {/* Status dot items */}
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: item.color }}
            >
              {item.icon}
            </span>
            <span className="text-[14px]" style={{ color: item.color }}>{item.label}</span>
          </div>
        ))}

        {/* Action items */}
        {ACTION_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.icon}
            <span className={`text-[14px] ${item.textColor}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
