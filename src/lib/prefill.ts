// One-shot prefill handoff between tools (e.g. Chat → Task Planner).
// Uses sessionStorage so it survives navigation but doesn't clutter URLs.

const KEYS = {
  task: "momentum_prefill_task",
  note: "momentum_prefill_note",
  chat: "momentum_prefill_chat",
} as const;

export type TaskPrefill = { title: string; description?: string };
export type NotePrefill = { title?: string; notes: string };
export type ChatPrefill = { input: string; autoSend?: boolean };

export function setTaskPrefill(p: TaskPrefill) {
  try {
    sessionStorage.setItem(KEYS.task, JSON.stringify(p));
  } catch {}
}
export function consumeTaskPrefill(): TaskPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEYS.task);
    if (!raw) return null;
    sessionStorage.removeItem(KEYS.task);
    return JSON.parse(raw) as TaskPrefill;
  } catch {
    return null;
  }
}

export function setNotePrefill(p: NotePrefill) {
  try {
    sessionStorage.setItem(KEYS.note, JSON.stringify(p));
  } catch {}
}
export function consumeNotePrefill(): NotePrefill | null {
  try {
    const raw = sessionStorage.getItem(KEYS.note);
    if (!raw) return null;
    sessionStorage.removeItem(KEYS.note);
    return JSON.parse(raw) as NotePrefill;
  } catch {
    return null;
  }
}

export function setChatPrefill(p: ChatPrefill) {
  try {
    sessionStorage.setItem(KEYS.chat, JSON.stringify(p));
  } catch {}
}
export function consumeChatPrefill(): ChatPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEYS.chat);
    if (!raw) return null;
    sessionStorage.removeItem(KEYS.chat);
    return JSON.parse(raw) as ChatPrefill;
  } catch {
    return null;
  }
}
