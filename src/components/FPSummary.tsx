import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Users, Save, Home, Medal, Award } from "lucide-react";
import { TIER_LABELS, TIER_EMOJIS, TIER_COLORS, TIER_TEXT, computeTierIndices } from "@/lib/tierRanking";
import { FPEvening } from "@/types/fivePlayerTypes";
import { calculatePairStats, calculatePlayerStats } from "@/services/fivePlayerEngine";
import { useToast } from "@/hooks/use-toast";

interface FPSummaryProps {
  evening: FPEvening;
  onSave: (evening: FPEvening) => void;
  onBackToHome: () => void;
}

export const FPSummary = ({ evening, onSave, onBackToHome }: FPSummaryProps) => {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

  const pairStats = calculatePairStats(evening);
  const playerStats = calculatePlayerStats(evening);

  const topPair = pairStats[0];
  const topPlayer = playerStats[0];

  const handleSave = () => {
    onSave(evening);
    setSaved(true);
    toast({ title: "הליגה נשמרה!", description: "תוצאות הליגה נשמרו בהיסטוריה" });
  };

  return (
    <div className="min-h-[100svh] bg-gaming-bg p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
      <div className="max-w-md mx-auto space-y-4">
        {/* Title */}
        <div className="text-center">
          <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-foreground">סיכום הליגה</h1>
          <p className="text-sm text-muted-foreground">
            ליגת 5 שחקנים • {evening.schedule.filter(m => m.completed).length} משחקים
          </p>
        </div>

        {/* Final Player Ranking: Alpha–Epsilon */}
        {(() => {
          const tierLabels = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
          const tierEmojis = ['👑', '🥈', '🥉', '4️⃣', '5️⃣'];
          const tierColors = [
            'from-yellow-400/25 to-yellow-600/10 border-yellow-400/50 ring-1 ring-yellow-400/20',
            'from-slate-300/20 to-slate-400/10 border-slate-300/40',
            'from-amber-600/20 to-amber-700/10 border-amber-600/40',
            'from-border/30 to-border/10 border-border/40',
            'from-border/20 to-border/5 border-border/30',
          ];
          const tierText = [
            'text-yellow-400',
            'text-slate-300',
            'text-amber-500',
            'text-muted-foreground',
            'text-muted-foreground',
          ];
          return (
            <Card className="bg-gradient-card border-yellow-400/30 p-4 shadow-card space-y-3">
              <div className="text-center">
                <Medal className="h-7 w-7 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">דירוג שחקנים סופי</p>
              </div>
              <div className="space-y-2">
                {playerStats.slice(0, 5).map((s, idx) => (
                  <div
                    key={s.player.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gradient-to-l border ${tierColors[idx]}`}
                  >
                    <span className="text-lg">{tierEmojis[idx]}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-bold tracking-wider ${tierText[idx]}`}>{tierLabels[idx]}</span>
                      <p className="text-sm font-bold text-foreground leading-tight">{s.player.name}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className={`text-sm font-bold ${tierText[idx]}`}>{s.points} <span className="text-[10px] font-normal text-muted-foreground">נק׳</span></p>
                      <p className="text-[10px] text-muted-foreground">{s.wins}נ {s.draws}ת {s.losses}ה</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })()}

        {/* Top Pair (secondary) */}
        {topPair && (
          <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card">
            <div className="text-center">
              <Award className="h-5 w-5 text-neon-green mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">זוג מוביל</p>
              <p className="text-sm font-bold text-foreground">
                {topPair.pair.players[0].name} & {topPair.pair.players[1].name}
              </p>
              <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">
                {topPair.points} נקודות
              </Badge>
            </div>
          </Card>
        )}

        <Tabs defaultValue="pairs">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pairs">טבלת זוגות</TabsTrigger>
            <TabsTrigger value="players">טבלת שחקנים</TabsTrigger>
          </TabsList>

          <TabsContent value="pairs">
            <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right text-xs">#</TableHead>
                    <TableHead className="text-right text-xs">זוג</TableHead>
                    <TableHead className="text-center text-xs">נ</TableHead>
                    <TableHead className="text-center text-xs">ת</TableHead>
                    <TableHead className="text-center text-xs">ה</TableHead>
                    <TableHead className="text-center text-xs">שע</TableHead>
                    <TableHead className="text-center text-xs">הפ</TableHead>
                    <TableHead className="text-center text-xs font-bold">נק׳</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairStats.map((s, idx) => (
                    <TableRow key={s.pair.id}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-medium whitespace-nowrap">
                        {s.pair.players[0].name} & {s.pair.players[1].name}
                      </TableCell>
                      <TableCell className="text-center text-xs">{s.wins}</TableCell>
                      <TableCell className="text-center text-xs">{s.draws}</TableCell>
                      <TableCell className="text-center text-xs">{s.losses}</TableCell>
                      <TableCell className="text-center text-xs">{s.goalsFor}:{s.goalsAgainst}</TableCell>
                      <TableCell className="text-center text-xs">{s.goalDiff > 0 ? '+' : ''}{s.goalDiff}</TableCell>
                      <TableCell className="text-center text-xs font-bold text-neon-green">{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="players">
            <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right text-xs">#</TableHead>
                    <TableHead className="text-right text-xs">שחקן</TableHead>
                    <TableHead className="text-center text-xs">מש׳</TableHead>
                    <TableHead className="text-center text-xs">נ</TableHead>
                    <TableHead className="text-center text-xs">ת</TableHead>
                    <TableHead className="text-center text-xs">ה</TableHead>
                    <TableHead className="text-center text-xs">הפ</TableHead>
                    <TableHead className="text-center text-xs font-bold">נק׳</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerStats.map((s, idx) => (
                    <TableRow key={s.player.id}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{s.player.name}</TableCell>
                      <TableCell className="text-center text-xs">{s.played}</TableCell>
                      <TableCell className="text-center text-xs">{s.wins}</TableCell>
                      <TableCell className="text-center text-xs">{s.draws}</TableCell>
                      <TableCell className="text-center text-xs">{s.losses}</TableCell>
                      <TableCell className="text-center text-xs">{s.goalDiff > 0 ? '+' : ''}{s.goalDiff}</TableCell>
                      <TableCell className="text-center text-xs font-bold text-neon-green">{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="space-y-2">
          {!saved && (
            <Button variant="gaming" className="w-full" onClick={handleSave}>
              <Save className="h-4 w-4" />
              שמור להיסטוריה
            </Button>
          )}
          {saved && (
            <p className="text-center text-sm text-neon-green">✓ נשמר בהצלחה</p>
          )}
          <Button variant="secondary" className="w-full" onClick={onBackToHome}>
            <Home className="h-4 w-4" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    </div>
  );
};
