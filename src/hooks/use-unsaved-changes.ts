import { useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";

/**
 * Warn on tab close and block in-app navigation when there are unsaved changes.
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useBlocker({
    shouldBlockFn: () => {
      if (!dirty) return false;
      return !window.confirm(
        "You have unsaved changes. Leave this page and lose them?",
      );
    },
    enableBeforeUnload: false,
  });
}
