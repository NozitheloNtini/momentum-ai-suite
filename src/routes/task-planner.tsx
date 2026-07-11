import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  X,
  Loader2,
  Sparkles,
  Clock,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Disclaimer } from "@/components/disclaimer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  planTasks,
  type PlannerInput,
  type PlannerResult,
  type Quadrant,
} from "@/lib/ai.functions";
import { SaveButton } from "@/components/save-button";

export const Route = createFileRoute("/task-planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Momentum AI" },
      {
        name: "description",
        content:
          "Enter your tasks and let AI prioritize them with the Eisenhower Matrix and build a focused daily schedule.",
      },
    ],
  }),
  component: TaskPlanner,
});

type Draft = PlannerInput & { id: string };

const TITLE_PLACEHOLDERS = [
  "Finish quarterly report",
  "Respond to client email",
  "Prepare presentation",
  "Schedule stakeholder meeting",
];

const emptyRow = (): Draft => ({
  id: crypto.randomUUID(),
  title: "",
  deadline: "",
  priority: "Medium",
  duration: 30,
});

function TaskPlanner() {
  const [tasks, setTasks] = useState<Draft[]>([emptyRow(0)]);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Draft>) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const add = () => setTasks((ts) => [...ts, emptyRow(ts.length)]);
  const remove = (id: string) =>
    setTasks((ts) => (ts.length > 1 ? ts.filter((t) => t.id !== id) : ts));

  const generate = async () => {
    const valid = tasks
      .filter((t) => t.title.trim())
      .map(({ title, deadline, priority, duration }) => ({
        title: title.trim(),
        deadline: deadline.trim() || "No deadline",
        priority,
        duration: Number(duration) || 30,
      }));
    if (!valid.length) {
      toast.error("Add at least one task");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await planTasks({ data: { tasks: valid } });
      setResult(r);
      toast.success("Plan ready");
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "AI service unavailable. Connect an OpenAI-compatible model to enable AI-generated responses.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="AI Task Planner" subtitle="Prioritize with the Eisenhower Matrix" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-primary" /> Your tasks
            </CardTitle>
            <CardDescription>
              List what's on your plate. AI will sort by urgency &amp; importance and build a schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((t, i) => (
              <div
                key={t.id}
                className="grid gap-2 rounded-xl border border-border bg-card p-3 md:grid-cols-[1fr_140px_140px_120px_auto] md:items-center"
              >
                <Input
                  value={t.title}
                  onChange={(e) => update(t.id, { title: e.target.value })}
                  placeholder={TITLE_PLACEHOLDERS[i % TITLE_PLACEHOLDERS.length]}
                />
                <Input
                  value={t.deadline}
                  onChange={(e) => update(t.id, { deadline: e.target.value })}
                  placeholder="e.g. Today, Fri"
                />
                <Select
                  value={t.priority}
                  onValueChange={(v) =>
                    update(t.id, { priority: v as PlannerInput["priority"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={t.duration}
                  onChange={(e) =>
                    update(t.id, { duration: Number(e.target.value) || 30 })
                  }
                  placeholder="Minutes"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(t.id)}
                  aria-label="Remove task"
                  disabled={tasks.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap justify-between gap-2 pt-1">
              <Button variant="outline" onClick={add}>
                <Plus className="mr-1.5 h-4 w-4" /> Add task
              </Button>
              <Button onClick={generate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Planning…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Generate plan
                  </>
                )}
              </Button>
            </div>
            <Disclaimer />
          </CardContent>
        </Card>

        {loading ? (
          <Card className="shadow-soft">
            <CardContent className="grid gap-3 p-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/5 shadow-none">
            <CardContent className="flex items-start gap-3 p-6 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <div className="font-medium text-destructive">Could not generate plan</div>
                <div className="mt-1 text-muted-foreground">{error}</div>
              </div>
            </CardContent>
          </Card>
        ) : result ? (
          <>
            <div className="flex justify-end">
              <SaveButton
                kind="task_plan"
                title={`Plan · ${new Date().toLocaleDateString()}`}
                data={result}
                featureLabel="this plan"
              />
            </div>
            <PlanView result={result} />
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center border-dashed py-12 text-center shadow-none">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ListChecks className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No plan yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your tasks above and click Generate plan. AI will prioritize using the
              Eisenhower Matrix and build a focused schedule.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

const QUADRANT_META: Record<Quadrant, { title: string; sub: string; tone: string }> = {
  do: {
    title: "Do first",
    sub: "Urgent & important",
    tone: "border-destructive/30 bg-destructive/5",
  },
  schedule: {
    title: "Schedule",
    sub: "Important, not urgent",
    tone: "border-primary/30 bg-primary/5",
  },
  delegate: {
    title: "Delegate",
    sub: "Urgent, not important",
    tone: "border-warning/30 bg-warning/10",
  },
  eliminate: {
    title: "Eliminate",
    sub: "Neither urgent nor important",
    tone: "border-border bg-muted/40",
  },
};

function priorityBadge(p: PlannerInput["priority"]) {
  const cls =
    p === "High"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : p === "Medium"
        ? "bg-warning/15 text-warning-foreground border-warning/30"
        : "bg-success/10 text-success border-success/20";
  return (
    <Badge variant="outline" className={cls}>
      {p}
    </Badge>
  );
}

function PlanView({ result }: { result: PlannerResult }) {
  const quadrants: Quadrant[] = ["do", "schedule", "delegate", "eliminate"];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {quadrants.map((q) => {
          const items = result.prioritized.filter((t) => t.quadrant === q);
          const meta = QUADRANT_META[q];
          return (
            <Card key={q} className={`shadow-soft ${meta.tone}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{meta.title}</CardTitle>
                <CardDescription>{meta.sub}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground">No tasks here.</p>
                )}
                {items.map((t) => (
                  <div key={t.title} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{t.rationale}</div>
                      </div>
                      {priorityBadge(t.priority)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {t.duration} min
                      </span>
                      <span>· {t.deadline}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Today's schedule</CardTitle>
            <CardDescription>Time-blocked plan starting 9:00 AM</CardDescription>
          </CardHeader>
          <CardContent>
            {result.schedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <ol className="relative border-l border-border pl-4">
                {result.schedule.map((s, i) => (
                  <li key={i} className="mb-4 ml-2">
                    <span className="absolute -left-1.5 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {s.time} · {s.duration} min
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-sm font-medium">
                      {s.task} {priorityBadge(s.priority)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-soft border-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" /> High-risk deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.risks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No high-risk deadlines detected.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {result.risks.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
            {result.focusOrder.length > 0 && (
              <div className="mt-4 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Focus order:</span>{" "}
                {result.focusOrder.join(" → ")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
