import { Link, Outlet, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Users,
  FileText,
  DollarSign,
  Building2,
  FolderKanban,
  Hash,
  Code,
  UserCog,
  Briefcase,
  Users2,
  FileCheck,
  PieChart,
  Coins,
  CalendarClock,
  Bell,
  ChevronDown,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/personal-time-study", label: "Personal Time Study", icon: ClipboardList },
  { path: "/to-do", label: "To Do", icon: CheckSquare },
  { path: "/users", label: "User", icon: Users },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/payroll", label: "Payroll", icon: DollarSign },
  { path: "/department", label: "Department", icon: Building2 },
  { path: "/program", label: "Program", icon: FolderKanban },
  { path: "/county-activity-code", label: "County Activity Code", icon: Hash },
  { path: "/master-code", label: "Master Code", icon: Code },
  { path: "/department-role", label: "Department Role", icon: UserCog },
  { path: "/job-classification", label: "Job Classification", icon: Briefcase },
  { path: "/job-pool", label: "Job Pool", icon: Users2 },
  { path: "/leave-approval", label: "Leave Approval", icon: FileCheck },
  { path: "/fte-allocation", label: "FTE Allocation", icon: PieChart },
  { path: "/cost-pool", label: "Cost Pool", icon: Coins },
  { path: "/schedule-time-study", label: "Schedule Time Study", icon: CalendarClock },
]

export function AppLayout() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar"
      >
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                IEBA
              </div>
              <span className="font-semibold text-primary">IEBA</span>
            </div>
            {/* <p className="text-xs text-muted-foreground">
              Bits of Time Welcome to Tuolumne County
            </p> */}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.path}
                    >
                      <Link to={item.path} className="flex items-center gap-2">
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-primary/20 bg-zinc-900 px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button size="default" className="rounded-full bg-primary hover:bg-primary/90">
              + Add My Time
            </Button>
            <Button variant="ghost" size="icon" className="text-primary/90 hover:text-primary hover:bg-primary/10">
              <Bell className="size-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 text-zinc-200 hover:bg-primary/10 hover:text-primary">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      IA
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left text-sm">
                    <span className="font-medium">ieba admin</span>
                    <span className="text-xs text-primary/80">Super Admin</span>
                  </div>
                  <ChevronDown className="size-4 text-primary/80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
