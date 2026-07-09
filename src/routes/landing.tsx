import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, FileText, ListChecks, MessageSquare, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Momentum AI — Get hours back every week" },
      {
        name: "description",
        content:
          "An AI workplace assistant that summarizes meetings, plans your day, and drafts your writing. Try it free as a guest — no signup required.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { mode, enterGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "authenticated" || mode === "guest") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [mode, navigate]);

  const goGuest = () => {
    enterGuest();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,theme(colors.primary/12%),transparent_70%)]" />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Momentum AI</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-16 pt-8 text-center md:pt-16">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Zap className="h-3 w-3" /> New — Guest mode, no signup needed
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          Your AI workplace assistant.
          <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Save two hours a day.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          Summarize meetings, plan your day with AI, and draft workplace writing in one polished
          workspace. Try everything as a guest, or create an account to save your work.
        </p>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={goGuest}>
            Continue as Guest <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="flex-1" asChild>
            <Link to="/auth">Sign In / Create Account</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Guest data stays on this device and is cleared when you sign out.
        </p>

        <div className="mt-16 grid w-full gap-4 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "Meeting Summarizer",
              desc: "Paste raw notes, get an executive recap with action items.",
            },
            {
              icon: ListChecks,
              title: "AI Task Planner",
              desc: "Prioritize with the Eisenhower Matrix and time-block your day.",
            },
            {
              icon: MessageSquare,
              title: "Workplace Assistant",
              desc: "Draft replies, tighten reports, and prep agendas in seconds.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-soft"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
