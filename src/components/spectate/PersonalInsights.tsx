import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Users, Swords, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PersonalStats } from "@/services/spectatorPersonalStats";

interface PersonalInsightsProps {
  personal: PersonalStats;
}

export default function PersonalInsights({ personal }: PersonalInsightsProps) {
  const [open, setOpen] = useState(false);

  const { partnerRecords, opponentRecords, bestPartner, toughestOpponent, unbeatenStreak, stats } = personal;

  // Only show if there's meaningful data
  if (stats.played < 1) return null;

  return (
    <div>
      <Button
        variant="outline"
        className="w-full border-border/50 text-muted-foreground"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        סטטיסטיקות אישיות
      </Button>

      {open && (
        <Card className="bg-gradient-card border-border/40 p-3 shadow-card mt-2 space-y-4">
          {/* Goals */}
          <Section icon={<TrendingUp className="h-3.5 w-3.5" />} title="שערים">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="בעד" value={stats.goalsFor} />
              <MiniStat label="נגד" value={stats.goalsAgainst} />
              <MiniStat label="הפרש" value={`${stats.goalDiff > 0 ? '+' : ''}${stats.goalDiff}`} />
            </div>
          </Section>

          {/* Unbeaten streak */}
          {unbeatenStreak >= 2 && (
            <div className="text-[11px] text-muted-foreground">
              🛡️ <span className="text-foreground font-medium">{unbeatenStreak} משחקים ללא הפסד</span> ברצף
            </div>
          )}

          {/* Best partner */}
          {bestPartner && bestPartner.played >= 1 && (
            <Section icon={<Users className="h-3.5 w-3.5" />} title="שותפים">
              <div className="space-y-1.5">
                {partnerRecords.map(pr => (
                  <div key={pr.partner.id} className="flex items-center justify-between bg-gaming-surface/40 rounded-md px-2.5 py-1.5 border border-border/30 text-xs">
                    <span className="text-foreground font-medium">
                      {pr.partner.name}
                      {pr.partner.id === bestPartner.partner.id && partnerRecords.length > 1 && (
                        <span className="text-neon-green mr-1 text-[10px]">★</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {pr.wins}נ {pr.draws}ת {pr.losses}ה · {pr.points} נק׳
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Opponents */}
          {toughestOpponent && toughestOpponent.played >= 1 && (
            <Section icon={<Swords className="h-3.5 w-3.5" />} title="יריבים">
              <div className="space-y-1.5">
                {opponentRecords
                  .sort((a, b) => b.played - a.played || b.losses - a.losses)
                  .map(or => (
                    <div key={or.opponent.id} className="flex items-center justify-between bg-gaming-surface/40 rounded-md px-2.5 py-1.5 border border-border/30 text-xs">
                      <span className="text-foreground font-medium">
                        {or.opponent.name}
                        {or.opponent.id === toughestOpponent.opponent.id && opponentRecords.length > 1 && (
                          <span className="text-destructive mr-1 text-[10px]">⚔</span>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {or.wins}נ {or.draws}ת {or.losses}ה
                      </span>
                    </div>
                  ))}
              </div>
            </Section>
          )}
        </Card>
      )}
    </div>
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gaming-surface/40 rounded-md px-2 py-1 text-center border border-border/30">
      <p className="text-xs font-bold text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}
