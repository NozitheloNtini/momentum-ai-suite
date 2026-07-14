import type React from "react";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TopBar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="hidden md:flex items-center gap-2">{right}</div> : null}
      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search…"
          className="h-9 w-64 pl-8 bg-secondary/60 border-transparent focus-visible:bg-background"
        />
      </div>
      <Button variant="ghost" size="icon" className="shrink-0">
        <Bell className="h-4 w-4" />
      </Button>
    </header>
  );
}
