import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { FPEvening, FPMatch, FPPair, FPTeamBank } from "@/types/fivePlayerTypes";
import { Evening } from "@/types/tournament";
import { calculatePairStats, calculatePlayerStats } from "@/services/fivePlayerEngine";
import { computePersonalStats, playerInMatch, playerInFPPair } from "@/services/spectatorPersonalStats";
import PlayerPicker from "@/components/spectate/PlayerPicker";
import PersonalSummaryCard from "@/components/spectate/PersonalSummaryCard";
import PersonalInsights from "@/components/spectate/PersonalInsights";
import TeamSetupButton from "@/components/spectate/TeamSetupButton";
import CouplesSpectateView from "@/components/spectate/CouplesSpectateView";
import { TIER_LABELS, TIER_EMOJIS, TIER_COLORS, TIER_TEXT, computeTierIndices } from "@/lib/tierRanking";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "ikbywydyidnkohbdrqdk";
const POLL_INTERVAL = 4000;

type SpectateState = "loading" | "error" | "live";
type EveningMode = "five-player" | "couples";

function getStorageKey(code: string) {
  return `spectate-player-${code}`;
}

export default function Spectate() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<SpectateState>("loading");
  const [evening, setEvening] = useState<FPEvening | null>(null);
  const [couplesEvening, setCouplesEvening] = useState<Evening | null>(null);
  const [eveningMode, setEveningMode] = useState<EveningMode | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(() => {
    if (!code) return null;
    return localStorage.getItem(getStorageKey(code)) || null;
  });
  const lastUpdatedAt = useRef<string>("");

  const selectPlayer = useCallback((playerId: string) => {
    setSelectedPlayerId(playerId);
    if (code) localStorage.setItem(getStorageKey(code), playerId);
  }, [code]);

  const clearPlayer = useCallback(() => {
    setSelectedPlayerId(null);
    if (code) localStorage.removeItem(getStorageKey(code));
  }, [code]);

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
      if (json.updated_at !== lastUpdatedAt.current) {
        lastUpdatedAt.current = json.updated_at;
        const data = json.data;
        if (data && data.mode === "five-player-doubles") {
          setEvening(data as FPEvening);
          setEveningMode("five-player");
          setState("live");
        } else if (data && data.players && data.players.length > 0) {
          // Couples / pairs mode
          setCouplesEvening(data as Evening);
          setEveningMode("couples");
          setState("live");
        } else {
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

  const isCompleted = eveningMode === "five-player"
    ? evening?.completed === true
    : couplesEvening?.completed === true;

  useEffect(() => {
    fetchEvening();
    if (isCompleted) return;
    const interval = setInterval(fetchEvening, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchEvening, isCompleted]);

  // Validate stored player still exists in evening
  useEffect(() => {
    const players = eveningMode === "five-player" ? evening?.players : couplesEvening?.players;
    if (players && selectedPlayerId) {
      const exists = players.some(p => p.id === selectedPlayerId);
      if (!exists) clearPlayer();
    }
  }, [evening, couplesEvening, selectedPlayerId, clearPlayer, eveningMode]);

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

  if (state === "error" || (!evening && !couplesEvening)) {
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

  // Determine players for picker
  const allPlayers = eveningMode === "five-player" ? evening!.players : couplesEvening!.players;

  // Show player picker if no player selected
  if (!selectedPlayerId) {
    return <PlayerPicker players={allPlayers} onSelect={selectPlayer} />;
  }

  // Couples mode
  if (eveningMode === "couples" && couplesEvening) {
    return (
      <CouplesSpectateView
        evening={couplesEvening}
        selectedPlayerId={selectedPlayerId}
        onSwitchPlayer={clearPlayer}
        isCompleted={!!isCompleted}
      />
    );
  }

  // Five-player mode
  return (
    <PersonalizedSpectateView
      evening={evening!}
      selectedPlayerId={selectedPlayerId}
      onSwitchPlayer={clearPlayer}
      bankDrawerOpen={bankDrawerOpen}
      setBankDrawerOpen={setBankDrawerOpen}
      showUpcoming={showUpcoming}
      setShowUpcoming={setShowUpcoming}
      showRecent={showRecent}
      setShowRecent={setShowRecent}
      isCompleted={!!isCompleted}
    />
  );
}
      showRecent={showRecent}
      setShowRecent={setShowRecent}
      isCompleted={isCompleted}
    />
  );
}

/* ─── Main personalized view ─── */

interface PersonalizedViewProps {
  evening: FPEvening;
  selectedPlayerId: string;
  onSwitchPlayer: () => void;
  bankDrawerOpen: boolean;
  setBankDrawerOpen: (v: boolean) => void;
  showUpcoming: boolean;
  setShowUpcoming: (v: boolean) => void;
  showRecent: boolean;
  setShowRecent: (v: boolean) => void;
  isCompleted: boolean;
}

function PersonalizedSpectateView({
  evening, selectedPlayerId, onSwitchPlayer,
  bankDrawerOpen, setBankDrawerOpen,
  showUpcoming, setShowUpcoming,
  showRecent, setShowRecent,
  isCompleted,
}: PersonalizedViewProps) {
  const pairStats = useMemo(() => calculatePairStats(evening), [evening]);
  const playerStats = useMemo(() => calculatePlayerStats(evening), [evening]);
  const personal = useMemo(
    () => computePersonalStats(evening, selectedPlayerId, playerStats),
    [evening, selectedPlayerId, playerStats]
  );

  const currentMatch = evening.schedule[evening.currentMatchIndex] ?? null;
  const totalMatches = evening.schedule.length;
  const completedCount = evening.schedule.filter((m) => m.completed).length;

  const pairName = (pair: FPPair) =>
    `${pair.players[0].name} & ${pair.players[1].name}`;

  const renderStars = (stars: number) => {
    const full = Math.floor(stars);
    const half = stars % 1 !== 0;
    return "★".repeat(full) + (half ? "☆" : "");
  };

  const isMyMatch = (m: FPMatch) => playerInMatch(selectedPlayerId, m);

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
              <h1 className="text-base font-bold text-foreground">ליגת 5 שחקנים</h1>
              <p className="text-xs text-muted-foreground">
                {evening.players.map((p) => p.name).join(", ")}
              </p>
            </div>
          </div>
          {isCompleted ? (
            <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 text-xs">
              <Trophy className="h-3 w-3 ml-1" />
              תוצאות סופיות
            </Badge>
          ) : (
            <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">
              <Eye className="h-3 w-3 ml-1" />
              צפייה בלבד
            </Badge>
          )}
        </div>

        {/* ── Section 1: Personal Summary Card ── */}
        {personal && (
          <PersonalSummaryCard personal={personal} onSwitchPlayer={onSwitchPlayer} isCompleted={isCompleted} />
        )}

        {/* ── Section 2: Current Match / Live Status ── */}
        {currentMatch && !evening.completed && (() => {
          const isPlaying = playerInMatch(selectedPlayerId, currentMatch);
          const inA = playerInFPPair(selectedPlayerId, currentMatch.pairA);
          const myClub = isPlaying ? (inA ? currentMatch.clubA : currentMatch.clubB) : undefined;

          // If sitting out, find next match and their club
          const nextMatch = !isPlaying
            ? evening.schedule.find((m, i) => !m.completed && i !== evening.currentMatchIndex && playerInMatch(selectedPlayerId, m))
            : undefined;
          const nextInA = nextMatch ? playerInFPPair(selectedPlayerId, nextMatch.pairA) : false;
          const nextClub = nextMatch ? (nextInA ? nextMatch.clubA : nextMatch.clubB) : undefined;

          return (
            <Card className={`bg-gradient-card p-4 shadow-card ${isMyMatch(currentMatch) ? 'border-neon-green/50 ring-1 ring-neon-green/20' : 'border-neon-green/30'}`}>
              <p className="text-[10px] text-muted-foreground text-center mb-1">
                משחק נוכחי • סיבוב {currentMatch.roundIndex + 1} • משחק{" "}
                {currentMatch.matchIndex + 1}
              </p>
              <div className="text-center space-y-1">
                <p className={`text-lg font-bold ${playerInFPPair(selectedPlayerId, currentMatch.pairA) ? 'text-neon-green' : 'text-foreground'}`}>
                  {pairName(currentMatch.pairA)}
                </p>
                <p className="text-xs text-muted-foreground">vs</p>
                <p className={`text-lg font-bold ${playerInFPPair(selectedPlayerId, currentMatch.pairB) ? 'text-neon-green' : 'text-foreground'}`}>
                  {pairName(currentMatch.pairB)}
                </p>
              </div>

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
                  className={`text-[10px] ${currentMatch.sittingOut.id === selectedPlayerId ? 'border-neon-green/30 text-neon-green' : 'border-muted-foreground/30 text-muted-foreground'}`}
                >
                  🪑 יושב בחוץ: {currentMatch.sittingOut.name}
                </Badge>
              </div>

              {/* Team Setup Recommendation Button */}
              <div className="flex justify-center mt-3">
                {isPlaying && myClub && (
                  <TeamSetupButton club={myClub} matchLabel="משחק נוכחי" tournamentId={evening.id} />
                )}
                {!isPlaying && nextClub && (
                  <TeamSetupButton club={nextClub} matchLabel="המשחק הבא" tournamentId={evening.id} />
                )}
              </div>
            </Card>
          );
        })()}

        {/* Completed: Final Player Ranking */}
        {evening.completed && (() => {
          const top5 = playerStats.slice(0, 5);
          const tierIndices = computeTierIndices(top5.map(s => s.points));
          return (
            <Card className="bg-gradient-card border-yellow-400/30 p-4 shadow-card space-y-3">
              <div className="text-center">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-1" />
                <h2 className="text-lg font-bold text-foreground">תוצאות סופיות</h2>
                <p className="text-[11px] text-muted-foreground">דירוג שחקנים סופי</p>
              </div>
              <div className="space-y-2">
                {top5.map((s, idx) => {
                  const ti = tierIndices[idx];
                  const isMe = s.player.id === selectedPlayerId;
                  return (
                    <div
                      key={s.player.id}
                      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 bg-gradient-to-l border ${TIER_COLORS[ti]} ${ti === 0 ? 'ring-1' : ''} ${isMe ? 'ring-1 ring-neon-green/40' : ''}`}
                    >
                      <span className="text-lg">{TIER_EMOJIS[ti]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold tracking-wider ${TIER_TEXT[ti]}`}>{TIER_LABELS[ti]}</span>
                          {isMe && <span className="text-[9px] text-neon-green">●</span>}
                        </div>
                        <p className={`text-sm font-bold leading-tight ${isMe ? 'text-neon-green' : 'text-foreground'}`}>
                          {s.player.name}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className={`text-sm font-bold ${TIER_TEXT[ti]}`}>{s.points} <span className="text-[10px] font-normal text-muted-foreground">נק׳</span></p>
                        <p className="text-[10px] text-muted-foreground">{s.wins}נ {s.draws}ת {s.losses}ה</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        {/* ── Section 3: Personal Insights (expandable) ── */}
        {personal && <PersonalInsights personal={personal} />}

        {/* ── Section 4: Progress ── */}
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

        {/* ── Section 5: Standings ── */}
        <Tabs defaultValue="players">
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
                    <TableHead className="text-center text-xs font-bold">נק׳</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairStats.map((s) => {
                    const isMyPair = playerInFPPair(selectedPlayerId, s.pair);
                    return (
                      <TableRow key={s.pair.id} className={isMyPair ? 'bg-neon-green/10' : ''}>
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {pairName(s.pair)}
                          {isMyPair && (
                            <span className="text-neon-green text-[9px] mr-1">●</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs">{s.played}</TableCell>
                        <TableCell className="text-center text-xs">{s.wins}</TableCell>
                        <TableCell className="text-center text-xs">{s.draws}</TableCell>
                        <TableCell className="text-center text-xs">{s.losses}</TableCell>
                        <TableCell className="text-center text-xs">
                          {s.goalDiff > 0 ? "+" : ""}{s.goalDiff}
                        </TableCell>
                        <TableCell className="text-center text-xs font-bold text-neon-green">
                          {s.points}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="players">
            <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {playerStats.map((s) => {
                    const isMe = s.player.id === selectedPlayerId;
                    return (
                      <TableRow key={s.player.id} className={isMe ? 'bg-neon-green/10' : ''}>
                        <TableCell className="text-xs font-medium">
                          {s.player.name}
                        </TableCell>
                        <TableCell className="text-center text-xs">{s.played}</TableCell>
                        <TableCell className="text-center text-xs">{s.wins}</TableCell>
                        <TableCell className="text-center text-xs">{s.draws}</TableCell>
                        <TableCell className="text-center text-xs">{s.losses}</TableCell>
                        <TableCell className="text-center text-xs">
                          {s.goalDiff > 0 ? "+" : ""}{s.goalDiff}
                        </TableCell>
                        <TableCell className={`text-center text-xs font-bold ${isMe ? 'text-neon-green' : 'text-neon-green'}`}>
                          {s.points}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Section 6: Results (collapsed, ALL results) ── */}
        {completedCount > 0 && (
          <div>
            <Button
              variant="outline"
              className="w-full border-border/50 text-muted-foreground"
              onClick={() => setShowRecent(!showRecent)}
            >
              {showRecent ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              כל התוצאות ({completedCount})
            </Button>
            {showRecent && (
              <Card className="bg-gradient-card border-border/40 p-3 shadow-card mt-2">
                <div className="space-y-2">
                  {evening.schedule
                    .filter((m) => m.completed)
                    .reverse()
                    .map((m) => {
                      const cycle = Math.floor(m.roundIndex / 2) + 1;
                      const block = (m.roundIndex % 2) + 1;
                      const matchInBlock = m.matchIndex + 1;
                      const mine = isMyMatch(m);
                      return (
                        <div
                          key={m.id}
                          className={`rounded-lg px-2.5 py-2 border ${
                            mine
                              ? 'bg-neon-green/5 border-neon-green/30'
                              : 'bg-gaming-surface/40 border-border/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] text-muted-foreground">
                              #{m.globalIndex + 1} / {totalMatches} · מחזור {cycle} · בלוק {block} משחק {matchInBlock}
                            </p>
                            {mine && (
                              <span className="text-[9px] text-neon-green font-medium">המשחק שלך</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1 text-xs" dir="ltr">
                            <div className="flex-1 text-left">
                              <p className={`font-medium leading-tight ${playerInFPPair(selectedPlayerId, m.pairA) ? 'text-neon-green' : 'text-foreground'}`}>
                                {pairName(m.pairA)}
                              </p>
                              {m.clubA && (
                                <p className="text-muted-foreground text-[10px] leading-tight">{m.clubA.name}</p>
                              )}
                            </div>
                            <span className="font-bold text-neon-green font-mono px-1.5 text-sm shrink-0">
                              {m.scoreA}–{m.scoreB}
                            </span>
                            <div className="flex-1 text-right">
                              <p className={`font-medium leading-tight ${playerInFPPair(selectedPlayerId, m.pairB) ? 'text-neon-green' : 'text-foreground'}`}>
                                {pairName(m.pairB)}
                              </p>
                              {m.clubB && (
                                <p className="text-muted-foreground text-[10px] leading-tight">{m.clubB.name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Section 7: Upcoming Matches (collapsed) ── */}
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
                        className={`flex items-center justify-between bg-gaming-surface/40 rounded-lg px-2.5 py-1.5 border text-xs ${
                          isMyMatch(m) ? 'border-neon-green/30 bg-neon-green/5' : 'border-border/30'
                        }`}
                      >
                        <div className="flex-1">
                          <span className={`font-medium ${playerInFPPair(selectedPlayerId, m.pairA) ? 'text-neon-green' : 'text-foreground'}`}>
                            {pairName(m.pairA)}
                          </span>
                          <span className="text-muted-foreground mx-1">vs</span>
                          <span className={`font-medium ${playerInFPPair(selectedPlayerId, m.pairB) ? 'text-neon-green' : 'text-foreground'}`}>
                            {pairName(m.pairB)}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-[10px] mr-2">
                          {m.sittingOut.id === selectedPlayerId ? '🪑 אתה' : `🪑 ${m.sittingOut.name}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          );
        })()}

        {/* ── Section 8: All Teams button ── */}
        <Button
          variant="outline"
          className="w-full border-border/50 text-muted-foreground"
          onClick={() => setBankDrawerOpen(true)}
        >
          <Users className="h-4 w-4 ml-1" />
          כל הקבוצות
        </Button>
      </div>

      {/* Team Banks Drawer */}
      <Drawer open={bankDrawerOpen} onOpenChange={setBankDrawerOpen}>
        <DrawerContent className="max-h-[85vh]" dir="rtl">
          <DrawerHeader>
            <DrawerTitle className="text-foreground text-right">כל הקבוצות</DrawerTitle>
            <DrawerDescription className="text-right">כל הקבוצות של הזוגות בליגה</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3 overflow-auto max-h-[65vh]">
            {evening.pairs.map((pair) => {
              const bank = evening.teamBanks.find((b) => b.pairId === pair.id);
              if (!bank) return null;
              const isMyPair = playerInFPPair(selectedPlayerId, pair);
              return (
                <Card
                  key={pair.id}
                  className={`bg-gradient-card p-3 shadow-card ${isMyPair ? 'border-neon-green/40' : 'border-border/40'}`}
                >
                  <p className={`text-sm font-semibold mb-2 ${isMyPair ? 'text-neon-green' : 'text-foreground'}`}>
                    {pairName(pair)}
                    {isMyPair && <span className="text-[10px] text-neon-green/70 mr-1">● הזוג שלך</span>}
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
                          <span className={`text-xs text-foreground truncate flex-1 ${isUsed ? "line-through" : ""}`}>
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
