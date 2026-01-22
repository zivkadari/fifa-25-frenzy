import { useEffect, useMemo, useRef } from "react";
import type { Evening } from "@/types/tournament";
import { StorageService } from "@/services/storageService";

type Params = {
  currentEvening: Evening | null;
  /** debounce for local persistence to avoid excessive writes */
  debounceMs?: number;
};

export function useActiveEveningPersistence({ currentEvening, debounceMs = 600 }: Params) {
  const persistTimer = useRef<number | null>(null);

  const isInProgress = useMemo(() => {
    return !!currentEvening && !currentEvening.completed;
  }, [currentEvening]);

  const persistNow = (evening?: Evening | null) => {
    const e = evening ?? currentEvening;
    if (!e) return;
    // Only persist in-progress tournaments
    if (e.completed) {
      StorageService.clearActiveEvening();
      return;
    }
    StorageService.saveActiveEvening(e);
  };

  const clearActive = () => {
    StorageService.clearActiveEvening();
  };

  // Debounced persistence on changes
  useEffect(() => {
    if (!currentEvening) return;

    // Clear if completed so we don't auto-resume finished tournaments
    if (currentEvening.completed) {
      StorageService.clearActiveEvening();
      return;
    }

    if (persistTimer.current) {
      window.clearTimeout(persistTimer.current);
    }
    persistTimer.current = window.setTimeout(() => {
      StorageService.saveActiveEvening(currentEvening);
    }, debounceMs);

    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, [currentEvening, debounceMs]);

  // Persist immediately when app goes to background / is being discarded
  useEffect(() => {
    if (!isInProgress) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") persistNow();
    };
    const onPageHide = () => persistNow();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInProgress]);

  return { persistNow, clearActive };
}
