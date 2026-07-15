import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  ListChecks,
  MessageSquare,
  ArrowRight,
  Clock,
  TrendingUp,
  Zap,
  Lightbulb,
  CheckCircle2,
  UserPlus,
  Loader2,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { listItems, formatRelative, type SavedItem } from "@/lib/persistence";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Momentum AI" },
      { name: "description", content: "Your Momentum AI workspace overview." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  {
    title: "Meeting Notes",
    description: "Turn raw notes into a clean recap with action items.",
    icon: FileText,
    href: "/meeting-notes" as const,
    tint: "from-blue-500/15 to-blue-500/0",
  },
  {
    title: "Task Planner",
    description: "Prioritize your day with the Eisenhower Matrix.",
    icon: ListChecks,
    href: "/task-planner" as const,
    tint: "from-indigo-500/15 to-indigo-500/0",
  },
  {
    title: "AI Assistant",
    description: "Chat through emails, reports, and follow-ups.",
    icon: MessageSquare,
    href: "/chat" as const,
    tint: "from-violet-500/15 to-violet-500/0",
  },
];

const sampleActivity = [
  { icon: FileText, kind: "meeting_note" as const, text: "Meeting summary example", time: "Sample" },
  { icon: ListChecks, kind: "task_plan" as const, text: "Task plan example", time: "Sample" },
  { icon: MessageSquare, kind: "chat" as const, text: "Assistant reply example", time: "Sample" },
];

const KIND_META = {
  meeting_note: { icon: FileText, label: "Meeting Summary", path: "/meeting-notes" as const },
  task_plan: { icon: ListChecks, label: "Task Plan", path: "/task-planner" as const },
  chat: { icon: MessageSquare, label: "Chat", path: "/chat" as const },
} as const;

const tips = [
  "Batch similar work into 90-minute blocks to protect deep focus.",
  "End meetings 5 min early to write next steps while context is fresh.",
  "Reply-later inbox: triage twice a day, not continuously.",
];

function Dashboard() {
  const { displayName, isGuest, isAuthenticated } = useAuth();
  const firstName = displayName.split(" ")[0];
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedItem[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    listItems()
      .then(setItems)
      .catch(() => setItems([]));
  }, [isAuthenticated]);

  const counts = {
    meeting_note: items?.filter((i) => i.kind === "meeting_note").length ?? 0,
    task_plan: items?.filter((i) => i.kind === "task_plan").length ?? 0,
    chat: items?.filter((i) => i.kind === "chat").length ?? 0,
    total: items?.length ?? 0,
  };
  const oneWeekAgo = Date.now() - 7 * 86400000;
  const thisWeek = (items ?? []).filter(
    (i) => new Date(i.updated_at).getTime() >= oneWeekAgo,
  ).length;
  const recent = (items ?? []).slice(0, 5);
  const lastItem = (items ?? [])[0] ?? null;

  return (
    <>
      <TopBar title="Dashboard" subtitle={`Welcome${firstName ? `, ${firstName}` : ""}`} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
        {isGuest ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <span>
                You're in <span className="font-medium">guest mode</span> — your work is temporary
                and not saved.
              </span>
            </div>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create free account
              </Link>
            </Button>
          </div>
        ) : null}

        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-soft md:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" /> AI-powered workplace productivity
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
              Save two hours a day with Momentum AI
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Summarize meetings, plan your day, and draft workplace writing — all in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/meeting-notes">
                  Summarize a meeting <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/chat">Open assistant</Link>
              </Button>
            </div>
          </div>
        </div>

        {isAuthenticated && lastItem && (() => {
          const meta = KIND_META[lastItem.kind];
          const Icon = meta.icon;
          return (
            <button
              onClick={() => navigate({ to: meta.path, search: { id: lastItem.id } })}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition hover:border-primary/40 hover:shadow-glow"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Continue where you left off
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold">{lastItem.title}</div>
                <div className="text-xs text-muted-foreground">
                  {meta.label} · edited {formatRelative(lastItem.updated_at)}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          );
        })()}

        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((t) => (
            <Card
              key={t.title}
              className="group relative overflow-hidden border-border/70 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.tint} opacity-70`}
              />
              <CardHeader className="relative">
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button asChild size="sm" variant="secondary" className="gap-1">
                  <Link to={t.href}>
                    Launch <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>
                  {isAuthenticated
                    ? recent.length
                      ? "Your latest saved work — click to reopen."
                      : "Start using the tools above to build your activity feed."
                    : "Sample data — sign up to keep a real history."}
                </CardDescription>
              </div>
              {!isAuthenticated && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Sample data
                </span>
              )}
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                items === null ? (
                  <div className="grid place-items-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {recent.map((r) => {
                      const meta = KIND_META[r.kind];
                      const Icon = meta.icon;
                      return (
                        <li key={r.id}>
                          <button
                            onClick={() => navigate({ to: meta.path, search: { id: r.id } })}
                            className="flex w-full items-center gap-3 py-3 text-left text-sm transition hover:bg-muted/50"
                          >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{r.title}</div>
                              <div className="text-xs text-muted-foreground">{meta.label}</div>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              <Clock className="mr-1 inline h-3 w-3" />
                              {formatRelative(r.updated_at)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : (
                <ul className="divide-y divide-border">
                  {sampleActivity.map((a, i) => (
                    <li key={i} className="flex items-center gap-3 py-3 text-sm">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                        <a.icon className="h-4 w-4" />
                      </div>
                      <span className="min-w-0 flex-1 truncate">{a.text}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {a.time}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" /> AI usage
                  </CardTitle>
                  <CardDescription>
                    {isAuthenticated ? "Your saved work" : "Monthly credit summary"}
                  </CardDescription>
                </div>
                {!isAuthenticated && (
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Sample data
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <StatRow label="Meeting summaries" value={counts.meeting_note} loading={isAuthenticated && items === null} />
                <StatRow label="Task plans" value={counts.task_plan} loading={isAuthenticated && items === null} />
                <StatRow label="AI chats" value={counts.chat} loading={isAuthenticated && items === null} />
                {isAuthenticated && (
                  <StatRow
                    label="Edited this week"
                    value={thisWeek}
                    loading={items === null}
                  />
                )}
                <div className="border-t border-border pt-2">
                  <StatRow label="Total saved" value={counts.total} loading={isAuthenticated && items === null} bold />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-warning" /> Productivity tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {tips.map((t) => (
                    <li key={t} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function StatRow({
  label,
  value,
  loading,
  bold,
}: {
  label: string;
  value: number;
  loading?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : "font-medium"}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : value}
      </span>
    </div>
  );
}
