import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: IndexGate,
});

function IndexGate() {
  const { mode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "loading") return;
    if (mode === "authenticated" || mode === "guest") {
      navigate({ to: "/dashboard", replace: true });
    } else {
      navigate({ to: "/landing", replace: true });
    }
  }, [mode, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
