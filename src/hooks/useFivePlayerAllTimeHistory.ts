import { useEffect, useMemo, useState } from "react";
import { FPEvening } from "@/types/fivePlayerTypes";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { StorageService } from "@/services/storageService";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "ikbywydyidnkohbdrqdk";

interface UseFivePlayerAllTimeHistoryOptions {
  currentEvening: FPEvening;
  shareCode: string;
}

function isCompletedFivePlayerEvening(evening: FPEvening): boolean {
  return (
    evening.mode === "five-player-doubles" &&
    evening.completed === true &&
    evening.schedule.some((match) => match.completed)
  );
}

function mergeCompletedHistorySets(...sets: FPEvening[][]): FPEvening[] {
  const eveningsById = new Map<string, FPEvening>();

  for (const set of sets) {
    for (const evening of set) {
      if (isCompletedFivePlayerEvening(evening)) {
        eveningsById.set(evening.id, evening);
      }
    }
  }

  return Array.from(eveningsById.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

async function fetchRemoteHistory(shareCode: string): Promise<FPEvening[]> {
  try {
    const response = await fetch(
      `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-fp-history?code=${encodeURIComponent(shareCode)}`
    );

    if (!response.ok) {
      return [];
    }

    const json = await response.json();
    return Array.isArray(json?.history) ? (json.history as FPEvening[]) : [];
  } catch {
    return [];
  }
}

async function syncLocalCompletedHistory(localHistory: FPEvening[]): Promise<void> {
  await Promise.all(
    localHistory.map((evening) =>
      RemoteStorageService.upsertEveningLiveWithTeam(evening as any, null).catch(() => undefined)
    )
  );
}

export function useFivePlayerAllTimeHistory({
  currentEvening,
  shareCode,
}: UseFivePlayerAllTimeHistoryOptions) {
  const [remoteHistory, setRemoteHistory] = useState<FPEvening[]>([]);

  const localHistory = useMemo(
    () =>
      mergeCompletedHistorySets(StorageService.loadFPEvenings()).filter(
        (evening) => evening.id !== currentEvening.id
      ),
    [currentEvening.id]
  );

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      await syncLocalCompletedHistory(localHistory);
      const remote = await fetchRemoteHistory(shareCode);

      if (!cancelled) {
        setRemoteHistory(
          mergeCompletedHistorySets(remote).filter(
            (evening) => evening.id !== currentEvening.id
          )
        );
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [currentEvening.id, localHistory, shareCode]);

  const history = useMemo(
    () => mergeCompletedHistorySets(remoteHistory, localHistory),
    [remoteHistory, localHistory]
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    console.info("[5-player all-time dataset]", {
      shareCode,
      localCompletedCount: localHistory.length,
      remoteCompletedCount: remoteHistory.length,
      mergedHistoricalCount: history.length,
      currentTournamentId: currentEvening.id,
      statsAndInsightsUseSameHistory: true,
    });
  }, [currentEvening.id, history.length, localHistory.length, remoteHistory.length, shareCode]);

  return { history };
}
