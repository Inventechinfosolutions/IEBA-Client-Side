import { Link } from "react-router-dom"
import { ListTodo, ChevronRight, Check } from "lucide-react"
import type { TodoCardProps } from "../types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const STATUS_COLORS: Record<string, string> = {
  completed: "text-[#3DBE8A]", // Green
  done: "text-[#3DBE8A]",
  inprogress: "text-[#F5A623]", // Orange
  new: "text-[#2563EB]", // Blue
  default: "text-[#9CA3AF]",
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status?.toLowerCase()] ?? STATUS_COLORS.default
}

const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  day: "2-digit",
  month: "long",
})

function formatTodoDate(item: import("../types").TodoItem) {
  if (item.day) return item.day
  if (item.createdAt) {
    const parsed = Date.parse(item.createdAt)
    if (!Number.isNaN(parsed)) {
      return formatter.format(parsed)
    }
  }
  return ""
}

export function TodoCard({ items = [], isLoading }: TodoCardProps) {
  return (
    <TooltipProvider>
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
        <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-[rgba(108,93,211,0.4)] pr-5">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
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
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link 
                    to="/to-do"
                    className="relative flex items-center px-4 py-3 hover:bg-[#FAFAFA] cursor-pointer"
                  >
                    <div className="flex items-center flex-1 min-w-0 pr-4">
                      <span className="text-[#9CA3AF]  text-xl w-[24px] shrink-0">⋮</span>
                      <span className="text-base  text-[#1a1a2e] whitespace-normal break-all truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 text-sm  text-gray-500">
                      {formatTodoDate(item)}
                    </div>
                    <div className="w-[24px] shrink-0 flex justify-end">
                      <Check className={`h-4 w-4 ${getStatusColor(item.status)}`} />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="max-w-[250px] break-all bg-[#111827] text-white border-0 text-xs p-2">
                  {item.description || "No description"}
                </TooltipContent>
              </Tooltip>
            ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
