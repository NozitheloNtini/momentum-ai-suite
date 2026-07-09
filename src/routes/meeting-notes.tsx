import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Upload, Sparkles, Loader2, Copy, Check } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Disclaimer } from "@/components/disclaimer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockSummarizeMeeting, type MeetingSummary } from "@/lib/mock-ai";
import { SaveButton } from "@/components/save-button";

export const Route = createFileRoute("/meeting-notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Momentum AI" },
      {
        name: "description",
        content:
          "Paste notes or upload a transcript and get an executive summary, key points, action items, decisions, and risks.",
      },
    ],
  }),
  component: MeetingNotes,
});

const SAMPLE = `Kickoff Q3 planning. Priya walked through onboarding revamp scope; team agreed to prioritize the mobile flow first. Marcus flagged launch messaging is not aligned with product roadmap — will draft new narrative by next Monday. Dana confirmed analytics dashboards need refresh; owner set. Legal review pending on data-sharing terms. Decision: ship mobile release Oct 24 with limited beta.`;

function MeetingNotes() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingSummary | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (f: File) => {
    if (!/\.txt$/i.test(f.name)) {
      toast.error("Please upload a .txt file");
      return;
    }
    const text = await f.text();
    setNotes(text);
    if (!title) setTitle(f.name.replace(/\.txt$/i, ""));
    toast.success("Transcript loaded");
  };

  const onGenerate = async () => {
    if (!notes.trim()) {
      toast.error("Paste notes or upload a transcript first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await mockSummarizeMeeting(title, notes);
      setResult(r);
      toast.success("Summary generated");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar
        title="Meeting Notes Summarizer"
        subtitle="Turn raw notes into a clean, shareable recap"
      />
      <div className="mx-auto grid w-full max-w-7xl gap-6 p-4 md:p-8 lg:grid-cols-5">
        {/* Input */}
        <Card className="lg:col-span-2 shadow-soft h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> Meeting input
            </CardTitle>
            <CardDescription>Paste notes or upload a .txt transcript.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Meeting title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Q3 Planning Sync"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <button
                  type="button"
                  onClick={() => setNotes(SAMPLE)}
                  className="text-xs text-primary hover:underline"
                >
                  Load sample
                </button>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste raw meeting notes here…"
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
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating…
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

        {/* Output */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? <LoadingSkeleton /> : result ? <SummaryView data={result} /> : <EmptyState />}
        </div>
      </div>
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
        Add notes on the left and click Generate summary to get an executive recap, action items,
        and risks.
      </p>
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

function SummaryView({ data }: { data: MeetingSummary }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(
      `${data.title}\n\n${data.executiveSummary}\n\nKey points:\n${data.keyPoints.map((p) => "- " + p).join("\n")}`,
    );
    setCopied(true);
    toast.success("Copied summary");
    setTimeout(() => setCopied(false), 1500);
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
            <SaveButton
              kind="meeting_note"
              title={data.title || "Meeting summary"}
              data={data}
              featureLabel="this summary"
              variant="ghost"
            />
            <Button size="sm" variant="ghost" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{data.executiveSummary}</p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Key discussion points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {data.keyPoints.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Action items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.actionItems.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{a.task}</TableCell>
                  <TableCell>{a.owner}</TableCell>
                  <TableCell>{priorityBadge(a.priority)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.deadline}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Decisions made</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.decisions.map((d) => (
                <li key={d} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-warning/30">
          <CardHeader>
            <CardTitle className="text-base">Risks &amp; follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.risks.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
