import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

class AIUnavailableError extends Error {
  code: "no_key" | "rate_limit" | "credits" | "upstream";
  constructor(code: AIUnavailableError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callGatewayOnce(messages: ChatMessage[], json: boolean, key: string): Promise<Response> {
  return fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
}

async function callGateway(messages: ChatMessage[], json = false): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    throw new AIUnavailableError(
      "no_key",
      "AI service unavailable. Connect an OpenAI-compatible model to enable AI-generated responses.",
    );
  }
  // Single retry on transient upstream/network failures.
  let res: Response | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await callGatewayOnce(messages, json, key);
      if (res.status < 500 || res.status === 402 || res.status === 429) break;
    } catch (e) {
      lastErr = e;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
  }
  if (!res) {
    throw new AIUnavailableError(
      "upstream",
      lastErr instanceof Error ? `Network error: ${lastErr.message}` : "Network error contacting AI.",
    );
  }
  if (res.status === 429) {
    throw new AIUnavailableError("rate_limit", "AI is rate limited. Please try again in a moment.");
  }
  if (res.status === 402) {
    throw new AIUnavailableError(
      "credits",
      "AI credits exhausted. Add credits in your workspace billing settings.",
    );
  }
  if (!res.ok) {
    throw new AIUnavailableError(
      "upstream",
      "AI service is temporarily unavailable. Please try again.",
    );
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIUnavailableError("upstream", "No response from AI.");
  }
  return content;
}

function extractJson(raw: string): unknown {
  let cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  // eslint-disable-next-line no-control-regex
  cleaned = cleaned.replace(/^\uFEFF/, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  const tryParse = (s: string): unknown => {
    try {
      return JSON.parse(s);
    } catch {
      return JSON.parse(s.replace(/,(\s*[}\]])/g, "$1"));
    }
  };
  try {
    return tryParse(cleaned);
  } catch {
    const firstObj = cleaned.indexOf("{");
    const firstArr = cleaned.indexOf("[");
    const start =
      firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
    if (start < 0) throw new Error("Model returned invalid JSON");
    const closeChar = cleaned[start] === "{" ? "}" : "]";
    const end = cleaned.lastIndexOf(closeChar);
    if (end <= start) throw new Error("Model returned invalid JSON");
    return tryParse(cleaned.slice(start, end + 1));
  }
}

async function callAndParse<T>(
  messages: ChatMessage[],
  parse: (raw: string) => T,
): Promise<T> {
  const raw = await callGateway(messages, true);
  try {
    return parse(raw);
  } catch (err) {
    console.warn("AI JSON parse failed, retrying once", err);
    const raw2 = await callGateway(
      [
        ...messages,
        {
          role: "system",
          content:
            "Your previous reply was not valid JSON. Reply again with ONLY the JSON object, no prose, no markdown code fences.",
        },
      ],
      true,
    );
    try {
      return parse(raw2);
    } catch (err2) {
      console.error("AI JSON parse failed after retry", err2);
      throw new AIUnavailableError(
        "upstream",
        "The AI returned a response we couldn't read. Please try again.",
      );
    }
  }
}

// ---------- Meeting summary ----------

const MeetingSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  participants: z.array(z.object({ name: z.string(), role: z.string() })),
  objective: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      deadline: z.string(),
    }),
  ),
  risks: z.array(z.string()),
  nextMeeting: z.string(),
});

