import { supabase } from "@/integrations/supabase/client";

export type Kind = "meeting_note" | "task_plan" | "chat";

export type SavedItem = {
  id: string;
  user_id: string;
  kind: Kind;
  title: string;
  data: unknown;
  created_at: string;
  updated_at: string;
};

// ---------- Cloud (authenticated) ----------

export async function fetchItem(id: string): Promise<SavedItem | null> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as SavedItem | null) ?? null;
}

export async function listItems(): Promise<SavedItem[]> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("id, kind, title, data, created_at, updated_at, user_id")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedItem[];
}

export async function upsertItem(input: {
  id?: string;
  user_id: string;
  kind: Kind;
  title: string;
  data: unknown;
}): Promise<SavedItem> {
  const payload = {
    user_id: input.user_id,
    kind: input.kind,
    title: (input.title || "Untitled").slice(0, 200),
    data: input.data as never,
  };
  if (input.id) {
    const { data, error } = await supabase
      .from("saved_items")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single();
    if (error) throw error;
    return data as SavedItem;
  }
  const { data, error } = await supabase
    .from("saved_items")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as SavedItem;
}

export async function renameItem(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("saved_items")
    .update({ title: title.slice(0, 200) || "Untitled" })
    .eq("id", id);
  if (error) throw error;
}

export async function duplicateItem(id: string): Promise<SavedItem> {
  const original = await fetchItem(id);
  if (!original) throw new Error("Item not found");
  const { data, error } = await supabase
    .from("saved_items")
    .insert({
      user_id: original.user_id,
      kind: original.kind,
      title: `${original.title} (copy)`.slice(0, 200),
      data: original.data as never,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SavedItem;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("saved_items").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Local (guest) drafts ----------

const draftKey = (kind: Kind) => `momentum_draft_${kind}`;

export function saveDraft(kind: Kind, data: unknown) {
  try {
    localStorage.setItem(draftKey(kind), JSON.stringify(data));
  } catch {}
}
export function loadDraft<T>(kind: Kind): T | null {
  try {
    const raw = localStorage.getItem(draftKey(kind));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
export function clearDraft(kind: Kind) {
  try {
    localStorage.removeItem(draftKey(kind));
  } catch {}
}

// ---------- Formatting ----------

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(iso);
}
