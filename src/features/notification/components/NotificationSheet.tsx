import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "../queries/useNotifications"
import { useMarkAllAsRead } from "../mutations/useMarkAllAsRead"
import { Inbox } from "lucide-react"
import type { Notification } from "../types"

interface NotificationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const filterOptions = [
  { value: "all", label: "All Notifications" },
  { value: "unread", label: "Unread Notifications" },
  { value: "read", label: "Read Notifications" },
] as const

export function NotificationSheet({ open, onOpenChange }: NotificationSheetProps) {
  const [filter, setFilter] = useState("all")
  const { data, isLoading } = useNotifications()
  const markAllAsRead = useMarkAllAsRead()

  const notifications = Array.isArray(data?.data?.items)
    ? data.data.items
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : []
  
  const filteredNotifications = notifications.filter((n: Notification) => {
    if (filter === "unread") return !n.isRead
    if (filter === "read") return n.isRead
    return true
  })

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] p-0 sm:max-w-[550px] bg-white border-l border-[#E5E7EB] shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-[22px] font-bold text-[#6C5DD3] tracking-tight">
            Notifications
          </SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-between px-6 py-2">
          <div className="w-[180px]">
            <SingleSelectDropdown
              value={filter}
              onChange={setFilter}
              onBlur={() => {}}
              options={filterOptions}
              placeholder="Filter notifications"
              className="h-10 text-[13px]"
            />
          </div>

          <Button
            variant="ghost"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending || notifications.every((n: Notification) => n.isRead)}
            className="h-auto p-0 text-[12px] font-medium text-[#6C5DD3] hover:bg-transparent hover:underline disabled:opacity-50"
          >
            Mark all as read
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)] px-6">
          {filteredNotifications.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex flex-col items-center justify-center opacity-60">
                <Inbox className="size-20 text-[#9CA3AF] stroke-[1px]" />
              </div>
              <p className="text-[14px] text-[#9CA3AF]">
                {isLoading ? "Loading notifications..." : `There are no ${filter === "all" ? "" : filter} notifications.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
               {filteredNotifications.map((notification: Notification) => (
                 <div key={notification.id} className="p-3 border rounded-lg border-[#F3F4F6]">
                    <h4 className="text-[14px] font-semibold text-[#111827]">{notification.title}</h4>
                    <p className="text-[12px] text-[#6B7280]">{notification.message}</p>
                 </div>
               ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
