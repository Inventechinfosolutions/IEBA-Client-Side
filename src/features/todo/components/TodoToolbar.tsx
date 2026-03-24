import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TodoToolbarProps } from "../types"

export function TodoToolbar({ onAddTodo }: TodoToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-end">
      <Button
        type="button"
        onClick={onAddTodo}
        className="h-9 cursor-pointer rounded-[8px] bg-[#6b5bd6] px-4 text-[12px] font-medium text-white hover:bg-[#6b5bd6]"
      >
        <Plus className="mr-1 size-3.5" />
        Add To Do
      </Button>
    </div>
  )
}
