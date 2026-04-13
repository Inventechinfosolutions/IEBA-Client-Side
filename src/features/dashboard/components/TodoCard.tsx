import { Link } from "react-router-dom"
import { ListTodo, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import type { TodoItem } from "../types"

interface Props {
  items: TodoItem[]
  isLoading?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-[#3DBE8A]",
  done: "text-[#3DBE8A]",
  pending: "text-[#F5A623]",
  open: "text-[#F5A623]",
  default: "text-[#9CA3AF]",
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status?.toLowerCase()] ?? STATUS_COLORS.default
}

export function TodoCard({ items, isLoading }: Props) {
  return (
    <div className="flex h-full flex-col rounded-[10px] border border-[#E8EAF6] bg-white shadow-[0_0_20px_0_#0000001a]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-[#6C5DD3]" />
          <span className="text-[15px] font-semibold text-[#1a1a2e]">To Do</span>
        </div>
        <Link
          to="/to-do"
          className="flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
        >
          More <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6] px-1">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="h-4 w-1 rounded bg-[#6C5DD3]/30" />
              <div className="h-4 flex-1 rounded bg-[#e5e7eb]" />
              <div className="h-4 w-16 rounded bg-[#e5e7eb]" />
            </div>
          ))}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-[#9CA3AF] text-sm">
            <ListTodo className="h-8 w-8 mb-2 opacity-40" />
            No tasks yet
          </div>
        )}

        {!isLoading &&
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAFA]">
              <div className="h-full w-[3px] rounded-full bg-[#6C5DD3]/50 self-stretch min-h-[20px]" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[#1a1a2e]" title={item.description}>
                  {item.title}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.day}</p>
              </div>
              {item.status?.toLowerCase() === "completed" || item.status?.toLowerCase() === "done" ? (
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 ${getStatusColor(item.status)}`}
                />
              ) : (
                <Clock
                  className={`h-4 w-4 shrink-0 ${getStatusColor(item.status)}`}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
