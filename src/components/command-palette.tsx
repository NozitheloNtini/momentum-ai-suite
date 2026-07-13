import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  ListChecks,
  MessageSquare,
  BookMarked,
  Settings,
  Sparkles,
  LogIn,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth-context";
import { listItems, formatRelative, type SavedItem } from "@/lib/persistence";

const PATHS = {
  meeting_note: "/meeting-notes",
  task_plan: "/task-planner",
  chat: "/chat",
} as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedItem[]>([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    listItems()
      .then((r) => setItems(r.slice(0, 8)))
      .catch(() => {});
  }, [open, isAuthenticated]);

  const go = (to: string, search?: Record<string, string>) => {
    setOpen(false);
    navigate({ to, search } as never);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a tool or saved item…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/meeting-notes")}>
            <FileText className="mr-2 h-4 w-4" /> Meeting Notes
          </CommandItem>
          <CommandItem onSelect={() => go("/task-planner")}>
            <ListChecks className="mr-2 h-4 w-4" /> Task Planner
          </CommandItem>
          <CommandItem onSelect={() => go("/chat")}>
            <MessageSquare className="mr-2 h-4 w-4" /> AI Assistant
          </CommandItem>
          {isAuthenticated && (
            <CommandItem onSelect={() => go("/library")}>
              <BookMarked className="mr-2 h-4 w-4" /> My Library
            </CommandItem>
          )}
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/meeting-notes")}>
            <Sparkles className="mr-2 h-4 w-4" /> New meeting summary
          </CommandItem>
          <CommandItem onSelect={() => go("/task-planner")}>
            <Sparkles className="mr-2 h-4 w-4" /> New task plan
          </CommandItem>
          <CommandItem onSelect={() => go("/chat")}>
            <Sparkles className="mr-2 h-4 w-4" /> New assistant chat
          </CommandItem>
          {!isAuthenticated && (
            <CommandItem onSelect={() => go("/auth")}>
              <LogIn className="mr-2 h-4 w-4" /> Sign in / create account
            </CommandItem>
          )}
        </CommandGroup>

        {isAuthenticated && items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent">
              {items.map((it) => (
                <CommandItem
                  key={it.id}
                  value={`${it.title} ${it.kind}`}
                  onSelect={() => go(PATHS[it.kind], { id: it.id })}
                >
                  {it.kind === "meeting_note" && <FileText className="mr-2 h-4 w-4" />}
                  {it.kind === "task_plan" && <ListChecks className="mr-2 h-4 w-4" />}
                  {it.kind === "chat" && <MessageSquare className="mr-2 h-4 w-4" />}
                  <span className="truncate">{it.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatRelative(it.updated_at)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
