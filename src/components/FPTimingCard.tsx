import { Card } from "@/components/ui/card";
import { Clock, Timer } from "lucide-react";
import { FPEvening } from "@/types/fivePlayerTypes";

interface FPTimingCardProps {
  evening: FPEvening;
  allHistory?: FPEvening[];
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

  // Get tournaments with valid timing data
  const withTiming = allHistory.filter(
    (e) => e.completed && e.startedAt && e.completedAt && e.durationMinutes && e.durationMinutes > 0
  );

  // Prefer same-length tournaments
  const sameLengthTimed = withTiming.filter((e) => (e.matchCount || 30) === matchCount);
  const pool = sameLengthTimed.length >= 2 ? sameLengthTimed : withTiming;

  if (pool.length === 0) return null;

  // Average minutes per match across historical tournaments
  const avgMinPerMatch =
    pool.reduce((sum, e) => sum + e.durationMinutes! / (e.matchCount || 30), 0) / pool.length;

  const remainingMinutes = Math.round(remaining * avgMinPerMatch);
  const now = new Date();
  const estimatedFinish = new Date(now.getTime() + remainingMinutes * 60000).toISOString();

  return { estimatedFinish, remainingMinutes };
}

export function FPTimingCard({ evening, allHistory = [] }: FPTimingCardProps) {
  // Completed tournament
  if (evening.completed && evening.startedAt && evening.completedAt && evening.durationMinutes) {
    return (
      <Card className="bg-gaming-surface/50 border-border/50 p-3">
        <div className="flex items-center gap-2 mb-1.5">
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
            <p className="font-medium text-neon-green">{formatDuration(evening.durationMinutes)}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Active tournament
  if (!evening.completed && evening.startedAt) {
    const estimate = estimateFinish(evening, allHistory);
    return (
      <Card className="bg-gaming-surface/50 border-border/50 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Timer className="h-3.5 w-3.5 text-neon-green" />
          <span className="text-xs font-medium text-foreground">זמנים</span>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">התחלה</span>
            <span className="text-foreground font-medium">{formatTime(evening.startedAt)}</span>
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
      </Card>
    );
  }

  return null;
}

export { formatTime, formatDuration };
