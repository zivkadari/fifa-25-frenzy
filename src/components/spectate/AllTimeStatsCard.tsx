import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trophy, Users, TrendingUp, Target, Star } from "lucide-react";
import { AllTimePlayerStats } from "@/services/allTimeStatsService";

interface AllTimeStatsCardProps {
  stats: AllTimePlayerStats;
}

export default function AllTimeStatsCard({ stats }: AllTimeStatsCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (stats.eveningsPlayed < 1) return null;

  const hasHistory = stats.eveningsPlayed > 1;
  const pointsDelta = hasHistory ? stats.tonightPoints : 0;

  return (
    <Card className="bg-gradient-card border-primary/20 p-3 shadow-card space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Trophy className="h-3.5 w-3.5 text-yellow-400" />
        <span>סטטיסטיקות כל הזמנים</span>
        {hasHistory && (
          <span className="text-[10px] text-muted-foreground/70 mr-auto">{stats.eveningsPlayed} ערבים</span>
        )}
      </div>

      {/* Key stats - always visible */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat
          label="נקודות"
          value={stats.totalPoints}
          delta={pointsDelta > 0 ? `+${pointsDelta}` : undefined}
          highlight
        />
        <MiniStat label="ניצחונות" value={stats.totalWins} />
        <MiniStat label="תיקו" value={stats.totalDraws} />
        <MiniStat label="הפסדים" value={stats.totalLosses} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="הפ. שערים" value={`${stats.totalGoalDiff > 0 ? '+' : ''}${stats.totalGoalDiff}`} />
        <MiniStat label="% ניצחון" value={`${stats.totalWinRate}%`} />
        <MiniStat label="משחקים" value={stats.totalPlayed} />
      </div>

      {/* Best partner ever - always visible */}
      {stats.bestPartnerEver && stats.bestPartnerEver.played >= 1 && (
        <div className="bg-gaming-surface/60 rounded-lg px-2.5 py-2 border border-border/30">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3 w-3 text-neon-green" />
            <span className="text-[10px] text-muted-foreground">שותף מוביל כל הזמנים</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">{stats.bestPartnerEver.partner.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {stats.bestPartnerEver.wins}נ {stats.bestPartnerEver.draws}ת {stats.bestPartnerEver.losses}ה · {stats.bestPartnerEver.points} נק׳
            </span>
          </div>
        </div>
      )}

      {/* Expand/collapse for more details */}
      {(stats.partnerRecords.length > 1 || stats.clubRecords.length > 0 || stats.tierRecords.length > 0) && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground h-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
            {expanded ? 'הסתר פרטים' : 'עוד סטטיסטיקות כל הזמנים'}
          </Button>

          {expanded && (
            <div className="space-y-3 pt-1">
              {/* All partner records */}
              {stats.partnerRecords.length > 1 && (
                <Section icon={<Users className="h-3.5 w-3.5" />} title="כל השותפים (כל הזמנים)">
                  <div className="space-y-1.5">
                    {stats.partnerRecords.map(pr => (
                      <div key={pr.partner.id} className="flex items-center justify-between bg-gaming-surface/40 rounded-md px-2.5 py-1.5 border border-border/30 text-xs">
                        <span className="text-foreground font-medium">
                          {pr.partner.name}
                          {stats.bestPartnerEver && pr.partner.id === stats.bestPartnerEver.partner.id && stats.partnerRecords.length > 1 && (
                            <span className="text-neon-green mr-1 text-[10px]">★</span>
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {pr.wins}נ {pr.draws}ת {pr.losses}ה · {pr.winRate}% · {pr.points} נק׳
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Toughest opponent */}
              {stats.toughestOpponentEver && (
                <div className="bg-gaming-surface/60 rounded-lg px-2.5 py-2 border border-border/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="h-3 w-3 text-destructive" />
                    <span className="text-[10px] text-muted-foreground">יריב קשה כל הזמנים</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{stats.toughestOpponentEver.opponent.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {stats.toughestOpponentEver.wins}נ {stats.toughestOpponentEver.losses}ה מתוך {stats.toughestOpponentEver.played}
                    </span>
                  </div>
                </div>
              )}

              {/* Best club */}
              {stats.bestClubEver && (
                <div className="bg-gaming-surface/60 rounded-lg px-2.5 py-2 border border-border/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3 w-3 text-neon-green" />
                    <span className="text-[10px] text-muted-foreground">קבוצה מצליחה ביותר</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{stats.bestClubEver.clubName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {stats.bestClubEver.wins} ניצחונות מתוך {stats.bestClubEver.played}
                    </span>
                  </div>
                </div>
              )}

              {/* Best tier */}
              {stats.bestTierEver && (
                <div className="bg-gaming-surface/60 rounded-lg px-2.5 py-2 border border-border/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    <span className="text-[10px] text-muted-foreground">דירוג כוכבים מוצלח</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{stats.bestTierEver.label}</span>
                    <span className="text-[10px] text-muted-foreground">{stats.bestTierEver.winRate}% ניצחון</span>
                  </div>
                </div>
              )}

              {/* All opponent records */}
              {stats.opponentRecords.length > 0 && (
                <Section icon={<Target className="h-3.5 w-3.5" />} title="כל היריבים (כל הזמנים)">
                  <div className="space-y-1.5">
                    {stats.opponentRecords.map(or => (
                      <div key={or.opponent.id} className="flex items-center justify-between bg-gaming-surface/40 rounded-md px-2.5 py-1.5 border border-border/30 text-xs">
                        <span className="text-foreground font-medium">{or.opponent.name}</span>
                        <span className="text-muted-foreground">
                          {or.wins}נ {or.draws}ת {or.losses}ה
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, delta, highlight }: { label: string; value: string | number; delta?: string; highlight?: boolean }) {
  return (
    <div className="bg-gaming-surface/40 rounded-md px-2 py-1 text-center border border-border/30">
      <div className="flex items-center justify-center gap-1">
        <p className={`text-xs font-bold ${highlight ? 'text-yellow-400' : 'text-foreground'}`}>{value}</p>
        {delta && <span className="text-[9px] text-neon-green font-medium">{delta}</span>}
      </div>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}
