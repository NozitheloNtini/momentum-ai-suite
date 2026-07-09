import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";

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

const activity = [
  { icon: FileText, text: "Summarized Q3 Planning Sync", time: "12 min ago" },
  { icon: ListChecks, text: "Planned 6 tasks for Thursday", time: "1 hr ago" },
  { icon: MessageSquare, text: "Drafted a professional reply", time: "Yesterday" },
  { icon: FileText, text: "Summarized Design Review", time: "Yesterday" },
];

const tips = [
  "Batch similar work into 90-minute blocks to protect deep focus.",
  "End meetings 5 min early to write next steps while context is fresh.",
  "Reply-later inbox: triage twice a day, not continuously.",
];

function Dashboard() {
  const { displayName, isGuest } = useAuth();
  const firstName = displayName.split(" ")[0];

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
              <Zap className="h-3 w-3" /> Your workspace is 27% faster this week
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
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>
                {isGuest
                  ? "Sample activity — sign up to keep a real history."
                  : "What Momentum has helped you with lately."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {activity.map((a, i) => (
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
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" /> AI usage
                </CardTitle>
                <CardDescription>Monthly credit summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Stat label="Summaries" value={18} max={30} />
                <Stat label="Plans generated" value={11} max={20} />
                <Stat label="Chat messages" value={142} max={500} />
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

function Stat({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}
