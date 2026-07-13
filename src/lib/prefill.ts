// One-shot prefill handoff between tools (e.g. Chat → Task Planner).
// Uses sessionStorage so it survives navigation but doesn't clutter URLs.

const KEYS = {
  task: "momentum_prefill_task",
  note: "momentum_prefill_note",
} as const;

export type TaskPrefill = { title: string; description?: string };
export type NotePrefill = { title?: string; notes: string };

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
