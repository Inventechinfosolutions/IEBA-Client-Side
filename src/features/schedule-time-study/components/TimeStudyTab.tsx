import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { TimeStudyTabProps } from "../types"

export function TimeStudyTab({ value, label }: TimeStudyTabProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "relative flex !h-full min-h-0 items-center justify-center whitespace-nowrap rounded-[8px] border-0 px-6 !py-0 text-center text-[15px] leading-[1.35] font-normal text-[#6C5DD3] shadow-none",
        "data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=active]:shadow-none",
        "after:hidden"
      )}
    >
      {label}
    </TabsTrigger>
  )
}
