import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, ArrowLeft, ArrowRight, Check, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Evening, Player, Pair, Round } from "@/types/tournament";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { TournamentEngine } from "@/services/tournamentEngine";
import { StorageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";

interface ManualTournamentEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

type Step = 1 | 2 | 3;

interface RoundResult {
  pair1Wins: number;
  pair2Wins: number;
}

interface PlayerWithTeams {
  id: string;
  name: string;
  teams: Array<{ id: string; name: string }>;
}

export const ManualTournamentEntry = ({ open, onOpenChange, onSaved }: ManualTournamentEntryProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState<Date>(new Date());
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", ""]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([
    { pair1Wins: 0, pair2Wins: 0 },
    { pair1Wins: 0, pair2Wins: 0 },
    { pair1Wins: 0, pair2Wins: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  // Player search
  const [existingPlayers, setExistingPlayers] = useState<PlayerWithTeams[]>([]);
  const [searchingPlayerIndex, setSearchingPlayerIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      RemoteStorageService.listAllMyPlayers().then(setExistingPlayers).catch(() => {});
    }
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setPlayerNames(["", "", "", ""]);
      setRoundResults([
        { pair1Wins: 0, pair2Wins: 0 },
        { pair1Wins: 0, pair2Wins: 0 },
        { pair1Wins: 0, pair2Wins: 0 },
      ]);
      setDate(new Date());
      setSearchingPlayerIndex(null);
    }
  }, [open]);

  // Generate deterministic pair schedule from players
  const players: Player[] = playerNames.map((name, i) => ({
    id: `player-${name.toLowerCase().trim().replace(/[^a-z0-9\u0590-\u05FF]+/g, "-").replace(/^-+|-+$/g, "")}`,
    name: name.trim(),
  }));

  // Fixed pair combinations for 4 players (round-robin)
  const pairCombinations: [number, number, number, number][] = [
    [0, 1, 2, 3], // Round 1: P0+P1 vs P2+P3
    [0, 2, 1, 3], // Round 2: P0+P2 vs P1+P3
    [0, 3, 1, 2], // Round 3: P0+P3 vs P1+P2
  ];

  const getPairLabel = (roundIndex: number, pairIndex: 0 | 1): string => {
    const combo = pairCombinations[roundIndex];
    if (pairIndex === 0) {
      return `${playerNames[combo[0]] || `שחקן ${combo[0] + 1}`} + ${playerNames[combo[1]] || `שחקן ${combo[1] + 1}`}`;
    }
    return `${playerNames[combo[2]] || `שחקן ${combo[2] + 1}`} + ${playerNames[combo[3]] || `שחקן ${combo[3] + 1}`}`;
  };

  const canGoToStep2 = playerNames.every(n => n.trim().length > 0) &&
    new Set(playerNames.map(n => n.trim().toLowerCase())).size === 4;

  const canGoToStep3 = roundResults.every(r => r.pair1Wins !== r.pair2Wins && (r.pair1Wins > 0 || r.pair2Wins > 0));

  // Calculate rankings from round results
  const calculateRankings = (): { alpha: Player[]; beta: Player[]; gamma: Player[]; delta: Player[] } => {
    // Count round wins per player
    const playerPoints = new Map<string, number>();
    players.forEach(p => playerPoints.set(p.id, 0));

    roundResults.forEach((result, roundIndex) => {
      const combo = pairCombinations[roundIndex];
      const winningPairIndices = result.pair1Wins > result.pair2Wins ? [combo[0], combo[1]] : [combo[2], combo[3]];
      winningPairIndices.forEach(idx => {
        const pid = players[idx].id;
        playerPoints.set(pid, (playerPoints.get(pid) || 0) + 1);
      });
    });

    // Sort by points
    const sorted = players
      .map(p => ({ player: p, points: playerPoints.get(p.id) || 0 }))
      .sort((a, b) => b.points - a.points);

    const rankings = { alpha: [] as Player[], beta: [] as Player[], gamma: [] as Player[], delta: [] as Player[] };
    let rank = 0;
    let prevPoints = -1;
    sorted.forEach(({ player, points }) => {
      if (points !== prevPoints) {
        rank++;
        prevPoints = points;
      }
      if (rank === 1) rankings.alpha.push(player);
      else if (rank === 2) rankings.beta.push(player);
      else if (rank === 3) rankings.gamma.push(player);
      else rankings.delta.push(player);
    });

    return rankings;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rankings = calculateRankings();
      const maxWins = Math.max(...roundResults.map(r => Math.max(r.pair1Wins, r.pair2Wins)));

      // Build rounds
      const rounds: Round[] = roundResults.map((result, roundIndex) => {
        const combo = pairCombinations[roundIndex];
        const pair1: Pair = {
          id: `${players[combo[0]].id}-${players[combo[1]].id}-r${roundIndex + 1}`,
          players: [players[combo[0]], players[combo[1]]],
        };
        const pair2: Pair = {
          id: `${players[combo[2]].id}-${players[combo[3]].id}-r${roundIndex + 1}`,
          players: [players[combo[2]], players[combo[3]]],
        };

        return {
          id: `round-${roundIndex + 1}`,
          number: roundIndex + 1,
          matches: [],
          completed: true,
          currentMatchIndex: 0,
          pairScores: {
            [pair1.id]: result.pair1Wins,
            [pair2.id]: result.pair2Wins,
          },
        };
      });

      const evening: Evening = {
        id: `evening-manual-${Date.now()}`,
        date: date.toISOString(),
        players,
        rounds,
        winsToComplete: maxWins,
        completed: true,
        type: "pairs",
        rankings,
      };

      // Save remotely
      if (RemoteStorageService.isEnabled()) {
        let teamId: string | null = null;
        try {
          teamId = await RemoteStorageService.ensureTeamForPlayers(players);
        } catch {}
        await RemoteStorageService.saveEveningWithTeam(evening, teamId);
        try {
          await RemoteStorageService.syncStats(evening.id);
        } catch {}
      }

      // Save locally
      StorageService.saveEvening(evening);

      toast({ title: "הטורניר נשמר בהצלחה!" });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast({ title: "שגיאה בשמירה", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredExistingPlayers = existingPlayers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !playerNames.some((n, i) => i !== searchingPlayerIndex && n.trim().toLowerCase() === p.name.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gaming-surface border-border max-h-[90vh] overflow-y-auto max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Plus className="h-5 w-5 text-neon-green" />
            הוספת טורניר ידנית
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                step === s
                  ? "border-neon-green bg-neon-green/20 text-neon-green"
                  : step > s
                  ? "border-neon-green bg-neon-green text-gaming-bg"
                  : "border-border text-muted-foreground"
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
          ))}
        </div>

        {/* STEP 1: Date + Players */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Date picker */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">תאריך</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right bg-gaming-bg border-border">
                    <CalendarIcon className="h-4 w-4 ml-2" />
                    {format(date, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(d) => d > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Players */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">שחקנים (4)</label>
              <div className="space-y-2">
                {playerNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`שחקן ${index + 1}`}
                      value={name}
                      onChange={(e) => {
                        const updated = [...playerNames];
                        updated[index] = e.target.value;
                        setPlayerNames(updated);
                      }}
                      className="bg-gaming-bg border-border flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchingPlayerIndex(index);
                        setSearchQuery("");
                      }}
                      className="text-muted-foreground hover:text-neon-green"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Player search dropdown */}
            {searchingPlayerIndex !== null && (
              <Card className="bg-gaming-bg border-border p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-neon-green" />
                  <span className="text-sm text-foreground">בחר שחקן קיים</span>
                  <Button variant="ghost" size="sm" className="mr-auto" onClick={() => setSearchingPlayerIndex(null)}>✕</Button>
                </div>
                <Input
                  placeholder="חפש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gaming-surface border-border text-sm"
                  autoFocus
                />
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filteredExistingPlayers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">לא נמצאו שחקנים</p>
                  ) : (
                    filteredExistingPlayers.map(p => (
                      <Button
                        key={p.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          const updated = [...playerNames];
                          updated[searchingPlayerIndex!] = p.name;
                          setPlayerNames(updated);
                          setSearchingPlayerIndex(null);
                        }}
                      >
                        {p.name}
                      </Button>
                    ))
                  )}
                </div>
              </Card>
            )}

            <Button
              variant="gaming"
              className="w-full"
              disabled={!canGoToStep2}
              onClick={() => setStep(2)}
            >
              הבא <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Round results */}
        {step === 2 && (
          <div className="space-y-4">
            {roundResults.map((result, roundIndex) => (
              <Card key={roundIndex} className="bg-gaming-bg border-border p-3">
                <h4 className="text-sm font-semibold text-foreground mb-3">סיבוב {roundIndex + 1}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex-1 text-right truncate">
                      {getPairLabel(roundIndex, 0)}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={result.pair1Wins || ""}
                      onChange={(e) => {
                        const updated = [...roundResults];
                        updated[roundIndex] = { ...result, pair1Wins: parseInt(e.target.value) || 0 };
                        setRoundResults(updated);
                      }}
                      className="w-16 text-center bg-gaming-surface border-border"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex-1 text-right truncate">
                      {getPairLabel(roundIndex, 1)}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={result.pair2Wins || ""}
                      onChange={(e) => {
                        const updated = [...roundResults];
                        updated[roundIndex] = { ...result, pair2Wins: parseInt(e.target.value) || 0 };
                        setRoundResults(updated);
                      }}
                      className="w-16 text-center bg-gaming-surface border-border"
                    />
                  </div>
                  {result.pair1Wins === result.pair2Wins && result.pair1Wins > 0 && (
                    <p className="text-xs text-destructive">חייב להיות מנצח בכל סיבוב</p>
                  )}
                </div>
              </Card>
            ))}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ArrowRight className="h-4 w-4" /> חזרה
              </Button>
              <Button variant="gaming" className="flex-1" disabled={!canGoToStep3} onClick={() => setStep(3)}>
                הבא <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Summary + Save */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="bg-gaming-bg border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">סיכום</h4>
              <p className="text-xs text-muted-foreground mb-3">{format(date, "dd/MM/yyyy")}</p>

              {/* Rankings preview */}
              {(() => {
                const rankings = calculateRankings();
                return (
                  <div className="space-y-1">
                    {rankings.alpha.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 text-xs">Alpha</Badge>
                        <span className="text-sm text-foreground">{rankings.alpha.map(p => p.name).join(", ")}</span>
                      </div>
                    )}
                    {rankings.beta.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-400/20 text-gray-300 border-gray-400/30 text-xs">Beta</Badge>
                        <span className="text-sm text-foreground">{rankings.beta.map(p => p.name).join(", ")}</span>
                      </div>
                    )}
                    {rankings.gamma.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-600/20 text-amber-300 border-amber-600/30 text-xs">Gamma</Badge>
                        <span className="text-sm text-foreground">{rankings.gamma.map(p => p.name).join(", ")}</span>
                      </div>
                    )}
                    {rankings.delta.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-sky-400/20 text-sky-300 border-sky-400/30 text-xs">Delta</Badge>
                        <span className="text-sm text-foreground">{rankings.delta.map(p => p.name).join(", ")}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Round summaries */}
              <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
                {roundResults.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    סיבוב {i + 1}: {getPairLabel(i, 0)} ({r.pair1Wins}) vs {getPairLabel(i, 1)} ({r.pair2Wins})
                  </p>
                ))}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ArrowRight className="h-4 w-4" /> חזרה
              </Button>
              <Button variant="gaming" className="flex-1" disabled={saving} onClick={handleSave}>
                {saving ? "שומר..." : "שמור"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
