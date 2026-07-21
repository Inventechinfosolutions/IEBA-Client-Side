import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
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
import { useMarkNotificationAsRead } from "../mutations/useMarkNotificationAsRead"
import { useDeleteNotification } from "../mutations/useDeleteNotification"
import { Play, Inbox, Megaphone, Trash2 } from "lucide-react"
import type { Notification, NotificationFilter, NotificationSheetProps } from "../types"
import { formatTimestamp, getNotificationItems } from "../types"
import { NotificationStatus } from "../enums/notification.enum"
import { filterOptions } from "../key"


export function NotificationSheet({ open, onOpenChange }: NotificationSheetProps) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<NotificationFilter>(NotificationStatus.UNREAD)
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null)
  const [locallyReadIds, setLocallyReadIds] = useState<Record<string, true>>({})
  const { data, isLoading, refetch } = useNotifications(filter)
  const markAllAsRead = useMarkAllAsRead()
  const markNotificationAsRead = useMarkNotificationAsRead()
  const deleteNotification = useDeleteNotification()

  const notifications = getNotificationItems(data)

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id)
      toast.success("Notification deleted successfully")
    } catch (error: any) {
      const msg = error?.message || "Failed to delete notification"
      toast.error(msg)
      console.error("Failed to delete notification:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const nextReadIds: Record<string, true> = {}
      for (const notification of notifications) nextReadIds[notification.id] = true
      setLocallyReadIds((prev) => ({ ...prev, ...nextReadIds }))
      await markAllAsRead.mutateAsync()
      toast.success("All notifications marked as read")
    } catch (error: any) {
      toast.error("Failed to mark all notifications as read")
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleFilterChange = (nextFilter: string) => {
    const normalizedFilter = nextFilter as NotificationFilter
    setFilter((currentFilter) => {
      if (currentFilter === normalizedFilter) {
        void refetch()
      }
      return normalizedFilter
    })
  }

  const markNotificationReadIfNeeded = async (notification: Notification) => {
    if (notification.read || locallyReadIds[notification.id]) return
    setLocallyReadIds((prev) => ({ ...prev, [notification.id]: true }))
    try {
      await markNotificationAsRead.mutateAsync(notification.id)
      toast.success("Notification marked as read")
    } catch (error: any) {
      setLocallyReadIds((prev) => {
        const next = { ...prev }
        delete next[notification.id]
        return next
      })
      toast.error("Failed to mark notification as read")
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleToggleExpand = async (notification: Notification) => {
    setExpandedNotificationId((currentId) => (currentId === notification.id ? null : notification.id))
    await markNotificationReadIfNeeded(notification)
  }

  const handleView = async (notification: Notification) => {
    await markNotificationReadIfNeeded(notification)
    onOpenChange(false)
    navigate("/personal-time-study")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] p-0 sm:max-w-[450px] bg-white border-l border-[#E5E7EB] dark:bg-[#18181b] dark:border-[#27272a]">
        <SheetHeader className="p-8 pb-4">
          <SheetTitle className="text-[28px] font-bold text-[#6C5DD3]">
            Notifications
          </SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-between px-8 py-2 mb-4">
          <div className="w-[200px]">
            <SingleSelectDropdown
              value={filter}
              onChange={handleFilterChange}
              onBlur={() => { }}
              options={filterOptions}
              placeholder="Filter notifications"
              className="h-10 text-[14px] border-gray-200"
            />
          </div>

          <Button
            variant="ghost"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending || notifications.every((n: Notification) => n.read)}
            className="h-auto p-0 text-[14px] font-medium text-[#6C5DD3] hover:bg-transparent hover:underline disabled:opacity-50"
          >
            Mark all as read
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          {notifications.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center px-8">
              <div className="flex flex-col items-center justify-center opacity-60">
                <Inbox className="size-20 text-[#9CA3AF] stroke-[1px]" />
              </div>
              <p className="text-[16px] text-[#9CA3AF]">
                {isLoading ? "Loading notifications..." : `There are no ${filter === "all" ? "" : filter} notifications.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB] border-t border-[#E5E7EB] dark:divide-[#27272a] dark:border-[#27272a]">
              {notifications.map((notification: Notification) => {
                const isExpanded = expandedNotificationId === notification.id
                const isRead = notification.read || Boolean(locallyReadIds[notification.id])

                return (
                  <div key={notification.id} className={cn("relative bg-white border-b border-[#E5E7EB] transition-colors dark:bg-[#18181b] dark:border-[#27272a]", isExpanded && "dark:bg-[#6c5dd3]/25")}>
                    <div
                      onClick={() => void handleToggleExpand(notification)}
                      className={cn("flex w-full items-start gap-4 px-8 py-5 text-left transition-colors cursor-pointer hover:bg-gray-50/50 dark:hover:bg-[#6c5dd3]/15", isExpanded && "dark:hover:bg-[#6c5dd3]/25")}
                    >
                      <div className="flex items-start gap-3 shrink-0">
                        <div className="mt-1.5">
                          {isExpanded ? (
                            <Play className="size-3 rotate-90 fill-current text-black dark:text-white" />
                          ) : (
                            <Play className="size-3 fill-current text-black dark:text-white" />
                          )}
                        </div>
                        {!isRead && (
                          <div className="relative">
                            <Megaphone className="size-5 text-gray-600 dark:text-zinc-300" />
                            <div className="absolute -top-0.5 -right-0.5 size-2 bg-[#FF4D4F] rounded-full border-2 border-white dark:border-[#18181b]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex flex-col gap-1">
                          <h4 className={cn("text-[15px]", isRead ? "font-normal text-gray-500 dark:text-zinc-400" : "font-bold text-black dark:text-white", isExpanded && "dark:text-white")}>
                            {notification.title}
                          </h4>
                          <div className={cn("flex items-center justify-between text-[13px] text-gray-500 dark:text-zinc-400", isExpanded && "dark:text-zinc-300")}>
                            <span>Sent By: {notification.senderName || "admin ieba"}</span>
                            <span>{formatTimestamp(notification.createdAt)}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-6 flex items-start justify-between gap-6 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-[15px] text-gray-900 leading-relaxed flex-1 dark:text-zinc-200">
                              {notification.message}
                            </p>
                            <Button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation()
                                  void handleView(notification)
                              }}
                              className="shrink-0 bg-[#6C5DD3] hover:bg-[#5A4BC2] text-white px-6 h-9 rounded-md text-[13px] font-medium"
                            >
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDelete(notification.id)
                      }}
                      className="absolute top-5 right-8 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
