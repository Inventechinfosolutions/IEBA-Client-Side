import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onSignOut: () => void
}

export function NavUser({ user, onSignOut }: NavUserProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </SidebarMenuButton>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-1 w-full rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-sidebar-accent"
        >
          Sign out
        </button>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
