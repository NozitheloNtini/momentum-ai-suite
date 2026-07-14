import { Check, Loader2, CloudOff, Cloud } from "lucide-react";
import type { SaveState } from "@/hooks/use-autosave";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SaveStatus({ state }: { state: SaveState }) {
  if (state.kind === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
      </span>
    );
  }
  if (state.kind === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-success" /> Saved · {formatTime(state.at)}
      </span>
    );
  }
  if (state.kind === "error") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-destructive"
        title={state.message}
      >
        <CloudOff className="h-3.5 w-3.5" /> Couldn't save
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
      <Cloud className="h-3.5 w-3.5" /> Draft
    </span>
  );
}
