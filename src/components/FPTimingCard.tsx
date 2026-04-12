import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { FPEvening, FPBlockTiming } from "@/types/fivePlayerTypes";

interface FPTimingCardProps {
  evening: FPEvening;
  allHistory?: FPEvening[];
  /** When true, includes the match progress bar inside the card */
  showProgress?: boolean;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(minutes: number): string {
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

/** Compute block durations from startedAt + block completedAt timestamps */
function computeBlockDurations(startedAt: string, blockTimings: FPBlockTiming[]): { blockIndex: number; completedAt: string; durationMinutes: number }[] {
  const sorted = [...blockTimings].sort((a, b) => a.blockIndex - b.blockIndex);
  return sorted.map((bt, i) => {
    const prevEnd = i === 0 ? startedAt : sorted[i - 1].completedAt;
    const dur = Math.round((new Date(bt.completedAt).getTime() - new Date(prevEnd).getTime()) / 60000);
    return { blockIndex: bt.blockIndex, completedAt: bt.completedAt, durationMinutes: Math.max(0, dur) };
  });
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
  const totalBlocks = matchCount / 5;
  const completedBlocks = Math.floor(completedCount / 5);

  // Try block-level estimation first
  const completedBlockTimings = evening.blockTimings?.filter(bt => bt.completedAt) || [];
  
  if (completedBlocks > 0 && completedBlockTimings.length > 0 && evening.startedAt) {
    // We have real block data for this tournament — use it for more accurate ETA
    const blockDurations = computeBlockDurations(evening.startedAt, completedBlockTimings);
    
    // Also gather historical block durations for remaining blocks
    const histPool = allHistory.filter(
      (e) => e.completed && e.startedAt && e.blockTimings && e.blockTimings.length > 0
    );
    const sameLenPool = histPool.filter(e => (e.matchCount || 30) === matchCount);
    const pool = sameLenPool.length >= 1 ? sameLenPool : histPool;

    const remainingBlocks = totalBlocks - completedBlocks;
    const matchesInPartialBlock = completedCount % 5;
    
    // Average time per block from this tournament's completed blocks
    const avgThisTournament = blockDurations.reduce((s, b) => s + b.durationMinutes, 0) / blockDurations.length;
    
    // Average from history if available
    let avgHistorical = avgThisTournament;
    if (pool.length > 0) {
      const allHistBlockDurs: number[] = [];
      for (const e of pool) {
        if (e.startedAt && e.blockTimings) {
          const durs = computeBlockDurations(e.startedAt, e.blockTimings);
          durs.forEach(d => allHistBlockDurs.push(d.durationMinutes));
        }
      }
      if (allHistBlockDurs.length > 0) {
        avgHistorical = allHistBlockDurs.reduce((s, d) => s + d, 0) / allHistBlockDurs.length;
      }
    }

    // Weighted: prefer current tournament data (70%) vs history (30%)
    const avgBlock = avgThisTournament * 0.7 + avgHistorical * 0.3;
    
    // Estimate: remaining full blocks + fraction of partial block
    const partialBlockFraction = matchesInPartialBlock / 5;
    const remainingMinutes = Math.round((remainingBlocks - partialBlockFraction) * avgBlock + partialBlockFraction * avgBlock);
    
    const now = new Date();
    const estimatedFinish = new Date(now.getTime() + Math.max(0, remainingMinutes) * 60000).toISOString();
    return { estimatedFinish, remainingMinutes: Math.max(0, remainingMinutes) };
  }

  // Fallback: tournament-level average from history
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

/** Expandable block timing details section */
function BlockTimingDetails({ evening }: { evening: FPEvening }) {
  if (!evening.startedAt || !evening.blockTimings || evening.blockTimings.length === 0) return null;

  const blockDurations = computeBlockDurations(evening.startedAt, evening.blockTimings);

  return (
    <div className="space-y-1 pt-1 border-t border-border/30">
      <p className="text-[10px] text-muted-foreground font-medium mb-1">פירוט בלוקים</p>
      {blockDurations.map((b) => (
        <div key={b.blockIndex} className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">בלוק {b.blockIndex + 1}</span>
          <span className="text-foreground">
            {formatTime(b.completedAt)} <span className="text-muted-foreground">({formatDuration(b.durationMinutes)})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function FPTimingCard({ evening, allHistory = [], showProgress = false }: FPTimingCardProps) {
  const [now, setNow] = useState(Date.now());
  const [showDetails, setShowDetails] = useState(false);

  const isActive = !evening.completed && !!evening.startedAt;

  const hasBlockTimings = !!evening.blockTimings && evening.blockTimings.length > 0;

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

        {hasBlockTimings && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-1"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? "הסתר פירוט בלוקים" : "הצג פירוט בלוקים"}
          </button>
        )}

        {showDetails && <BlockTimingDetails evening={evening} />}

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

        {hasBlockTimings && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-1"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? "הסתר פירוט בלוקים" : "הצג פירוט בלוקים"}
          </button>
        )}

        {showDetails && <BlockTimingDetails evening={evening} />}

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
