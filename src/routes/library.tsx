import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookMarked, FileText, ListChecks, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — Momentum AI" },
      { name: "description", content: "Your saved meeting notes, task plans, and chats." },
    ],
  }),
  component: LibraryPage,
});

type Item = {
  id: string;
  kind: "meeting_note" | "task_plan" | "chat";
  title: string;
  created_at: string;
};

const KIND_META = {
  meeting_note: { icon: FileText, label: "Meeting note" },
  task_plan: { icon: ListChecks, label: "Task plan" },
  chat: { icon: MessageSquare, label: "Chat" },
} as const;

function LibraryPage() {
  const { isAuthenticated, mode } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [tab, setTab] = useState<"all" | Item["kind"]>("all");

  const load = async () => {
    const { data, error } = await supabase
      .from("saved_items")
      .select("id, kind, title, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((data ?? []) as Item[]);
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("saved_items").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    toast.success("Removed");
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

  const filtered = items?.filter((i) => tab === "all" || i.kind === tab) ?? [];

  return (
    <>
      <TopBar title="My Library" subtitle="Your saved work, synced across devices" />
      <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
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
                  Nothing saved yet. Generate something in Meeting Notes, Task Planner, or the
                  Assistant, then hit Save.
                </CardContent>
              </Card>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-soft">
                {filtered.map((it) => {
                  const meta = KIND_META[it.kind];
                  return (
                    <li key={it.id} className="flex items-center gap-3 p-4">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <meta.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{it.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {meta.label} · {new Date(it.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(it.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
