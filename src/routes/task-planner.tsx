import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  X,
  Loader2,
  Sparkles,
  Clock,
  AlertTriangle,
  ListChecks,
  Save,
  Check,
  MessageSquare,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/lib/auth-context";
import {
  upsertItem,
  fetchItem,
  saveDraft,
  loadDraft,
  clearDraft,
} from "@/lib/persistence";
import { GuestSaveDialog } from "@/components/guest-save-dialog";
import { DatePicker, formatDeadline } from "@/components/date-picker";
import { useAutosave } from "@/hooks/use-autosave";
import { SaveStatus } from "@/components/save-status";
import { ExportMenu } from "@/components/export-menu";
import { plannerToMarkdown } from "@/lib/exports";
import { consumeTaskPrefill, setChatPrefill } from "@/lib/prefill";
import { Progress } from "@/components/ui/progress";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/task-planner")({
  validateSearch: searchSchema,
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

type ExtInput = PlannerInput & {
  description?: string;
  owner?: string;
  category?: string;
};
type Draft = { id: string } & ExtInput;
type Persisted = { tasks: ExtInput[]; result: PlannerResult | null; completed?: string[] };

const emptyRow = (): Draft => ({
  id: crypto.randomUUID(),
  title: "",
  description: "",
  deadline: "",
  priority: "Medium",
  duration: 30,
  owner: "",
  category: "",
});

