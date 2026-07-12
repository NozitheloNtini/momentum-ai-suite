import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Verifying — Momentum AI" }],
  }),
  component: AuthCallback,
});

type State =
  | { kind: "loading" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

function parseHash(): Record<string, string> {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  const params = new URLSearchParams(hash);
  const out: Record<string, string> = {};
  params.forEach((v, k) => (out[k] = v));
  return out;
}

function AuthCallback() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = parseHash();

      if (params.error || params.error_code) {
        const code = params.error_code || params.error;
        const desc = decodeURIComponent(params.error_description || "").replace(/\+/g, " ");
        const friendly =
          code === "otp_expired"
            ? "This verification link has expired or was already used. Please sign in — if the account was created, you're all set."
            : desc || "Verification failed.";
        if (!cancelled) setState({ kind: "error", message: friendly });
        // Clean the hash so refresh doesn't re-trigger the error.
        history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Supabase auto-consumes access_token/refresh_token from the hash
      // (detectSessionInUrl). Give it a moment then check session.
      await new Promise((r) => setTimeout(r, 150));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      history.replaceState(null, "", window.location.pathname);
      if (data.session) {
        setState({ kind: "ok", message: "Email verified. Redirecting…" });
        setTimeout(() => navigate({ to: "/dashboard", replace: true }), 800);
      } else {
        // No error and no session — likely already-verified link. Send to sign in.
        setState({
          kind: "ok",
          message: "You're verified. Please sign in to continue.",
        });
        setTimeout(() => navigate({ to: "/auth", replace: true }), 1200);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft">
        {state.kind === "loading" && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Verifying your email…
          </div>
        )}
        {state.kind === "ok" && (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <div className="font-medium">All set</div>
              <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
            </div>
          </div>
        )}
        {state.kind === "error" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-destructive">Verification issue</div>
                <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
              </div>
            </div>
            <Button onClick={() => navigate({ to: "/auth" })} className="w-full">
              Go to sign in
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
