import { useState } from "react"
import { Outlet, Link } from "react-router-dom"

import { AppSidebar } from "@/components/dashboard/AppSidebar"
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
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { ChangePasswordFormModal } from "@/features/change-password"
import { ChangeCountyDialog } from "@/features/auth/components/ChangeCountyDialog"

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const countyName = user?.countyName?.trim() || ""
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changeCountyOpen, setChangeCountyOpen] = useState(false)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F4F5FB]">
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 bg-white px-6 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-2 rounded-full border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6]" />
            <span className="text-[17px] text-[#6C5DD3]">
              {countyName
                ? `Bits of Time Welcome To ${countyName}`
                : "Bits of Time"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 bg-transparent px-0 py-0 border-0 outline-none hover:bg-transparent"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[14px] font-medium text-[#111827]">
                          {user.name}
                        </span>
                        <span className="text-[12px] font-normal text-[#6B7280]">
                          Super Admin
                        </span>
                      </div>
                      <ChevronDown className="ml-1 h-4 w-4 text-[#9CA3AF]" />
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
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setChangeCountyOpen(true)
                        }}
                      >
                          <MapPin className="mr-2 size-4" />
                          Change County
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings">
                          <Settings className="mr-2 size-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
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
                  open={changePasswordOpen}
                  onOpenChange={setChangePasswordOpen}
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
