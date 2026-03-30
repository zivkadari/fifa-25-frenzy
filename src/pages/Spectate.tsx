import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Users, Eye, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { FPEvening, FPMatch, FPPair, FPTeamBank, FPPairStats, FPPlayerStats } from "@/types/fivePlayerTypes";
import { calculatePairStats, calculatePlayerStats } from "@/services/fivePlayerEngine";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "ikbywydyidnkohbdrqdk";
const POLL_INTERVAL = 4000;

type SpectateState = "loading" | "error" | "live";

export default function Spectate() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<SpectateState>("loading");
  const [evening, setEvening] = useState<FPEvening | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const lastUpdatedAt = useRef<string>("");

  const fetchEvening = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(
        `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-public-evening?code=${encodeURIComponent(code)}`
      );
      if (!res.ok) {
        if (state === "loading") {
          setState("error");
          setErrorMsg("לא נמצא טורניר עם הקוד הזה");
        }
        return;
      }
      const json = await res.json();
      // Only update if data actually changed
      if (json.updated_at !== lastUpdatedAt.current) {
        lastUpdatedAt.current = json.updated_at;
        const data = json.data as FPEvening;
        if (data && data.mode === "five-player-doubles") {
          setEvening(data);
          setState("live");
        } else {
          // It's a regular evening, not FP - still show error for now
          setState("error");
          setErrorMsg("הטורניר הזה לא נתמך בתצוגת צפייה");
        }
      } else if (state === "loading") {
        setState("live");
      }
    } catch {
      if (state === "loading") {
        setState("error");
        setErrorMsg("שגיאה בטעינת הטורניר");
      }
    }
  }, [code, state]);

  useEffect(() => {
    fetchEvening();
    const interval = setInterval(fetchEvening, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchEvening]);

  if (state === "loading") {
    return (
      <div className="min-h-[100svh] bg-gaming-bg flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-neon-green animate-spin mx-auto" />
          <p className="text-muted-foreground">טוען טורניר...</p>
        </div>
      </div>
    );
  }

  if (state === "error" || !evening) {
    return (
      <div className="min-h-[100svh] bg-gaming-bg flex items-center justify-center p-4" dir="rtl">
        <Card className="bg-gradient-card border-destructive/30 p-6 max-w-sm text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="text-lg font-bold text-foreground">שגיאה</h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
        </Card>
      </div>
    );
  }

  const currentMatch = evening.schedule[evening.currentMatchIndex] ?? null;
  const pairStats = calculatePairStats(evening);
  const playerStats = calculatePlayerStats(evening);
  const totalMatches = evening.schedule.length;
  const completedCount = evening.schedule.filter((m) => m.completed).length;

  const pairName = (pair: FPPair) =>
    `${pair.players[0].name} & ${pair.players[1].name}`;

  const renderStars = (stars: number) => {
    const full = Math.floor(stars);
    const half = stars % 1 !== 0;
    return "★".repeat(full) + (half ? "☆" : "");
  };

  return (
    <div
      className="min-h-[100svh] bg-gaming-bg p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
      dir="rtl"
    >
      <div className="max-w-md mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-neon-green" />
            <div>
              <h1 className="text-base font-bold text-foreground">
                ליגת 5 שחקנים
              </h1>
              <p className="text-xs text-muted-foreground">
                {evening.players.map((p) => p.name).join(", ")}
              </p>
            </div>
          </div>
          <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">
            <Eye className="h-3 w-3 ml-1" />
            צפייה בלבד
          </Badge>
        </div>

        {/* Progress */}
        <Card className="bg-gaming-surface/50 border-border/50 p-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {evening.completed ? "הליגה הסתיימה!" : `משחק ${completedCount + 1} מתוך ${totalMatches}`}
            </span>
            <span>{completedCount}/{totalMatches} הושלמו</span>
          </div>
          <div className="w-full bg-gaming-surface rounded-full h-1.5 mt-1.5">
            <div
              className="bg-neon-green rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${(completedCount / totalMatches) * 100}%` }}
            />
          </div>
        </Card>

        {/* Current match */}
        {currentMatch && !evening.completed && (
          <Card className="bg-gradient-card border-neon-green/30 p-4 shadow-card">
            <p className="text-[10px] text-muted-foreground text-center mb-1">
              משחק נוכחי • סיבוב {currentMatch.roundIndex + 1} • משחק{" "}
              {currentMatch.matchIndex + 1}
            </p>
            <div className="text-center space-y-1">
              <p className="text-lg font-bold text-foreground">
                {pairName(currentMatch.pairA)}
              </p>
              <p className="text-xs text-muted-foreground">vs</p>
              <p className="text-lg font-bold text-foreground">
                {pairName(currentMatch.pairB)}
              </p>
            </div>

            {/* Teams if selected */}
            {(currentMatch.clubA || currentMatch.clubB) && (
              <div className="flex items-center justify-center gap-3 mt-2 text-xs">
                {currentMatch.clubA && (
                  <Badge variant="outline" className="border-border/50 text-foreground">
                    {currentMatch.clubA.name}
                  </Badge>
                )}
                {currentMatch.clubA && currentMatch.clubB && (
                  <span className="text-muted-foreground">vs</span>
                )}
                {currentMatch.clubB && (
                  <Badge variant="outline" className="border-border/50 text-foreground">
                    {currentMatch.clubB.name}
                  </Badge>
                )}
              </div>
            )}

            {/* Score if entered */}
            {currentMatch.scoreA !== undefined && currentMatch.scoreB !== undefined && currentMatch.completed && (
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-neon-green">
                  {currentMatch.scoreA} - {currentMatch.scoreB}
                </span>
              </div>
            )}

            <div className="text-center mt-2">
              <Badge
                variant="outline"
                className="border-muted-foreground/30 text-muted-foreground text-[10px]"
              >
                🪑 יושב בחוץ: {currentMatch.sittingOut.name}
              </Badge>
            </div>
          </Card>
        )}

        {/* Completed banner */}
        {evening.completed && (
          <Card className="bg-gradient-card border-yellow-400/30 p-4 shadow-card text-center">
            <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-foreground">הליגה הסתיימה!</h2>
            {pairStats[0] && (
              <p className="text-sm text-muted-foreground mt-1">
                מנצחים:{" "}
                <strong className="text-foreground">
                  {pairName(pairStats[0].pair)}
                </strong>{" "}
                ({pairStats[0].points} נק׳)
              </p>
            )}
          </Card>
        )}

        {/* Upcoming Matches */}
        {!evening.completed && (() => {
          const upcoming = evening.schedule.filter((m, i) => !m.completed && i !== evening.currentMatchIndex);
          if (upcoming.length === 0) return null;
          return (
            <div>
              <Button
                variant="outline"
                className="w-full border-border/50 text-muted-foreground"
                onClick={() => setShowUpcoming(!showUpcoming)}
              >
                {showUpcoming ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                משחקים הבאים ({upcoming.length})
              </Button>
              {showUpcoming && (
                <Card className="bg-gradient-card border-border/40 p-3 shadow-card mt-2">
                  <div className="space-y-1.5">
                    {upcoming.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between bg-gaming-surface/40 rounded-lg px-2.5 py-1.5 border border-border/30 text-xs"
                      >
                        <div className="flex-1">
                          <span className="text-foreground font-medium">{pairName(m.pairA)}</span>
                          <span className="text-muted-foreground mx-1">vs</span>
                          <span className="text-foreground font-medium">{pairName(m.pairB)}</span>
                        </div>
                        <span className="text-muted-foreground text-[10px] mr-2">🪑 {m.sittingOut.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          );
        })()}

        {/* View All Teams Button */}
        <Button
          variant="outline"
          className="w-full border-border/50 text-muted-foreground"
          onClick={() => setBankDrawerOpen(true)}
        >
          <Eye className="h-4 w-4 ml-1" />
          צפייה בכל הקבוצות
        </Button>

        {/* Standings Tabs */}
        <Tabs defaultValue="pairs">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pairs">
              <Trophy className="h-3.5 w-3.5 ml-1" />
              זוגות
            </TabsTrigger>
            <TabsTrigger value="players">
              <Users className="h-3.5 w-3.5 ml-1" />
              שחקנים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pairs">
            <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead className="text-right text-xs">זוג</TableHead>
                    <TableHead className="text-center text-xs">מש׳</TableHead>
                    <TableHead className="text-center text-xs">נ</TableHead>
                    <TableHead className="text-center text-xs">ת</TableHead>
                    <TableHead className="text-center text-xs">ה</TableHead>
                    <TableHead className="text-center text-xs">הפ</TableHead>
                    <TableHead className="text-center text-xs font-bold">
                      נק׳
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairStats.map((s, idx) => (
                    <TableRow key={s.pair.id}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-medium whitespace-nowrap">
                        {pairName(s.pair)}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.played}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.wins}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.draws}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.losses}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.goalDiff > 0 ? "+" : ""}
                        {s.goalDiff}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-neon-green">
                        {s.points}
                      </TableCell>
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
                    <TableHead className="text-center text-xs font-bold">
                      נק׳
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerStats.map((s, idx) => (
                    <TableRow key={s.player.id}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {s.player.name}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.played}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.wins}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.draws}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.losses}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s.goalDiff > 0 ? "+" : ""}
                        {s.goalDiff}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold text-neon-green">
                        {s.points}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent matches */}
        {completedCount > 0 && (
          <Card className="bg-gradient-card border-border/40 p-3 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              תוצאות אחרונות
            </h3>
            <div className="space-y-1.5">
              {evening.schedule
                .filter((m) => m.completed)
                .slice(-5)
                .reverse()
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-gaming-surface/40 rounded-lg px-2.5 py-1.5 border border-border/30 text-xs"
                  >
                    <div className="flex-1">
                      <span className="text-foreground font-medium">
                        {pairName(m.pairA)}
                      </span>
                      <span className="text-muted-foreground mx-1">vs</span>
                      <span className="text-foreground font-medium">
                        {pairName(m.pairB)}
                      </span>
                    </div>
                    <span className="font-bold text-foreground mr-2">
                      {m.scoreA}-{m.scoreB}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      {/* Team Banks Drawer */}
      <Drawer open={bankDrawerOpen} onOpenChange={setBankDrawerOpen}>
        <DrawerContent className="max-h-[85vh]" dir="rtl">
          <DrawerHeader>
            <DrawerTitle className="text-foreground text-right">
              בנקי קבוצות
            </DrawerTitle>
            <DrawerDescription className="text-right">
              כל בנקי הזוגות בליגה
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3 overflow-auto max-h-[65vh]">
            {evening.pairs.map((pair) => {
              const bank = evening.teamBanks.find(
                (b) => b.pairId === pair.id
              );
              if (!bank) return null;
              return (
                <Card
                  key={pair.id}
                  className="bg-gradient-card border-border/40 p-3 shadow-card"
                >
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {pairName(pair)}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {bank.clubs.map((club, i) => {
                      const isUsed = bank.usedClubIds.includes(club.id);
                      return (
                        <div
                          key={`${club.id}-${i}`}
                          className={`flex items-center justify-between bg-gaming-surface/60 rounded-md px-2 py-1.5 border border-border/30 ${
                            isUsed ? "opacity-40" : ""
                          }`}
                        >
                          <span
                            className={`text-xs text-foreground truncate flex-1 ${
                              isUsed ? "line-through" : ""
                            }`}
                          >
                            {club.name}
                          </span>
                          <span className="text-yellow-400 text-[10px] whitespace-nowrap mr-1">
                            {renderStars(club.stars)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
