import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, User } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Disclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockChat } from "@/lib/mock-ai";

export const Route = createFileRoute("/chat")({
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
  "Summarize this email",
  "Write a professional reply",
  "Improve this report",
  "Draft meeting agenda",
  "Explain this project update",
];

const GREETING: Msg = {
  id: "welcome",
  role: "assistant",
  text: "Hi there — I'm your workplace assistant. Ask me to summarize an email, draft a reply, prep an agenda, or tighten a report.",
};

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    try {
      const reply = await mockChat(trimmed);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: reply }]);
    } finally {
      setTyping(false);
    }
  };

  const clear = () => setMessages([GREETING]);

  return (
    <>
      <TopBar title="AI Workplace Assistant" subtitle="Draft, summarize, and refine — instantly" />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Disclaimer className="flex-1" />
          <SaveButton
            kind="chat"
            title={`Chat · ${new Date().toLocaleDateString()}`}
            data={messages}
            featureLabel="this conversation"
            disabled={messages.length <= 1}
          />
          <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">
            <Trash2 className="mr-1.5 h-4 w-4" /> Clear
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
          </div>
        </div>

        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
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
