import { useEffect, useRef, useState, useCallback } from "react";

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string };

/**
 * Debounced autosave. Calls `save()` after the user has stopped changing
 * `value` for `delayMs`, and also on tab-hide / beforeunload so nothing is lost.
 * Only fires when `enabled` is true and the value actually changed.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<{ savedAt: string } | void>,
  opts: { enabled: boolean; delayMs?: number; serialize?: (v: T) => string } = { enabled: true },
) {
  const { enabled, delayMs = 1500, serialize = (v) => JSON.stringify(v) } = opts;
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialized = useRef<string | null>(null);
  const inflight = useRef(false);
  const pendingValue = useRef<T>(value);
  pendingValue.current = value;

  const runSave = useCallback(async () => {
    if (!enabled) return;
    const serialized = serialize(pendingValue.current);
    if (serialized === lastSerialized.current) return;
    if (inflight.current) return;
    inflight.current = true;
    setState({ kind: "saving" });
    try {
      const res = await save(pendingValue.current);
      lastSerialized.current = serialized;
      setState({ kind: "saved", at: res?.savedAt ?? new Date().toISOString() });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "Autosave failed",
      });
    } finally {
      inflight.current = false;
      // If value changed while saving, queue another pass.
      if (serialize(pendingValue.current) !== lastSerialized.current) {
        scheduleSave();
      }
    }
  }, [enabled, save, serialize]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSave, delayMs);
  }, [runSave, delayMs]);

  // Debounced trigger on value change.
  useEffect(() => {
    if (!enabled) return;
    if (lastSerialized.current === null) {
      // First mount: capture baseline so we don't save immediately on load.
      lastSerialized.current = serialize(value);
      return;
    }
    if (serialize(value) === lastSerialized.current) return;
    scheduleSave();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, scheduleSave, serialize]);

  // Flush on tab-hide / navigate-away.
  useEffect(() => {
    if (!enabled) return;
    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Fire-and-forget; browser won't wait but the local draft path still writes.
      void runSave();
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [enabled, runSave]);

  // Only warn on unload if autosave has failed (offline / API down).
  useEffect(() => {
    if (state.kind !== "error") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.kind]);

  const flushNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await runSave();
  }, [runSave]);

  const markSaved = useCallback((at: string) => {
    lastSerialized.current = serialize(pendingValue.current);
    setState({ kind: "saved", at });
  }, [serialize]);

  return { state, flushNow, markSaved };
}
