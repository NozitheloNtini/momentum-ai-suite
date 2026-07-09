// Mock AI service. Structured prompts documented inline; swap `mock*` functions
// with real LLM calls (OpenAI / Lovable AI Gateway) without changing callers.

export type ActionItem = {
  task: string;
  owner: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
};

export type MeetingSummary = {
  title: string;
  executiveSummary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  risks: string[];
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/*
 * MEETING NOTES PROMPT (for real LLM):
 * Role: Senior executive assistant summarizing internal meetings.
 * Context: Raw meeting notes / transcript provided by the user.
 * Task: Produce a concise, professional summary with executive summary,
 *   key points, action items (task/owner/priority/deadline), decisions,
 *   risks & follow-ups.
 * Output Format: Structured JSON matching MeetingSummary.
 */
export async function mockSummarizeMeeting(
  title: string,
  notes: string,
): Promise<MeetingSummary> {
  await delay(1400);
  const first = notes.split(/[.\n]/).find((s) => s.trim().length > 12)?.trim() ?? "team sync";
  return {
    title: title || "Untitled Meeting",
    executiveSummary: `The team aligned on ${first.toLowerCase()} and confirmed next-quarter priorities. Ownership was assigned for each initiative, and blockers were escalated for resolution this week.`,
    keyPoints: [
      "Q3 roadmap reviewed; onboarding revamp remains top priority",
      "Customer feedback loop shortened from 14 to 7 days",
      "Engineering capacity confirmed for the mobile release",
      "Marketing to lead the co-launch narrative with product",
    ],
    actionItems: [
      { task: "Finalize onboarding wireframes", owner: "Priya", priority: "High", deadline: "Fri" },
      { task: "Draft launch messaging", owner: "Marcus", priority: "High", deadline: "Next Mon" },
      { task: "Set up analytics dashboards", owner: "Dana", priority: "Medium", deadline: "Wed" },
      { task: "Schedule beta customer calls", owner: "Alex", priority: "Low", deadline: "This week" },
    ],
    decisions: [
      "Ship mobile app on Oct 24 with limited beta cohort",
      "Adopt weekly async status updates instead of Monday standup",
      "Pause the legacy dashboard project for one quarter",
    ],
    risks: [
      "Design capacity may slip if hiring is delayed past September",
      "Pending legal review on new data-sharing terms",
      "Unclear owner for post-launch support rotation",
    ],
  };
}

export type PlannerInput = {
  title: string;
  deadline: string; // ISO or free text
  priority: "High" | "Medium" | "Low";
  duration: number; // minutes
};

export type Quadrant = "do" | "schedule" | "delegate" | "eliminate";

export type PrioritizedTask = PlannerInput & {
  quadrant: Quadrant;
  rationale: string;
};

export type ScheduleBlock = {
  time: string;
  task: string;
  duration: number;
  priority: PlannerInput["priority"];
};

export type PlannerResult = {
  prioritized: PrioritizedTask[];
  focusOrder: string[];
  schedule: ScheduleBlock[];
  risks: string[];
};

/*
 * TASK PLANNER PROMPT:
 * Role: Productivity coach applying the Eisenhower Matrix.
 * Rules: Classify each task into do / schedule / delegate / eliminate based
 *   on urgency (deadline proximity) and importance (priority).
 * Scheduling: Build a realistic same-day timeline starting 9:00, insert
 *   focus blocks, break after 90-min stretches, defer low-priority items.
 * Output: JSON matching PlannerResult.
 */
export async function mockPlanTasks(tasks: PlannerInput[]): Promise<PlannerResult> {
  await delay(1200);
  const urgent = (d: string) => /today|tomorrow|tmr|1d|mon|tue|wed/i.test(d);
  const prioritized: PrioritizedTask[] = tasks.map((t) => {
    const u = urgent(t.deadline);
    const i = t.priority === "High";
    let quadrant: Quadrant = "schedule";
    let rationale = "Important but not urgent — schedule deep-work time.";
    if (u && i) {
      quadrant = "do";
      rationale = "Urgent and important — tackle first, protect from interruptions.";
    } else if (!u && i) {
      quadrant = "schedule";
      rationale = "High impact, later deadline — reserve a calendar block.";
    } else if (u && !i) {
      quadrant = "delegate";
      rationale = "Urgent but low leverage — delegate or batch quickly.";
    } else {
      quadrant = "eliminate";
      rationale = "Low urgency and low impact — drop or defer to next week.";
    }
    return { ...t, quadrant, rationale };
  });

  const order = [...prioritized].sort((a, b) => {
    const rank: Record<Quadrant, number> = { do: 0, schedule: 1, delegate: 2, eliminate: 3 };
    return rank[a.quadrant] - rank[b.quadrant];
  });

  let minute = 9 * 60;
  const schedule: ScheduleBlock[] = order
    .filter((t) => t.quadrant !== "eliminate")
    .map((t) => {
      const h = Math.floor(minute / 60);
      const m = minute % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      minute += t.duration + 10; // small buffer
      return { time, task: t.title, duration: t.duration, priority: t.priority };
    });

  const risks = prioritized
    .filter((t) => t.quadrant === "do")
    .map((t) => `${t.title} — deadline "${t.deadline}" leaves little buffer for review.`);

  return {
    prioritized,
    focusOrder: order.map((t) => t.title),
    schedule,
    risks: risks.length ? risks : ["No high-risk deadlines detected today."],
  };
}

/*
 * CHAT ASSISTANT PROMPT:
 * Role: Professional workplace assistant. Neutral tone, concise, actionable.
 * Style: Prefer short paragraphs and bullet lists. No filler.
 */
const CANNED: { match: RegExp; reply: string }[] = [
  {
    match: /summar/i,
    reply:
      "Here's a tight summary you can drop into an update:\n\n• Main point in one sentence.\n• Two supporting details that changed since last week.\n• One decision needed from the reader.\n\nWant me to tighten the tone or shorten it further?",
  },
  {
    match: /reply|respond|email/i,
    reply:
      "Draft reply:\n\nHi [Name],\n\nThanks for the note. Confirming we'll move ahead with the proposed timeline and share a revised draft by Thursday. Happy to jump on a quick call if helpful.\n\nBest,\nAlex",
  },
  {
    match: /report|improve|rewrite/i,
    reply:
      "A few quick lifts:\n\n• Lead with the outcome, not the process.\n• Convert three sentences into a bulleted list.\n• Cut hedging language (\"we think\", \"perhaps\").\n\nPaste the section you'd like me to rewrite.",
  },
  {
    match: /agenda|meeting/i,
    reply:
      "Suggested 30-min agenda:\n\n1. Context & goal (3 min)\n2. Progress since last sync (7 min)\n3. Open decisions (10 min)\n4. Risks & owners (7 min)\n5. Next steps recap (3 min)",
  },
  {
    match: /project|update|status/i,
    reply:
      "Here's a clean status framing:\n\n• Status: On track / At risk / Off track\n• What shipped this week\n• What's next (with owner + date)\n• Blockers needing help",
  },
];

export async function mockChat(message: string): Promise<string> {
  await delay(700 + Math.random() * 600);
  const hit = CANNED.find((c) => c.match.test(message));
  if (hit) return hit.reply;
  return `Got it. Here's how I'd approach "${message.slice(0, 80)}":\n\n• Clarify the desired outcome in one sentence.\n• List the two or three constraints that matter most.\n• Draft a first pass, then tighten for tone and length.\n\nShare more context and I'll refine the response.`;
}
