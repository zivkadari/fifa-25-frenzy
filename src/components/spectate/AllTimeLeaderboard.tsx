import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trophy, Users, Target, TrendingUp, Star } from "lucide-react";
import { AllTimePlayerStats } from "@/services/allTimeStatsService";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Metric = "points" | "wins" | "winRate" | "goalDiff" | "goals";

interface AllTimeLeaderboardProps {
  allPlayersStats: Map<string, AllTimePlayerStats>;
  selectedPlayerId: string;
}

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "points", label: "נקודות" },
  { value: "wins", label: "ניצחונות" },
  { value: "winRate", label: "% ניצחון" },
  { value: "goalDiff", label: "הפ. שערים" },
  { value: "goals", label: "שערים" },
];

function getMetricValue(stats: AllTimePlayerStats, metric: Metric): number {
  switch (metric) {
    case "points": return stats.totalPoints;
    case "wins": return stats.totalWins;
    case "winRate": return stats.totalWinRate;
    case "goalDiff": return stats.totalGoalDiff;
    case "goals": return stats.totalGoalsFor;
  }
}

function formatMetricValue(stats: AllTimePlayerStats, metric: Metric): string {
  switch (metric) {
    case "points": return `${stats.totalPoints}`;
    case "wins": return `${stats.totalWins}`;
    case "winRate": return `${stats.totalWinRate}%`;
    case "goalDiff": return `${stats.totalGoalDiff > 0 ? "+" : ""}${stats.totalGoalDiff}`;
    case "goals": return `${stats.totalGoalsFor}`;
  }
}

function getMetricUnit(metric: Metric): string {
  switch (metric) {
    case "points": return "נק׳";
    case "wins": return "ניצ׳";
    case "winRate": return "";
    case "goalDiff": return "";
    case "goals": return "שערים";
  }
}

const RANK_STYLES = [
  "text-yellow-400",
  "text-gray-300",
  "text-amber-600",
];

