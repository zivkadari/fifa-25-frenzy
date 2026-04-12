import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock, Timer } from "lucide-react";
import { FPEvening } from "@/types/fivePlayerTypes";

interface FPTimingCardProps {
  evening: FPEvening;
  allHistory?: FPEvening[];
  /** When true, includes the match progress bar inside the card */
  showProgress?: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דק׳`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} שע׳ ${m} דק׳` : `${h} שע׳`;
}

function formatDurationFromMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function estimateFinish(
  evening: FPEvening,
  allHistory: FPEvening[]
): { estimatedFinish: string; remainingMinutes: number } | null {
  if (!evening.startedAt || evening.completed) return null;

  const completedCount = evening.schedule.filter((m) => m.completed).length;
  const totalMatches = evening.schedule.length;
  const remaining = totalMatches - completedCount;
  if (remaining <= 0) return null;

  const matchCount = evening.matchCount || 30;

  const withTiming = allHistory.filter(
    (e) => e.completed && e.startedAt && e.completedAt && e.durationMinutes && e.durationMinutes > 0
  );

  const sameLengthTimed = withTiming.filter((e) => (e.matchCount || 30) === matchCount);
  const pool = sameLengthTimed.length >= 2 ? sameLengthTimed : withTiming;

  if (pool.length === 0) return null;

  const avgMinPerMatch =
    pool.reduce((sum, e) => sum + e.durationMinutes! / (e.matchCount || 30), 0) / pool.length;

  const remainingMinutes = Math.round(remaining * avgMinPerMatch);
  const now = new Date();
  const estimatedFinish = new Date(now.getTime() + remainingMinutes * 60000).toISOString();

  return { estimatedFinish, remainingMinutes };
}

export function FPTimingCard({ evening, allHistory = [], showProgress = false }: FPTimingCardProps) {
  const [now, setNow] = useState(Date.now());

  const isActive = !evening.completed && !!evening.startedAt;

  // Tick every second for active tournaments
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const completedCount = evening.schedule.filter((m) => m.completed).length;
  const totalMatches = evening.schedule.length;
  const progressPct = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0;

  // ── Completed tournament ──
  if (evening.completed && evening.startedAt && evening.completedAt) {
    const dur = evening.durationMinutes ||
      Math.round((new Date(evening.completedAt).getTime() - new Date(evening.startedAt).getTime()) / 60000);
    if (dur <= 0) return null;

    return (
      <Card className="bg-gaming-surface/50 border-border/50 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">זמני הליגה</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-muted-foreground">התחלה</p>
            <p className="font-medium text-foreground">{formatTime(evening.startedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">סיום</p>
            <p className="font-medium text-foreground">{formatTime(evening.completedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">משך</p>
            <p className="font-medium text-neon-green">{formatDuration(dur)}</p>
          </div>
        </div>
        {showProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>הליגה הסתיימה!</span>
              <span>{completedCount}/{totalMatches} הושלמו</span>
            </div>
            <div className="w-full bg-gaming-surface rounded-full h-1.5">
              <div className="bg-neon-green rounded-full h-1.5 w-full" />
            </div>
          </div>
        )}
      </Card>
    );
  }

  // ── Active tournament ──
  if (isActive) {
    const elapsedMs = now - new Date(evening.startedAt!).getTime();
    const estimate = estimateFinish(evening, allHistory);

    return (
      <Card className="bg-gaming-surface/50 border-border/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-3.5 w-3.5 text-neon-green animate-pulse" />
            <span className="text-xs font-medium text-foreground">זמנים</span>
          </div>
          <span className="text-xs font-mono font-bold text-neon-green tabular-nums">
            {formatDurationFromMs(elapsedMs)}
          </span>
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">התחלה</span>
            <span className="text-foreground font-medium">{formatTime(evening.startedAt!)}</span>
          </div>
          {estimate ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">סיום משוער</span>
                <span className="text-foreground font-medium">{formatTime(estimate.estimatedFinish)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">זמן שנותר</span>
                <span className="text-neon-green font-medium">≈ {formatDuration(estimate.remainingMinutes)}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-[10px]">
              אין מספיק היסטוריית זמנים להערכת סיום
            </p>
          )}
        </div>

        {showProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>משחק {completedCount + 1} מתוך {totalMatches}</span>
              <span>{completedCount}/{totalMatches} הושלמו</span>
            </div>
            <div className="w-full bg-gaming-surface rounded-full h-1.5">
              <div
                className="bg-neon-green rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    );
  }

  return null;
}

export { formatTime, formatDuration };
