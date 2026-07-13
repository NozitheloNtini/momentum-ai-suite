import { toast } from "sonner";
import type { MeetingSummary, PlannerResult } from "@/lib/ai.functions";

export function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function copyText(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Copy failed");
  }
}

export function safeFilename(name: string, fallback = "document"): string {
  const base = (name || fallback)
    .toLowerCase()
    .replace(/[^\w\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return base || fallback;
}

const NA = "Not mentioned in the transcript.";

// ---------- Meeting summary ----------

export function meetingToMarkdown(s: MeetingSummary): string {
  const lines: string[] = [];
  lines.push(`# ${s.title || "Meeting summary"}`, "");
  lines.push("## Executive summary", "", s.executiveSummary || NA, "");

  lines.push("## Participants", "");
  if (s.participants.length === 0) {
    lines.push("_None mentioned._");
  } else {
    for (const p of s.participants) {
      lines.push(`- **${p.name}**${p.role ? ` — ${p.role}` : ""}`);
    }
  }
  lines.push("");

  lines.push("## Objective", "", s.objective || NA, "");

  lines.push("## Key points", "");
  if (s.keyPoints.length === 0) lines.push("_None._");
  else s.keyPoints.forEach((p) => lines.push(`- ${p}`));
  lines.push("");

  lines.push("## Decisions", "");
  if (s.decisions.length === 0) lines.push("_None._");
  else s.decisions.forEach((d) => lines.push(`- ${d}`));
  lines.push("");

  lines.push("## Action items", "");
  if (s.actionItems.length === 0) {
    lines.push("_None._");
  } else {
    lines.push("| Task | Owner | Priority | Deadline |");
    lines.push("| --- | --- | --- | --- |");
    for (const a of s.actionItems) {
      lines.push(
        `| ${a.task} | ${a.owner || "—"} | ${a.priority} | ${a.deadline || "—"} |`,
      );
    }
  }
  lines.push("");

  lines.push("## Risks & concerns", "");
  if (s.risks.length === 0) lines.push("_None._");
  else s.risks.forEach((r) => lines.push(`- ${r}`));
  lines.push("");

  lines.push("## Next meeting", "", s.nextMeeting || NA, "");
  return lines.join("\n");
}

// ---------- Task planner ----------

export function plannerToMarkdown(
  result: PlannerResult,
  completed: Set<string>,
  planTitle = "Task plan",
): string {
  const lines: string[] = [];
  lines.push(`# ${planTitle}`, "");

  const done = result.prioritized.filter((t) => completed.has(t.title)).length;
  const total = result.prioritized.length;
  lines.push(`_Progress: ${done} of ${total} complete_`, "");

  const groups: Record<string, string> = {
    do: "Do first (urgent & important)",
    schedule: "Schedule (important, not urgent)",
    delegate: "Delegate (urgent, not important)",
    eliminate: "Eliminate (neither)",
  };
  for (const [q, label] of Object.entries(groups)) {
    const items = result.prioritized.filter((t) => t.quadrant === q);
    if (items.length === 0) continue;
    lines.push(`## ${label}`, "");
    for (const t of items) {
      const check = completed.has(t.title) ? "x" : " ";
      lines.push(`- [${check}] **${t.title}** — ${t.priority}, ${t.duration} min, ${t.deadline}`);
      if (t.rationale) lines.push(`  - ${t.rationale}`);
    }
    lines.push("");
  }

  if (result.schedule.length > 0) {
    lines.push("## Today's schedule", "");
    for (const s of result.schedule) {
      lines.push(`- **${s.time}** — ${s.task} (${s.duration} min, ${s.priority})`);
    }
    lines.push("");
  }

  if (result.risks.length > 0) {
    lines.push("## High-risk deadlines", "");
    result.risks.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }

  if (result.focusOrder.length > 0) {
    lines.push("## Focus order", "", result.focusOrder.join(" → "), "");
  }
  return lines.join("\n");
}

// ---------- Chat ----------

export type ChatMsg = { role: "user" | "assistant"; text: string };

export function chatToMarkdown(messages: ChatMsg[], title = "Assistant conversation"): string {
  const lines: string[] = [`# ${title}`, ""];
  for (const m of messages) {
    lines.push(`**${m.role === "user" ? "You" : "Momentum AI"}**`, "", m.text, "");
  }
  return lines.join("\n");
}
