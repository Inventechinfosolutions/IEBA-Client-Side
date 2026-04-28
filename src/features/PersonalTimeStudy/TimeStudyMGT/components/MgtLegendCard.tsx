// Legend items matching the screenshot exactly
const LEGEND_ITEMS = [
  { label: "Approved Time Entry", color: "#6B7280", icon: "1",  textColor: "text-gray-600"  },
  { label: "Less Hours",          color: "#F97316", icon: "1",  textColor: "text-orange-500" },
  { label: "More Hours",          color: "#EF4444", icon: "1",  textColor: "text-red-500"   },
  { label: "Equal Hours",         color: "#22C55E", icon: "1",  textColor: "text-green-500" },
  { label: "Submitted",           color: "#3B82F6", icon: "1",  textColor: "text-blue-500"  },
] as const

const ACTION_ITEMS = [
  {
    label: "Approve",
    textColor: "text-gray-700",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-green-500 bg-white text-green-500 text-[10px] font-bold">
        ✓
      </span>
    ),
  },
  {
    label: "Reject",
    textColor: "text-gray-700",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-500 bg-white text-red-500 text-[10px] font-bold">
        ✕
      </span>
    ),
  },
  {
    label: "Unlock",
    textColor: "text-gray-700",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center text-gray-500 text-sm">🔒</span>
    ),
  },
  {
    label: "Notify",
    textColor: "text-gray-700",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center text-[#6B4EFF] text-sm">🔔</span>
    ),
  },
] as const

export function MgtLegendCard() {
  return (
    <div className="rounded-[8px] bg-white p-4 shadow-[0_4px_16px_rgba(16,24,40,0.12)]">
      <div className="flex flex-col gap-2.5">
        {/* Status dot items */}
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: item.color }}
            >
              {item.icon}
            </span>
            <span className={`text-xs font-medium ${item.textColor}`}>{item.label}</span>
          </div>
        ))}

        {/* Divider */}
        <div className="my-1 h-px bg-gray-100" />

        {/* Action items */}
        {ACTION_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.icon}
            <span className={`text-xs ${item.textColor}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
