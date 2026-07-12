import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookMarked,
  FileText,
  ListChecks,
  MessageSquare,
  Trash2,
  Loader2,
  Search,
  Copy,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import {
  listItems,
  deleteItem,
  renameItem,
  duplicateItem,
  formatDate,
  formatRelative,
  type SavedItem,
  type Kind,
} from "@/lib/persistence";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — Momentum AI" },
      { name: "description", content: "Your saved meeting notes, task plans, and chats." },
    ],
  }),
  component: LibraryPage,
});

const KIND_META = {
  meeting_note: { icon: FileText, label: "Meeting note", path: "/meeting-notes" as const },
  task_plan: { icon: ListChecks, label: "Task plan", path: "/task-planner" as const },
  chat: { icon: MessageSquare, label: "Chat", path: "/chat" as const },
} as const;

function LibraryPage() {
  const { isAuthenticated, mode } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [tab, setTab] = useState<"all" | Kind>("all");
  const [q, setQ] = useState("");
  const [renaming, setRenaming] = useState<SavedItem | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const load = async () => {
    try {
      setItems(await listItems());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    const list = items ?? [];
    const needle = q.trim().toLowerCase();
    return list
      .filter((i) => tab === "all" || i.kind === tab)
      .filter((i) => (needle ? i.title.toLowerCase().includes(needle) : true));
  }, [items, tab, q]);

  const onDelete = async (item: SavedItem) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await deleteItem(item.id);
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const onDuplicate = async (item: SavedItem) => {
    try {
      const copy = await duplicateItem(item.id);
      setItems((prev) => (prev ? [copy, ...prev] : prev));
      toast.success("Duplicated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duplicate failed");
    }
  };

  const submitRename = async () => {
    if (!renaming) return;
    try {
      await renameItem(renaming.id, newTitle);
      setItems((prev) =>
        prev?.map((i) => (i.id === renaming.id ? { ...i, title: newTitle } : i)) ?? prev,
      );
      toast.success("Renamed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setRenaming(null);
    }
  };

  const open = (item: SavedItem) => {
    const path = KIND_META[item.kind].path;
    navigate({ to: path, search: { id: item.id } });
  };

  if (mode === "loading") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <TopBar title="My Library" subtitle="Your saved work" />
        <div className="mx-auto w-full max-w-2xl p-4 md:p-8">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <BookMarked className="h-5 w-5" />
              </div>
              <CardTitle>Sign in to see your library</CardTitle>
              <CardDescription>
                Your library keeps every meeting summary, task plan, and chat you save — securely,
                across devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create free account
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="My Library" subtitle="Your saved work, synced across devices" />
      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="meeting_note">Meetings</TabsTrigger>
            <TabsTrigger value="task_plan">Plans</TabsTrigger>
            <TabsTrigger value="chat">Chats</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {items === null ? (
              <div className="grid place-items-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <Card className="border-dashed shadow-none">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {q
                    ? "No items match your search."
                    : "Nothing saved yet. Generate something in Meeting Notes, Task Planner, or the Assistant."}
                </CardContent>
              </Card>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-soft">
                {filtered.map((it) => {
                  const meta = KIND_META[it.kind];
                  const Icon = meta.icon;
                  return (
                    <li key={it.id} className="flex items-center gap-3 p-4">
                      <button
                        onClick={() => open(it)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20"
                        aria-label="Open"
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => open(it)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-medium hover:underline">
                          {it.title}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{meta.label}</span>
                          <span>·</span>
                          <span>Created {formatDate(it.created_at)}</span>
                          <span>·</span>
                          <span>Edited {formatRelative(it.updated_at)}</span>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => open(it)}
                        aria-label="Open"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="More">
                            <span className="text-lg leading-none">⋯</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setRenaming(it);
                              setNewTitle(it.title);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(it)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(it)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={!newTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
