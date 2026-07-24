import { useState, Suspense } from "react"
import { Outlet, Link } from "react-router-dom"

import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  LogOut,
  LockKeyhole,
  IdCard,
  Settings,
  MapPin,
  User as UserIcon,
  Bell,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { AppLogout } from "@/features/settings/components/General/AppLogout"
import { usePermissions } from "@/hooks/usePermissions"
import { Spinner } from "@/components/ui/spinner"
import { ChangePasswordFormModal } from "@/features/change-password"
import { ChangeCountyDialog } from "@/features/auth/components/ChangeCountyDialog"
import { MimicBanner, useMimicSession } from "@/features/user/user-mimic"
import { markPasswordChangedForUser } from "@/lib/auth-storage"
import { useGetProfileImage } from "@/features/Profile/queries/getProfileImage"
import { useNotifications } from "@/features/notification/queries/useNotifications"
import type { Notification } from "@/features/notification/types"

import { NotificationSheet } from "@/features/notification/components/NotificationSheet"

export function DashboardLayout() {
  const { user, signOut, establishDashboardSession } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const { data: mimic } = useMimicSession()
  const profileImageQuery = useGetProfileImage(user?.id)
  const countyName = user?.countyName?.trim() || ""
  const isIebaCounty = countyName.toLowerCase() === "ieba"
  const welcomeSubLabel = isIebaCounty
    ? "Welcome To Testing county"
    : countyName
      ? `Welcome To ${countyName}`
      : ""
  const welcomeLabel = welcomeSubLabel ? `Bits of Time ${welcomeSubLabel}` : "Bits of Time"
  const textColorClass = isIebaCounty ? "text-green-600" : "text-[#6C5DD3]"
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changeCountyOpen, setChangeCountyOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { data: notificationsData } = useNotifications("unread")
  const forcePasswordChange = !!user?.isPasswordChangeRequired && !isSuperAdmin
  const isChangePasswordModalOpen = forcePasswordChange || changePasswordOpen

  const unreadCountFromMeta = notificationsData?.data?.meta?.unreadCount
  const notifications = Array.isArray(notificationsData?.data?.items)
    ? notificationsData.data.items
    : Array.isArray(notificationsData?.data)
      ? notificationsData.data
      : Array.isArray(notificationsData)
        ? notificationsData
        : []
  const unreadCount =
    typeof unreadCountFromMeta === "number"
      ? unreadCountFromMeta
      : notifications.reduce(
          (count: number, notification: Notification) =>
            notification.read ? count : count + 1,
          0,
        )

  return (
    <SidebarProvider>
      <AppLogout />
      {mimic && (
        <div className="pointer-events-none fixed inset-0 z-[100] border-4 border-[#fc1b1b]" />
      )}
      <AppSidebar />
      <SidebarInset className="bg-[#F4F5FB] h-svh overflow-hidden">
        <header className="sticky top-0 z-50 flex h-[60px] sm:h-[72px] shrink-0 items-center justify-between gap-2 sm:gap-4 bg-white px-3 sm:px-6 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <SidebarTrigger className="-ml-1 sm:-ml-2 shrink-0 rounded-full border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6]" />
            <div
              className={`flex flex-col leading-tight sm:flex-row sm:items-center sm:gap-1.5 min-w-0 ${textColorClass}`}
              title={welcomeLabel}
            >
              <span className="text-[13px] sm:text-[15px] md:text-[17px] font-semibold sm:font-medium whitespace-nowrap">
                Bits of Time
              </span>
              {welcomeSubLabel && (
                <span className="text-[11px] sm:text-[15px] md:text-[17px] font-normal sm:font-medium truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                  {welcomeSubLabel}
                </span>
              )}
            </div>
          </div>
          {mimic && (
            <div className="hidden lg:flex flex-1 justify-center -translate-x-12">
              <MimicBanner inline />
            </div>
          )}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
            {!isSuperAdmin && <div className="flex items-center gap-4" />}
            {user && (
              <>
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  className="relative flex items-center justify-center p-1.5 sm:p-2 text-[#6B7280] transition-colors hover:text-[#111827]"
                >
                  <Bell className="size-[20px] sm:size-[22px]" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 sm:-right-1 sm:-top-1 inline-flex min-h-4 min-w-4 sm:min-h-5 sm:min-w-5 items-center justify-center rounded-full bg-[#FF4D4F] px-1 text-[10px] sm:text-[12px] font-semibold leading-none text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 sm:gap-2 bg-transparent px-0 py-0 border-0 outline-none hover:bg-transparent cursor-pointer"
                    >
                      <Avatar className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 border border-black shrink-0">
                        <AvatarImage src={profileImageQuery.data ?? user.avatar} alt={user.name} />
                        <AvatarFallback>
                          <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start leading-tight">
                        <span className="text-[13px] sm:text-[14px] font-medium text-[#111827] line-clamp-1 max-w-[120px] md:max-w-none">
                          {user.name}
                        </span>
                        <span className="text-[11px] sm:text-[12px] font-normal text-[#6B7280] line-clamp-1 max-w-[120px] md:max-w-none">
                          {isSuperAdmin
                            ? "Super Admin"
                            : user.roles && user.roles.length > 0
                              ? user.roles[0]
                              : "User"}
                        </span>
                      </div>
                      <ChevronDown className="ml-0.5 sm:ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#9CA3AF] shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="min-w-[190px] rounded-lg shadow-lg"
                    side="bottom"
                    align="end"
                    sideOffset={8}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link to="/profile">
                          <IdCard className="mr-2 size-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setChangePasswordOpen(true)
                        }}
                      >
                        <LockKeyhole className="mr-2 size-4" />
                        Change Password
                      </DropdownMenuItem>
                      {isSuperAdmin && (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setChangeCountyOpen(true)
                          }}
                        >
                            <MapPin className="mr-2 size-4" />
                            Change County
                        </DropdownMenuItem>
                      )}
                      {isSuperAdmin && (
                        <DropdownMenuItem asChild>
                          <Link to="/settings">
                            <Settings className="mr-2 size-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => {
                        signOut()
                      }}
                    >
                      <LogOut className="mr-2 size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChangePasswordFormModal
                  open={isChangePasswordModalOpen}
                  onOpenChange={(nextOpen) => {
                    if (forcePasswordChange && !nextOpen) return
                    setChangePasswordOpen(nextOpen)
                  }}
                  required={forcePasswordChange}
                  onSuccess={() => {
                    if (!user) return
                    markPasswordChangedForUser(user.id)
                    establishDashboardSession({ ...user, isPasswordChangeRequired: false })
                  }}
                  onDismiss={() => {
                    if (!user) return
                    markPasswordChangedForUser(user.id)
                    establishDashboardSession({ ...user, isPasswordChangeRequired: false })
                    setChangePasswordOpen(false)
                  }}
                />
                <NotificationSheet
                  open={notificationsOpen}
                  onOpenChange={setNotificationsOpen}
                />
                {changeCountyOpen && (
                  <ChangeCountyDialog
                    open={changeCountyOpen}
                    onOpenChange={setChangeCountyOpen}
                  />
                )}
              </>
            )}
          </div>
        </header>
        {mimic && (
          <div className="flex lg:hidden w-full items-center justify-center bg-white dark:bg-[#09090b] py-2 px-3 border-b border-[#fc1b1b]/30 shadow-xs z-40">
            <MimicBanner inline />
          </div>
        )}
        <div className="flex flex-1 min-h-0 flex-col gap-3 sm:gap-4 overflow-auto bg-[#f5f5f5] p-3 sm:p-4 md:gap-6 md:p-6">
          <Suspense
            fallback={
              <div className="flex min-h-[300px] flex-1 items-center justify-center">
                <Spinner className="size-8 text-[#6C5DD3]" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

