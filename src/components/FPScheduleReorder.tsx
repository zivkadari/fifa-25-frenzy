import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Lock, RotateCcw, ListOrdered } from "lucide-react";
import { FPEvening, FPMatch } from "@/types/fivePlayerTypes";
import { useToast } from "@/hooks/use-toast";

interface FPScheduleReorderProps {
  evening: FPEvening;
  onUpdateEvening: (evening: FPEvening) => void;
}

export const FPScheduleReorder = ({ evening, onUpdateEvening }: FPScheduleReorderProps) => {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);

  const currentIdx = evening.currentMatchIndex;
  const schedule = evening.schedule;

  const pairName = (pair: { players: [{ name: string }, { name: string }] }) =>
    `${pair.players[0].name} & ${pair.players[1].name}`;

  const moveFutureMatch = useCallback((fromScheduleIdx: number, direction: 'up' | 'down') => {
    // Only swap within future matches (>= currentIdx)
    const targetIdx = direction === 'up' ? fromScheduleIdx - 1 : fromScheduleIdx + 1;
    if (targetIdx < currentIdx || targetIdx >= schedule.length) return;
    if (fromScheduleIdx < currentIdx) return;

    const newSchedule = [...schedule];
    // Swap the two matches
    const a = { ...newSchedule[fromScheduleIdx] };
    const b = { ...newSchedule[targetIdx] };

    // Swap globalIndex
    const tmpGlobal = a.globalIndex;
    a.globalIndex = b.globalIndex;
    b.globalIndex = tmpGlobal;

    newSchedule[fromScheduleIdx] = b;
    newSchedule[targetIdx] = a;

    const updated: FPEvening = { ...evening, schedule: newSchedule };
    onUpdateEvening(updated);
  }, [evening, schedule, currentIdx, onUpdateEvening]);

  const resetFutureOrder = useCallback(() => {
    // Restore original order for future matches by sorting by their original globalIndex pattern
    // Original order: matches were created with globalIndex 0..29 in order
    // We restore by sorting future portion by their id (which encodes original round/match)
    const completed = schedule.slice(0, currentIdx);
    const future = schedule.slice(currentIdx);

    // Sort future matches by their original round and match indices
    const sorted = [...future].sort((a, b) => {
      if (a.roundIndex !== b.roundIndex) return a.roundIndex - b.roundIndex;
      return a.matchIndex - b.matchIndex;
    });

    // Re-assign globalIndex for all
    const newSchedule = [...completed, ...sorted].map((m, i) => ({
      ...m,
      globalIndex: i,
    }));

    const updated: FPEvening = { ...evening, schedule: newSchedule };
    onUpdateEvening(updated);
    toast({ title: "סדר המשחקים אופס לסדר המקורי" });
  }, [evening, schedule, currentIdx, onUpdateEvening, toast]);

  // Group by blocks of 5 for display
  const getBlockLabel = (match: FPMatch) => {
    const blockNum = Math.floor(match.roundIndex) + 1;
    return `בלוק ${blockNum}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-neon-green" />
          סדר משחקים
        </h3>
        <div className="flex gap-1.5">
          {editMode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={resetFutureOrder}
            >
              <RotateCcw className="h-3 w-3 ml-1" />
              איפוס
            </Button>
          )}
          <Button
            variant={editMode ? "neon" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "סיום עריכה" : "ערוך סדר"}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {schedule.map((match, schedIdx) => {
          const isCompleted = match.completed;
          const isCurrent = schedIdx === currentIdx;
          const isFuture = schedIdx > currentIdx;
          const canMoveUp = editMode && isFuture && schedIdx > currentIdx;
          const canMoveDown = editMode && (isFuture || isCurrent) && schedIdx < schedule.length - 1 && !isCompleted;

          // Show block separator
          const prevMatch = schedIdx > 0 ? schedule[schedIdx - 1] : null;
          const showBlockSep = !prevMatch || prevMatch.roundIndex !== match.roundIndex;

          return (
            <div key={match.id}>
              {showBlockSep && (
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {getBlockLabel(match)}
                  </span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
              )}

              <div
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-all ${
                  isCompleted
                    ? "bg-gaming-surface/20 border-border/20 opacity-50"
                    : isCurrent
                      ? "bg-neon-green/10 border-neon-green/40 shadow-sm"
                      : "bg-gaming-surface/40 border-border/30"
                }`}
              >
                {/* Match number */}
                <span className="text-[10px] text-muted-foreground w-5 text-center shrink-0">
                  {schedIdx + 1}
                </span>

                {/* Lock icon for completed */}
                {isCompleted && (
                  <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}

                {/* Current indicator */}
                {isCurrent && !isCompleted && (
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green shrink-0 animate-pulse" />
                )}

                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">
                    {pairName(match.pairA)} <span className="text-muted-foreground">vs</span> {pairName(match.pairB)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    בחוץ: {match.sittingOut.name}
                    {isCompleted && match.scoreA !== undefined && (
                      <span className="mr-2">
                        • {match.scoreA}-{match.scoreB}
                      </span>
                    )}
                  </p>
                </div>

                {/* Reorder buttons */}
                {editMode && !isCompleted && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      disabled={!canMoveUp}
                      onClick={() => moveFutureMatch(schedIdx, 'up')}
                      className={`p-1 rounded transition-colors ${
                        canMoveUp
                          ? "hover:bg-neon-green/20 text-foreground active:scale-90"
                          : "text-muted-foreground/20 cursor-not-allowed"
                      }`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={!canMoveDown || schedule[schedIdx + 1]?.completed}
                      onClick={() => moveFutureMatch(schedIdx, 'down')}
                      className={`p-1 rounded transition-colors ${
                        canMoveDown && !schedule[schedIdx + 1]?.completed
                          ? "hover:bg-neon-green/20 text-foreground active:scale-90"
                          : "text-muted-foreground/20 cursor-not-allowed"
                      }`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
