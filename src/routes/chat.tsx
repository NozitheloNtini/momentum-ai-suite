import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Send, Sparkles, Trash2, User, AlertTriangle, Save, Check } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Disclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatReply } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth-context";
import {
  upsertItem,
  fetchItem,
  saveDraft,
  loadDraft,
  clearDraft,
} from "@/lib/persistence";
import { GuestSaveDialog } from "@/components/guest-save-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/chat")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "AI Workplace Assistant — Momentum AI" },
      {
        name: "description",
        content:
          "Chat with Momentum AI to summarize emails, draft replies, improve reports, and prep meeting agendas.",
      },
    ],
  }),
  component: Chat,
});

type Msg = { id: string; role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Draft a follow-up email to a client about a delayed deliverable",
  "Rewrite this sentence more professionally: ...",
  "Create a 30-minute agenda for a product kickoff",
  "Summarize the key points of this document: ...",
  "Explain OKRs vs KPIs in simple terms",
];

const GREETING: Msg = {
  id: "welcome",
  role: "assistant",
  text: "Hi — I'm your workplace assistant. Paste an email, a document, a question, or a rough draft, and I'll help you handle it.",
};

function Chat() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | undefined>(id);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useUnsavedChanges(dirty);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (id && isAuthenticated) {
        try {
          const item = await fetchItem(id);
          if (!item || cancelled) return;
          const d = item.data as { messages: Msg[] };
          setMessages(d?.messages?.length ? d.messages : [GREETING]);
          setSavingId(item.id);
          setSavedAt(item.updated_at);
          setDirty(false);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to load");
        }
        return;
      }
      if (!id) {
        const d = loadDraft<{ messages: Msg[] }>("chat");
        if (d?.messages?.length && !cancelled) setMessages(d.messages);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!savingId) saveDraft("chat", { messages });
  }, [messages, savingId]);

  const titleFromMessages = (msgs: Msg[]) => {
    const firstUser = msgs.find((m) => m.role === "user");
    if (!firstUser) return "New chat";
    return firstUser.text.slice(0, 60);
  };

  const persist = async (msgs: Msg[]) => {
    if (!user) return;
    try {
      const item = await upsertItem({
        id: savingId,
        user_id: user.id,
        kind: "chat",
        title: titleFromMessages(msgs),
        data: { messages: msgs },
      });
      setSavingId(item.id);
      setSavedAt(item.updated_at);
      setDirty(false);
      clearDraft("chat");
      if (!id) navigate({ to: "/chat", search: { id: item.id }, replace: true });
    } catch (e) {
      console.error(e);
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setTyping(true);
    setError(null);
    setDirty(true);
    try {
      const history = nextMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.text }));
      const { reply } = await chatReply({ data: { history } });
      const finalMessages = [
        ...nextMessages,
        { id: crypto.randomUUID(), role: "assistant" as const, text: reply },
      ];
      setMessages(finalMessages);
      if (isAuthenticated) await persist(finalMessages);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "AI service unavailable. Connect an OpenAI-compatible model to enable AI-generated responses.";
      setError(msg);
      toast.error(msg);
    } finally {
      setTyping(false);
    }
  };

  const clear = () => {
    if (dirty && !window.confirm("Discard this conversation?")) return;
    setMessages([GREETING]);
    setError(null);
    setDirty(false);
    setSavingId(undefined);
    clearDraft("chat");
    navigate({ to: "/chat", search: {}, replace: true });
  };

  const onSave = async () => {
    if (!isAuthenticated) {
      setGuestOpen(true);
      return;
    }
    await persist(messages);
    toast.success("Saved to your library");
  };

  return (
    <>
      <TopBar
        title="AI Workplace Assistant"
        subtitle={
          savedAt
            ? `Saved · last edited ${new Date(savedAt).toLocaleString()}`
            : "Draft, summarize, and refine — instantly"
        }
      />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Disclaimer className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={messages.length <= 1 || (!!savingId && !dirty)}
          >
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
          <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">
            <Trash2 className="mr-1.5 h-4 w-4" /> New
          </Button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-soft"
          style={{ minHeight: 400 }}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
            {typing && <Typing />}
            {error && !typing && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-soft transition hover:border-primary/40 hover:bg-primary/5"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:border-primary/40"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask Momentum anything about your work…"
            className="min-h-11 max-h-40 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            autoFocus
          />
          <Button type="submit" size="icon" disabled={!input.trim() || typing}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      <GuestSaveDialog
        open={guestOpen}
        onOpenChange={setGuestOpen}
        feature="this conversation"
      />
    </>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-primary/80 to-primary/60 text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/80 to-primary/60 text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-secondary px-4 py-3">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