function TaskPlanner() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Draft[]>([emptyRow()]);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | undefined>(id);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const hasContent = tasks.some((t) => t.title.trim()) || !!result;
  const autosave = useAutosave(
    { tasks, result, completed: Array.from(completed), savingId },
    async (val) => {
      if (!user) return;
      const first = val.tasks.find((t) => t.title.trim())?.title || "Task plan";
      const item = await upsertItem({
        id: val.savingId,
        user_id: user.id,
        kind: "task_plan",
        title: first,
        data: {
          tasks: val.tasks.map(({ id: _id, ...t }) => t),
          result: val.result,
          completed: val.completed,
        } satisfies Persisted,
      });
      if (!val.savingId) {
        setSavingId(item.id);
        navigate({ to: "/task-planner", search: { id: item.id }, replace: true });
      }
      setSavedAt(item.updated_at);
      setDirty(false);
      clearDraft("task_plan");
      return { savedAt: item.updated_at };
    },
    { enabled: isAuthenticated && hasContent, delayMs: 2000 },
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (id && isAuthenticated) {
        try {
          const item = await fetchItem(id);
          if (!item || cancelled) return;
          const d = item.data as Persisted;
          setTasks(
            (d?.tasks?.length ? d.tasks : [emptyRow()]).map((t) => ({
              ...emptyRow(),
              ...t,
              id: crypto.randomUUID(),
            })),
          );
          setResult(d?.result ?? null);
          setCompleted(new Set(d?.completed ?? []));
          setSavingId(item.id);
          setSavedAt(item.updated_at);
          setDirty(false);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to load");
        }
        return;
      }
      if (!id) {
        const prefill = consumeTaskPrefill();
        if (prefill && !cancelled) {
          setTasks([{ ...emptyRow(), title: prefill.title, description: prefill.description || "" }]);
          setDirty(true);
          toast.success("Loaded task from chat");
          return;
        }
        const d = loadDraft<Persisted>("task_plan");
        if (d && !cancelled) {
          setTasks(
            (d.tasks?.length ? d.tasks : [emptyRow()]).map((t) => ({
              ...emptyRow(),
              ...t,
              id: crypto.randomUUID(),
            })),
          );
          setResult(d.result || null);
          setCompleted(new Set(d.completed ?? []));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!savingId) {
      const persisted: Persisted = {
        tasks: tasks.map(({ id: _id, ...t }) => t),
        result,
        completed: Array.from(completed),
      };
      saveDraft("task_plan", persisted);
    }
  }, [tasks, result, savingId, completed]);

  const markDirty = () => setDirty(true);

  const update = (id: string, patch: Partial<Draft>) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    markDirty();
  };

  const add = () => {
    setTasks((ts) => [...ts, emptyRow()]);
    markDirty();
  };
  const remove = (id: string) => {
    setTasks((ts) => (ts.length > 1 ? ts.filter((t) => t.id !== id) : ts));
    markDirty();
  };

  const persist = async (nextResult: PlannerResult | null) => {
    if (!user) return;
    const persisted: Persisted = {
      tasks: tasks.map(({ id: _id, ...t }) => t),
      result: nextResult,
      completed: Array.from(completed),
    };
    try {
      const first = tasks.find((t) => t.title.trim())?.title || "Task plan";
      const item = await upsertItem({
        id: savingId,
        user_id: user.id,
        kind: "task_plan",
        title: `Plan · ${first}`,
        data: persisted,
      });
      setSavingId(item.id);
      setSavedAt(item.updated_at);
      setDirty(false);
      clearDraft("task_plan");
      if (!id) navigate({ to: "/task-planner", search: { id: item.id }, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const generate = async () => {
    const valid: PlannerInput[] = tasks
      .filter((t) => t.title.trim())
      .map(({ title, deadline, priority, duration }) => ({
        title: title.trim(),
        deadline: deadline ? formatDeadline(deadline) : "No deadline",
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
      if (isAuthenticated) {
        await persist(r);
      } else {
        setDirty(true);
      }
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

  const onSave = async () => {
    if (!isAuthenticated) {
      setGuestOpen(true);
      return;
    }
    await persist(result);
    toast.success("Saved to your library");
  };

  return (
    <>
      <TopBar
        title="AI Task Planner"
        subtitle="Prioritize with the Eisenhower Matrix"
        right={isAuthenticated ? <SaveStatus state={autosave.state} /> : undefined}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-primary" /> Your tasks
              </CardTitle>
              <CardDescription>
                List what's on your plate. AI will sort by urgency &amp; importance and build a schedule.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onSave} disabled={!dirty && !!savingId}>
              {savingId && !dirty ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Save
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="grid gap-2 rounded-xl border border-border bg-card p-3 md:grid-cols-2"
              >
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Task name</Label>
                  <Input
                    value={t.title}
                    onChange={(e) => update(t.id, { title: e.target.value })}
                    placeholder="e.g. Finish quarterly report"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={t.description ?? ""}
                    onChange={(e) => update(t.id, { description: e.target.value })}
                    placeholder="What does 'done' look like?"
                    className="min-h-16"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
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
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated duration (min)</Label>
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
                </div>
                <div className="space-y-1.5">
                  <Label>Due date</Label>
                  <DatePicker
                    value={t.deadline}
                    onChange={(iso) => update(t.id, { deadline: iso })}
                    placeholder="Pick a date"
                  />
                  {isOverdue(t.deadline) && (
                    <div className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Owner (optional)</Label>
                  <Input
                    value={t.owner ?? ""}
                    onChange={(e) => update(t.id, { owner: e.target.value })}
                    placeholder="Name or team"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Category (optional)</Label>
                  <Input
                    value={t.category ?? ""}
                    onChange={(e) => update(t.id, { category: e.target.value })}
                    placeholder="e.g. Marketing, Product"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(t.id)}
                    disabled={tasks.length === 1}
                  >
                    <X className="mr-1.5 h-4 w-4" /> Remove
                  </Button>
                </div>
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
          <PlanView
            result={result}
            completed={completed}
            onToggle={(title) => {
              setCompleted((prev) => {
                const n = new Set(prev);
                n.has(title) ? n.delete(title) : n.add(title);
                return n;
              });
              setDirty(true);
            }}
            planTitle={tasks.find((t) => t.title.trim())?.title || "Task plan"}
          />
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
      <GuestSaveDialog
        open={guestOpen}
        onOpenChange={setGuestOpen}
        feature="this plan"
      />
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>;
}

function isOverdue(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso + (iso.length === 10 ? "T23:59:59" : ""));
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
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

function PlanView({
  result,
  completed,
  onToggle,
  planTitle,
}: {
  result: PlannerResult;
  completed: Set<string>;
  onToggle: (title: string) => void;
  planTitle: string;
}) {
  const navigate = useNavigate();
  const quadrants: Quadrant[] = ["do", "schedule", "delegate", "eliminate"];
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
  const total = result.prioritized.length;
  const done = result.prioritized.filter((t) => completed.has(t.title)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const markdown = plannerToMarkdown(result, completed, planTitle);

  const matchesFilter = (t: PlannerResult["prioritized"][number]) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    const isDone = completed.has(t.title);
    if (filter === "active" && isDone) return false;
    if (filter === "completed" && !isDone) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">
                {done} of {total} complete
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tasks</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setChatPrefill({
                  input: `Here's my task plan. Help me refine it, spot blockers, and draft a status update:\n\n${markdown}`,
                });
                navigate({ to: "/chat", search: {} });
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Discuss
            </Button>
            <ExportMenu markdown={markdown} filenameBase={planTitle || "task-plan"} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {quadrants.map((q) => {
          const items = result.prioritized.filter((t) => t.quadrant === q).filter(matchesFilter);
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
                {items.map((t) => {
                  const isDone = completed.has(t.title);
                  return (
                    <div
                      key={t.title}
                      className={`rounded-lg border border-border bg-background p-3 transition ${isDone ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <Checkbox
                            checked={isDone}
                            onCheckedChange={() => onToggle(t.title)}
                            className="mt-0.5"
                            aria-label={`Mark ${t.title} complete`}
                          />
                          <div className="min-w-0">
                            <div className={`truncate text-sm font-medium ${isDone ? "line-through" : ""}`}>
                              {t.title}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{t.rationale}</div>
                          </div>
                        </div>
                        {priorityBadge(t.priority)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 pl-6 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {t.duration} min
                        </span>
                        <span>· {t.deadline}</span>
                      </div>
                    </div>
                  );
                })}
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