export default function AllTimeLeaderboard({ allPlayersStats, selectedPlayerId }: AllTimeLeaderboardProps) {
  const [metric, setMetric] = useState<Metric>("points");
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const entries = Array.from(allPlayersStats.entries()).map(([id, stats]) => ({ id, stats }));
    entries.sort((a, b) => getMetricValue(b.stats, metric) - getMetricValue(a.stats, metric));
    return entries;
  }, [allPlayersStats, metric]);

  if (sorted.length === 0) return null;

  const hasHistory = sorted.some(e => e.stats.eveningsPlayed > 1);

  return (
    <Card className="bg-gradient-card border-primary/20 p-3 shadow-card space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Trophy className="h-3.5 w-3.5 text-yellow-400" />
        <span>טבלת כל הזמנים</span>
        {hasHistory && (
          <span className="text-[10px] text-muted-foreground/70 mr-auto">
            {sorted[0].stats.eveningsPlayed} ערבים
          </span>
        )}
      </div>

      {/* Metric switcher */}
      <ToggleGroup
        type="single"
        value={metric}
        onValueChange={(v) => v && setMetric(v as Metric)}
        className="flex flex-wrap gap-1 direction-rtl"
      >
        {METRIC_OPTIONS.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className="text-[10px] px-2 py-0.5 h-6 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Leaderboard rows */}
      <div className="space-y-1.5">
        {sorted.map((entry, idx) => {
          const { id, stats } = entry;
          const isMe = id === selectedPlayerId;
          const isExpanded = expandedPlayerId === id;
          const rank = idx + 1;
          const delta = stats.tonightPoints;

          return (
            <div key={id}>
              {/* Main row */}
              <button
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-right transition-colors border ${
                  isMe
                    ? "bg-neon-green/10 border-neon-green/30 ring-1 ring-neon-green/20"
                    : "bg-gaming-surface/40 border-border/30 hover:bg-gaming-surface/60"
                }`}
                onClick={() => setExpandedPlayerId(isExpanded ? null : id)}
              >
                {/* Rank */}
                <span className={`text-sm font-bold w-5 text-center shrink-0 ${RANK_STYLES[idx] ?? "text-muted-foreground"}`}>
                  {rank}
                </span>

                {/* Name + secondary stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold truncate ${isMe ? "text-neon-green" : "text-foreground"}`}>
                      {stats.player.name}
                    </span>
                    {isMe && <span className="text-[9px] text-neon-green">●</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {stats.totalWins}נ {stats.totalDraws}ת {stats.totalLosses}ה · {stats.totalPlayed} משחקים
                  </p>
                </div>

                {/* Main metric */}
                <div className="text-left shrink-0 flex items-center gap-1">
                  <span className={`text-sm font-bold ${isMe ? "text-neon-green" : "text-foreground"}`}>
                    {formatMetricValue(stats, metric)}
                  </span>
                  {getMetricUnit(metric) && (
                    <span className="text-[9px] text-muted-foreground">{getMetricUnit(metric)}</span>
                  )}
                  {delta > 0 && stats.eveningsPlayed > 1 && metric === "points" && (
                    <span className="text-[9px] text-neon-green font-medium">+{delta}</span>
                  )}
                </div>

                {/* Expand chevron */}
                <span className="text-muted-foreground shrink-0">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-1 mx-1 p-2.5 bg-gaming-surface/60 rounded-lg border border-border/30 space-y-2">
                  {/* Record overview */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <DetailStat label="נקודות" value={stats.totalPoints} />
                    <DetailStat label="שערים +" value={stats.totalGoalsFor} />
                    <DetailStat label="שערים −" value={stats.totalGoalsAgainst} />
                    <DetailStat label="הפ. שערים" value={`${stats.totalGoalDiff > 0 ? "+" : ""}${stats.totalGoalDiff}`} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <DetailStat label="% ניצחון" value={`${stats.totalWinRate}%`} />
                    <DetailStat label="ערבים" value={stats.eveningsPlayed} />
                    <DetailStat label="משחקים" value={stats.totalPlayed} />
                  </div>

                  {/* Best partner */}
                  {stats.bestPartnerEver && (
                    <DetailRow
                      icon={<Users className="h-3 w-3 text-neon-green" />}
                      label="שותף מוביל"
                      value={`${stats.bestPartnerEver.partner.name} (${stats.bestPartnerEver.points} נק׳, ${stats.bestPartnerEver.wins}/${stats.bestPartnerEver.played})`}
                    />
                  )}

                  {/* Toughest opponent */}
                  {stats.toughestOpponentEver && (
                    <DetailRow
                      icon={<Target className="h-3 w-3 text-destructive" />}
                      label="יריב קשה"
                      value={`${stats.toughestOpponentEver.opponent.name} (${stats.toughestOpponentEver.losses} הפסדים מתוך ${stats.toughestOpponentEver.played})`}
                    />
                  )}

                  {/* Best club */}
                  {stats.bestClubEver && (
                    <DetailRow
                      icon={<TrendingUp className="h-3 w-3 text-neon-green" />}
                      label="קבוצה מצליחה"
                      value={`${stats.bestClubEver.clubName} (${stats.bestClubEver.wins}/${stats.bestClubEver.played})`}
                    />
                  )}

                  {/* Best tier */}
                  {stats.bestTierEver && (
                    <DetailRow
                      icon={<Star className="h-3 w-3 text-yellow-400" />}
                      label="דירוג כוכבים"
                      value={`${stats.bestTierEver.label} — ${stats.bestTierEver.winRate}% (${stats.bestTierEver.wins}/${stats.bestTierEver.played})`}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DetailStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gaming-surface/40 rounded-md px-1.5 py-1 text-center border border-border/20">
      <p className="text-[10px] font-bold text-foreground">{value}</p>
      <p className="text-[8px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5 text-[10px]">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
