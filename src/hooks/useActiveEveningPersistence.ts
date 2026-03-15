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

  // Always keep the latest evening in a ref so event handlers never use stale data
  const latestEveningRef = useRef<Evening | null>(currentEvening);
  useEffect(() => {
    latestEveningRef.current = currentEvening;
  }, [currentEvening]);

  const isInProgress = useMemo(() => {
    return !!currentEvening && !currentEvening.completed;
  }, [currentEvening]);

  const persistNow = (override?: Evening | null) => {
    const e = override ?? latestEveningRef.current;
    if (!e) return;
    // Also update the ref so subsequent calls (e.g. pagehide) use this version
    if (override) latestEveningRef.current = override;
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

    if (currentEvening.completed) {
      StorageService.clearActiveEvening();
      return;
    }

    if (persistTimer.current) {
      window.clearTimeout(persistTimer.current);
    }
    persistTimer.current = window.setTimeout(() => {
      // Use ref to persist the absolute latest state
      const latest = latestEveningRef.current;
      if (latest && !latest.completed) {
        StorageService.saveActiveEvening(latest);
      }
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
    // persistNow is stable (reads from ref), so no extra deps needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInProgress]);

  return { persistNow, clearActive };
}
