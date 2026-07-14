import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Users,
  Target,
  Calendar,
  AlertTriangle,
  Save,
  Plus,
  CalendarPlus,
} from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Disclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { summarizeMeeting, type MeetingSummary } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth-context";
import {
  upsertItem,
  fetchItem,
  saveDraft,
  loadDraft,
  clearDraft,
} from "@/lib/persistence";
import { GuestSaveDialog } from "@/components/guest-save-dialog";
import { useAutosave } from "@/hooks/use-autosave";
import { SaveStatus } from "@/components/save-status";
import { ExportMenu } from "@/components/export-menu";
import { meetingToMarkdown } from "@/lib/exports";
import { consumeNotePrefill } from "@/lib/prefill";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/meeting-notes")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Momentum AI" },
      {
        name: "description",
        content:
          "Paste notes or upload a transcript and get an executive summary, participants, decisions, action items, and risks.",
      },
    ],
  }),
  component: MeetingNotes,
});

type Draft = {
  title: string;
  notes: string;
  result: MeetingSummary | null;
};

function MeetingNotes() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | undefined>(id);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [result, setResult] = useState<MeetingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useUnsavedChanges(dirty);

  // Load: cloud (if id) or local draft
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (id && isAuthenticated) {
        try {
          const item = await fetchItem(id);
          if (!item || cancelled) return;
          const d = item.data as Draft;
          setTitle(item.title === "Untitled" ? "" : item.title);
          setNotes(d?.notes ?? "");
          setResult(d?.result ?? null);
          setSavingId(item.id);
          setSavedAt(item.updated_at);
          setDirty(false);
          return;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to load");
        }
      }
      if (!id) {
        const prefill = consumeNotePrefill();
        if (prefill && !cancelled) {
          setTitle(prefill.title || "");
          setNotes(prefill.notes);
          setDirty(true);
          toast.success("Loaded content from chat");
          return;
        }
        const d = loadDraft<Draft>("meeting_note");
        if (d && !cancelled) {
          setTitle(d.title || "");
          setNotes(d.notes || "");
          setResult(d.result || null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  // Persist draft locally on every change
  useEffect(() => {
    if (!savingId) saveDraft("meeting_note", { title, notes, result });
  }, [title, notes, result, savingId]);

  const markDirty = () => setDirty(true);

  const onUpload = async (f: File) => {
    if (!/\.txt$/i.test(f.name)) {
      toast.error("Please upload a .txt file");
      return;
    }
    const text = await f.text();
    setNotes(text);
    if (!title) setTitle(f.name.replace(/\.txt$/i, ""));
    markDirty();
    toast.success("Transcript loaded");
  };

  const persist = async (nextResult: MeetingSummary) => {
    if (!user) return;
    try {
      const item = await upsertItem({
        id: savingId,
        user_id: user.id,
        kind: "meeting_note",
        title: title || nextResult.title || "Meeting summary",
        data: { title, notes, result: nextResult } satisfies Draft,
      });
      setSavingId(item.id);
      setSavedAt(item.updated_at);
      setDirty(false);
      clearDraft("meeting_note");
      if (!id) navigate({ to: "/meeting-notes", search: { id: item.id }, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const onGenerate = async () => {
    if (!notes.trim()) {
      toast.error("Paste notes or upload a transcript first");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await summarizeMeeting({ data: { title, notes } });
      setResult(r);
      toast.success("Summary generated");
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
    if (!result) return;
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
        title="Meeting Notes Summarizer"
        subtitle={
          savedAt
            ? `Saved · last edited ${new Date(savedAt).toLocaleString()}`
            : dirty
              ? "Unsaved changes"
              : "Turn raw notes into a clean, shareable recap"
        }
      />
      <div className="mx-auto grid w-full max-w-7xl gap-6 p-4 md:p-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 shadow-soft h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> Meeting input
            </CardTitle>
            <CardDescription>Paste notes or upload a .txt transcript.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Meeting title (optional)</label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Q3 Planning Sync"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Transcript or notes</label>
              <Textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  markDirty();
                }}
                placeholder="Paste the raw meeting transcript or notes here…"
                className="min-h-56 resize-y"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Upload transcript
              </Button>
              <Button onClick={onGenerate} disabled={loading} className="flex-1 min-w-40">
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Generate summary
                  </>
                )}
              </Button>
            </div>
            <Disclaimer />
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : result ? (
            <SummaryView
              data={result}
              onSave={onSave}
              isSaved={!!savingId && !dirty}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
      <GuestSaveDialog
        open={guestOpen}
        onOpenChange={setGuestOpen}
        feature="this summary"
      />
    </>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center border-dashed py-16 text-center shadow-none">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">Your summary will appear here</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Paste a transcript on the left and click Generate summary. The AI will only use what you provide — no invented names or tasks.
      </p>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 shadow-none">
      <CardContent className="flex items-start gap-3 p-6 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <div className="font-medium text-destructive">Could not generate summary</div>
          <div className="mt-1 text-muted-foreground">{message}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="shadow-soft">
      <CardContent className="space-y-3 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-muted"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function priorityBadge(p: "High" | "Medium" | "Low") {
  const cls =
    p === "High"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : p === "Medium"
        ? "bg-warning/15 text-warning-foreground border-warning/30"
        : "bg-success/10 text-success border-success/20";
  return <Badge variant="outline" className={cls}>{p}</Badge>;
}

const NA = "Not mentioned in the transcript.";
const isMissing = (s: string) => !s || s.trim() === "" || s.trim() === NA;

function SummaryView({
  data,
  onSave,
  isSaved,
}: {
  data: MeetingSummary;
  onSave: () => void;
  isSaved: boolean;
}) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const copy = async () => {
    const lines = [
      data.title,
      "",
      data.executiveSummary,
      "",
      "Key points:",
      ...data.keyPoints.map((p) => "- " + p),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Copied summary");
    setTimeout(() => setCopied(false), 1500);
  };

  const priorityToNum = (p: "High" | "Medium" | "Low") =>
    p === "High" ? 3 : p === "Medium" ? 2 : 1;

  const sendToPlanner = async (indexes: number[]) => {
    const items = indexes.map((i) => data.actionItems[i]).filter(Boolean);
    if (!items.length) {
      toast.error("Select at least one action item");
      return;
    }
    const tasks = items.map((a) => ({
      title: a.task,
      deadline: parseDeadlineToISO(a.deadline),
      priority: a.priority,
      duration: 30,
      owner: a.owner,
    }));

    if (isAuthenticated && user) {
      // Persist as a new plan draft so user lands on prefilled planner.
      try {
        const item = await upsertItem({
          user_id: user.id,
          kind: "task_plan",
          title: `Action items · ${data.title || new Date().toLocaleDateString()}`,
          data: { tasks, result: null },
        });
        toast.success(`Added ${items.length} task${items.length > 1 ? "s" : ""} to planner`);
        navigate({ to: "/task-planner", search: { id: item.id } });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    } else {
      saveDraft("task_plan", { tasks, result: null });
      toast.success("Loaded into planner");
      navigate({ to: "/task-planner" });
    }
  };

  const downloadIcs = () => {
    if (isMissing(data.nextMeeting)) {
      toast.error("No next meeting mentioned in the transcript");
      return;
    }
    const start = tryParseNextMeeting(data.nextMeeting);
    const dtStamp = toIcsDate(new Date());
    const dtStart = toIcsDate(start ?? new Date(Date.now() + 7 * 86400000));
    const dtEnd = toIcsDate(new Date((start?.getTime() ?? Date.now() + 7 * 86400000) + 30 * 60000));
    const uid = `${crypto.randomUUID()}@momentum.ai`;
    const summary = escapeIcs(`Next meeting: ${data.title || "Follow-up"}`);
    const description = escapeIcs(data.nextMeeting);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Momentum AI//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `next-meeting.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="min-w-0">
            <CardDescription>Executive summary</CardDescription>
            <CardTitle className="truncate text-lg">{data.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <ExportMenu markdown={meetingToMarkdown(data)} filenameBase={data.title || "meeting-summary"} />
            <Button size="sm" variant="outline" onClick={onSave} disabled={isSaved}>
              {isSaved ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-4 w-4" /> Save
                </>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={copy} title="Copy short summary">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{data.executiveSummary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">{NA}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.participants.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.role || "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Meeting objective
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90">{data.objective || NA}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Action items</CardTitle>
          {data.actionItems.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendToPlanner(Array.from(selected))}
                disabled={selected.size === 0}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add selected
              </Button>
              <Button
                size="sm"
                onClick={() => sendToPlanner(data.actionItems.map((_, i) => i))}
              >
                <ListChecksIcon /> Add all to planner
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {data.actionItems.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">{NA}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Task</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.actionItems.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={() => toggle(i)}
                        aria-label="Select"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{a.task}</TableCell>
                    <TableCell>{a.owner}</TableCell>
                    <TableCell>{priorityBadge(a.priority)}</TableCell>
                    <TableCell className="text-muted-foreground">{a.deadline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Decisions made</CardTitle>
          </CardHeader>
          <CardContent>
            {data.decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{NA}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.decisions.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-soft border-warning/30">
          <CardHeader>
            <CardTitle className="text-base">Risks &amp; concerns</CardTitle>
          </CardHeader>
          <CardContent>
            {data.risks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{NA}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.risks.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" /> Next meeting
          </CardTitle>
          {!isMissing(data.nextMeeting) && (
            <Button size="sm" variant="outline" onClick={downloadIcs}>
              <CalendarPlus className="mr-1.5 h-4 w-4" /> Add to calendar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90">
            {isMissing(data.nextMeeting) ? NA : data.nextMeeting}
          </p>
        </CardContent>
      </Card>

      <div className="text-right">
        <span className="text-xs text-muted-foreground">Prep checklist auto-generates when you add to calendar.</span>
      </div>
    </div>
  );
}

// simple inline icon
function ListChecksIcon() {
  return (
    <svg
      className="mr-1.5 h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}

function parseDeadlineToISO(dl: string): string {
  const d = new Date(dl);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return "";
}

function tryParseNextMeeting(text: string): Date | null {
  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

function toIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
