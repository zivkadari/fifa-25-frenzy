import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Home, Trophy, Users, ChevronDown, ChevronUp, Check } from "lucide-react";
import { FPEvening, FPMatch, FPTeamBank } from "@/types/fivePlayerTypes";
import { Club } from "@/types/tournament";
import { calculatePairStats, calculatePlayerStats } from "@/services/fivePlayerEngine";
import { useToast } from "@/hooks/use-toast";

interface FPGameProps {
  evening: FPEvening;
  onBack: () => void;
  onComplete: (evening: FPEvening) => void;
  onGoHome: () => void;
  onUpdateEvening: (evening: FPEvening) => void;
}

export const FPGame = ({ evening, onBack, onComplete, onGoHome, onUpdateEvening }: FPGameProps) => {
  const { toast } = useToast();
  const [currentEvening, setCurrentEvening] = useState(evening);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [selectedClubA, setSelectedClubA] = useState<Club | null>(null);
  const [selectedClubB, setSelectedClubB] = useState<Club | null>(null);
  const [showBankA, setShowBankA] = useState(false);
  const [showBankB, setShowBankB] = useState(false);

  useEffect(() => {
    setCurrentEvening(evening);
  }, [evening]);

  const currentMatch = currentEvening.schedule[currentEvening.currentMatchIndex] ?? null;

  // Restore selected clubs from match if already chosen
  useEffect(() => {
    if (!currentMatch) return;
    setSelectedClubA(currentMatch.clubA || null);
    setSelectedClubB(currentMatch.clubB || null);
    setScoreA(currentMatch.scoreA !== undefined ? String(currentMatch.scoreA) : '');
    setScoreB(currentMatch.scoreB !== undefined ? String(currentMatch.scoreB) : '');
    setShowBankA(false);
    setShowBankB(false);
  }, [currentEvening.currentMatchIndex]);

  const handleSubmitResult = useCallback(() => {
    if (!currentMatch || !selectedClubA || !selectedClubB || scoreA === '' || scoreB === '') return;
    const sA = parseInt(scoreA, 10);
    const sB = parseInt(scoreB, 10);
    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) {
      toast({ title: "ציון לא תקין", variant: "destructive" });
      return;
    }

    const updatedSchedule = [...currentEvening.schedule];
    updatedSchedule[currentEvening.currentMatchIndex] = {
      ...currentMatch,
      clubA: selectedClubA,
      clubB: selectedClubB,
      scoreA: sA,
      scoreB: sB,
      completed: true,
    };

    const updatedBanks = currentEvening.teamBanks.map(bank => {
      if (bank.pairId === currentMatch.pairA.id && !bank.usedClubIds.includes(selectedClubA.id)) {
        return { ...bank, usedClubIds: [...bank.usedClubIds, selectedClubA.id] };
      }
      if (bank.pairId === currentMatch.pairB.id && !bank.usedClubIds.includes(selectedClubB.id)) {
        return { ...bank, usedClubIds: [...bank.usedClubIds, selectedClubB.id] };
      }
      return bank;
    });

    const totalMatches = currentEvening.schedule.length;
    const nextIndex = currentEvening.currentMatchIndex + 1;
    const isComplete = nextIndex >= totalMatches;

    const updated: FPEvening = {
      ...currentEvening,
      schedule: updatedSchedule,
      teamBanks: updatedBanks,
      currentMatchIndex: isComplete ? currentEvening.currentMatchIndex : nextIndex,
      completed: isComplete,
    };

    setCurrentEvening(updated);
    onUpdateEvening(updated);
    setSelectedClubA(null);
    setSelectedClubB(null);
    setScoreA('');
    setScoreB('');

    if (isComplete) {
      onComplete(updated);
    }
  }, [currentEvening, currentMatch, selectedClubA, selectedClubB, scoreA, scoreB, onComplete, onUpdateEvening, toast]);

  const pairStats = calculatePairStats(currentEvening);
  const playerStats = calculatePlayerStats(currentEvening);

  if (!currentMatch) return null;

  const roundNum = currentMatch.roundIndex + 1;
  const matchInRound = currentMatch.matchIndex + 1;
  const totalMatches = currentEvening.schedule.length;

  const bankA = currentEvening.teamBanks.find(b => b.pairId === currentMatch.pairA.id)!;
  const bankB = currentEvening.teamBanks.find(b => b.pairId === currentMatch.pairB.id)!;

  const availableClubsA = bankA.clubs.filter(c => !bankA.usedClubIds.includes(c.id));
  const availableClubsB = bankB.clubs.filter(c => !bankB.usedClubIds.includes(c.id));
  const canSubmit = selectedClubA && selectedClubB && scoreA !== '' && scoreB !== '';

  const pairName = (pair: { players: [{ name: string }, { name: string }] }) =>
    `${pair.players[0].name} & ${pair.players[1].name}`;

  const renderStars = (stars: number) => {
    const full = Math.floor(stars);
    const half = stars % 1 !== 0;
    return (
      <span className="text-yellow-400 text-xs">
        {'★'.repeat(full)}{half ? '☆' : ''}
      </span>
    );
  };

  const renderClubBank = (
    bank: FPTeamBank,
    available: Club[],
    selected: Club | null,
    onSelect: (c: Club) => void,
    show: boolean,
    toggle: () => void,
    label: string,
  ) => (
    <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card">
      <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={toggle}>
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {selected && (
            <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">
              {selected.name} {renderStars(selected.stars)}
            </Badge>
          )}
          {show ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {show && (
        <div className="space-y-1">
          {bank.clubs.map(club => {
            const isUsed = bank.usedClubIds.includes(club.id);
            const isSelected = selected?.id === club.id;
            const isAvailable = !isUsed || isSelected;
            return (
              <div
                key={club.id}
                className={`flex items-center justify-between p-2 rounded text-sm border transition-colors ${
                  isSelected
                    ? 'border-neon-green bg-neon-green/10'
                    : isUsed
                      ? 'border-border/30 bg-gaming-surface/30 opacity-40 line-through'
                      : 'border-border/50 bg-gaming-surface cursor-pointer hover:border-neon-green/40'
                }`}
                onClick={() => {
                  if (isAvailable && !isUsed) onSelect(club);
                  else if (isSelected) onSelect(club); // deselect handled by parent
                }}
              >
                <span className="text-foreground">{club.name}</span>
                <div className="flex items-center gap-2">
                  {renderStars(club.stars)}
                  {isUsed && !isSelected && <span className="text-xs text-muted-foreground">שוחק</span>}
                  {isSelected && <Check className="h-3 w-3 text-neon-green" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-[100svh] bg-gaming-bg p-3 pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-foreground">ליגת 5 שחקנים</h1>
              <p className="text-xs text-muted-foreground">
                סיבוב {roundNum} • משחק {matchInRound}/5 • סה״כ {currentEvening.currentMatchIndex + 1}/{totalMatches}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onGoHome}>
            <Home className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="match" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-3">
            <TabsTrigger value="match">משחק</TabsTrigger>
            <TabsTrigger value="pairs">זוגות</TabsTrigger>
            <TabsTrigger value="players">שחקנים</TabsTrigger>
          </TabsList>

          <TabsContent value="match">
            {/* Sitting out */}
            <Card className="bg-gaming-surface/50 border-border/50 p-2 mb-3">
              <p className="text-center text-sm text-muted-foreground">
                יושב בחוץ: <strong className="text-foreground">{currentMatch.sittingOut.name}</strong>
              </p>
            </Card>

            {/* Match header */}
            <Card className="bg-gradient-card border-neon-green/20 p-3 mb-3 shadow-card">
              <div className="text-center">
                <p className="text-base font-bold text-foreground">
                  {pairName(currentMatch.pairA)}
                </p>
                <p className="text-xs text-muted-foreground my-1">vs</p>
                <p className="text-base font-bold text-foreground">
                  {pairName(currentMatch.pairB)}
                </p>
              </div>
            </Card>

            {/* Team selection */}
            {renderClubBank(
              bankA, availableClubsA, selectedClubA,
              (c) => setSelectedClubA(prev => prev?.id === c.id ? null : c),
              showBankA, () => setShowBankA(!showBankA),
              `בנק ${pairName(currentMatch.pairA)}`
            )}

            <div className="h-2" />

            {renderClubBank(
              bankB, availableClubsB, selectedClubB,
              (c) => setSelectedClubB(prev => prev?.id === c.id ? null : c),
              showBankB, () => setShowBankB(!showBankB),
              `בנק ${pairName(currentMatch.pairB)}`
            )}

            {/* Score entry */}
            <Card className="bg-gradient-card border-neon-green/20 p-3 mt-3 shadow-card">
              <div className="flex items-center justify-center gap-3">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{selectedClubA?.name || '—'}</p>
                  <Input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={e => setScoreA(e.target.value)}
                    className="text-center text-lg font-bold bg-gaming-surface border-border w-16 mx-auto"
                    inputMode="numeric"
                  />
                </div>
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{selectedClubB?.name || '—'}</p>
                  <Input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={e => setScoreB(e.target.value)}
                    className="text-center text-lg font-bold bg-gaming-surface border-border w-16 mx-auto"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </Card>

            <Button
              variant="gaming"
              className="w-full mt-3"
              disabled={!canSubmit}
              onClick={handleSubmitResult}
            >
              {currentEvening.currentMatchIndex + 1 >= totalMatches ? 'סיים ליגה' : 'שמור תוצאה ← הבא'}
            </Button>
          </TabsContent>

          <TabsContent value="pairs">
            <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card overflow-auto">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-neon-green" /> טבלת זוגות
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right text-xs">#</TableHead>
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
                  {pairStats.map((s, idx) => (
                    <TableRow key={s.pair.id}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-medium whitespace-nowrap">
                        {s.pair.players[0].name} & {s.pair.players[1].name}
                      </TableCell>
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

          <TabsContent value="players">
            <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card overflow-auto">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-neon-green" /> טבלת שחקנים
              </h3>
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
      </div>
    </div>
  );
};