export type MeetingSummary = z.infer<typeof MeetingSchema>;

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ title: z.string().optional(), notes: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const system = `You are a professional meeting analyst. Analyze ONLY the transcript provided.
Rules:
- Never invent participants, companies, projects, deadlines, tasks, dates, or decisions.
- If a section is not covered in the transcript, use the exact string "Not mentioned in the transcript." for text fields, or an empty array for lists.
- Only assign action items to people actually named in the transcript.
- Priority must be one of: High, Medium, Low. Infer only if clearly implied; otherwise use Medium.
Return STRICT JSON with this shape:
{
  "title": string,
  "executiveSummary": string,
  "participants": [{"name": string, "role": string}],
  "objective": string,
  "keyPoints": [string],
  "decisions": [string],
  "actionItems": [{"task": string, "owner": string, "priority": "High"|"Medium"|"Low", "deadline": string}],
  "risks": [string],
  "nextMeeting": string
}
Return only the JSON object, no prose.`;
    const user = `Meeting title (may be empty, infer from transcript if so): ${data.title ?? ""}

Transcript:
"""
${data.notes}
"""`;
    const raw = await callGateway(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      true,
    );
    const parsed = MeetingSchema.parse(extractJson(raw));
    if (!parsed.title || parsed.title === "Not mentioned in the transcript.") {
      parsed.title = data.title || "Untitled meeting";
    }
    return parsed;
  });

// ---------- Task planner ----------

const PlannerInputSchema = z.object({
  title: z.string(),
  deadline: z.string(),
  priority: z.enum(["High", "Medium", "Low"]),
  duration: z.number(),
});

const PlannerResultSchema = z.object({
  prioritized: z.array(
    PlannerInputSchema.extend({
      quadrant: z.enum(["do", "schedule", "delegate", "eliminate"]),
      rationale: z.string(),
    }),
  ),
  focusOrder: z.array(z.string()),
  schedule: z.array(
    z.object({
      time: z.string(),
      task: z.string(),
      duration: z.number(),
      priority: z.enum(["High", "Medium", "Low"]),
    }),
  ),
  risks: z.array(z.string()),
});

export type PlannerInput = z.infer<typeof PlannerInputSchema>;
export type PlannerResult = z.infer<typeof PlannerResultSchema>;
export type Quadrant = PlannerResult["prioritized"][number]["quadrant"];

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ tasks: z.array(PlannerInputSchema).min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const system = `You are a productivity coach that applies the Eisenhower Matrix.
Rules:
- Classify EACH task into one of: "do" (urgent+important), "schedule" (important, not urgent), "delegate" (urgent, not important), "eliminate" (neither).
- Base classification on the user's provided deadline and priority. Never invent tasks.
- Build a realistic same-day schedule starting at 09:00 using each task's duration (minutes) plus small buffers, excluding "eliminate" items. Times in HH:MM 24h.
- focusOrder: task titles in the order the user should tackle them.
- risks: short notes about deadlines that leave little buffer. If none, return an empty array.
Return STRICT JSON only:
{
  "prioritized": [{"title": string, "deadline": string, "priority": "High"|"Medium"|"Low", "duration": number, "quadrant": "do"|"schedule"|"delegate"|"eliminate", "rationale": string}],
  "focusOrder": [string],
  "schedule": [{"time": string, "task": string, "duration": number, "priority": "High"|"Medium"|"Low"}],
  "risks": [string]
}`;
    const user = `Tasks (JSON):\n${JSON.stringify(data.tasks, null, 2)}`;
    const raw = await callGateway(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      true,
    );
    return PlannerResultSchema.parse(extractJson(raw));
  });

// ---------- Chat ----------

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ history: z.array(ChatMessageSchema).min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const system = `You are Momentum AI, a professional workplace productivity assistant.
Respond to the user's most recent message using the full conversation as context.
Guidelines:
- Be concise, professional, context-aware, and well-formatted (short paragraphs, bullet lists when helpful).
- Support tasks: draft emails, reply to emails, rewrite text professionally, summarize documents, create meeting agendas, explain workplace concepts, improve reports, brainstorm ideas, general workplace communication.
- Never reuse generic sample replies. Every response must be tailored to the user's actual input.
- If the user's request is unclear, ask a brief clarifying question.`;
    const reply = await callGateway([
      { role: "system", content: system },
      ...data.history,
    ]);
    return { reply };
  });
