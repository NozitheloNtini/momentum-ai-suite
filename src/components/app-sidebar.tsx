import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  MessageSquare,
  Settings,
  Sparkles,
  LogOut,
  LogIn,
  BookMarked,
  UserPlus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const baseItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Meeting Notes", url: "/meeting-notes", icon: FileText },
  { title: "AI Task Planner", url: "/task-planner", icon: ListChecks },
  { title: "AI Assistant", url: "/chat", icon: MessageSquare },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { displayName, isGuest, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const items = [
    ...baseItems,
    ...(isAuthenticated
      ? ([{ title: "My Library", url: "/library", icon: BookMarked }] as const)
      : []),
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold">Momentum AI</div>
            <div className="truncate text-xs text-muted-foreground">Workplace assistant</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {isGuest ? "G" : initials || "U"}
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <div className="truncate font-medium">{displayName}</div>
            <div className="truncate text-muted-foreground">
              {isAuthenticated ? user?.email : "Guest session"}
            </div>
          </div>
        </div>
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={async () => {
                await signOut();
                navigate({ to: "/landing" });
              }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Button size="sm" asChild className="w-full justify-start gap-2">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <UserPlus className="h-3.5 w-3.5" /> Create account
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild className="w-full justify-start gap-2">
                <Link to="/auth">
                  <LogIn className="h-3.5 w-3.5" /> Sign in
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
