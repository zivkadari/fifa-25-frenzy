import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Home, Trophy, Users, Check, ChevronDown } from "lucide-react";
import { FPEvening, FPTeamBank } from "@/types/fivePlayerTypes";
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

type MatchStep = 'teamA' | 'teamB' | 'score';
type ScoreMode = 'quick' | 'winner' | 'manual';
type WinnerChoice = 'A' | 'draw' | 'B' | null;

const QUICK_SCORES = [0, 1, 2, 3, 4, 5];

const WINNER_SHORTCUTS: Record<string, [number, number][]> = {
  A: [[1, 0], [2, 0], [2, 1], [3, 1], [3, 0]],
  draw: [[0, 0], [1, 1], [2, 2], [3, 3]],
  B: [[0, 1], [0, 2], [1, 2], [1, 3], [0, 3]],
};

export const FPGame = ({ evening, onBack, onComplete, onGoHome, onUpdateEvening }: FPGameProps) => {
  const { toast } = useToast();
  const [currentEvening, setCurrentEvening] = useState(evening);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [selectedClubA, setSelectedClubA] = useState<Club | null>(null);
  const [selectedClubB, setSelectedClubB] = useState<Club | null>(null);
  const [activeStep, setActiveStep] = useState<MatchStep>('teamA');
  const [scoreMode, setScoreMode] = useState<ScoreMode>('quick');
  const [winnerChoice, setWinnerChoice] = useState<WinnerChoice>(null);
  const [manualScoreSide, setManualScoreSide] = useState<'A' | 'B' | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const scoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentEvening(evening);
  }, [evening]);

  const currentMatch = currentEvening.schedule[currentEvening.currentMatchIndex] ?? null;

  // Reset state on match change
  useEffect(() => {
    if (!currentMatch) return;
    const hasClubA = currentMatch.clubA || null;
    const hasClubB = currentMatch.clubB || null;
    setSelectedClubA(hasClubA);
    setSelectedClubB(hasClubB);
    setScoreA(currentMatch.scoreA !== undefined ? String(currentMatch.scoreA) : '');
    setScoreB(currentMatch.scoreB !== undefined ? String(currentMatch.scoreB) : '');
    setScoreMode('quick');
    setWinnerChoice(null);
    setManualScoreSide(null);
    setShowSaved(false);
    // Determine starting step
    if (hasClubA && hasClubB) {
      setActiveStep('score');
    } else if (hasClubA) {
      setActiveStep('teamB');
    } else {
      setActiveStep('teamA');
    }
  }, [currentEvening.currentMatchIndex]);

  const handleSelectClubA = useCallback((club: Club) => {
    if (selectedClubA?.id === club.id) {
      setSelectedClubA(null);
      return;
    }
    setSelectedClubA(club);
    // Auto-advance to step 2
    setTimeout(() => setActiveStep('teamB'), 200);
  }, [selectedClubA]);

  const handleSelectClubB = useCallback((club: Club) => {
    if (selectedClubB?.id === club.id) {
      setSelectedClubB(null);
      return;
    }
    setSelectedClubB(club);
    // Auto-advance to score
    setTimeout(() => {
      setActiveStep('score');
      setTimeout(() => scoreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }, 200);
  }, [selectedClubB]);

  const handleQuickScore = useCallback((side: 'A' | 'B', value: number) => {
    if (side === 'A') {
      setScoreA(String(value));
      setManualScoreSide(null);
    } else {
      setScoreB(String(value));
      setManualScoreSide(null);
    }
  }, []);

  const handleWinnerShortcut = useCallback((scores: [number, number]) => {
    setScoreA(String(scores[0]));
    setScoreB(String(scores[1]));
    setManualScoreSide(null);
  }, []);

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

    setShowSaved(true);
    setTimeout(() => {
      setCurrentEvening(updated);
      onUpdateEvening(updated);
      setSelectedClubA(null);
      setSelectedClubB(null);
      setScoreA('');
      setScoreB('');
      setShowSaved(false);

      if (isComplete) {
        onComplete(updated);
      }
    }, 600);
  }, [currentEvening, currentMatch, selectedClubA, selectedClubB, scoreA, scoreB, onComplete, onUpdateEvening, toast]);

  const pairStats = calculatePairStats(currentEvening);
  const playerStats = calculatePlayerStats(currentEvening);

  if (!currentMatch) return null;

  const roundNum = currentMatch.roundIndex + 1;
  const matchInRound = currentMatch.matchIndex + 1;
  const totalMatches = currentEvening.schedule.length;

  const bankA = currentEvening.teamBanks.find(b => b.pairId === currentMatch.pairA.id)!;
  const bankB = currentEvening.teamBanks.find(b => b.pairId === currentMatch.pairB.id)!;

  const canSubmit = selectedClubA && selectedClubB && scoreA !== '' && scoreB !== '';
  const bothTeamsSelected = !!selectedClubA && !!selectedClubB;

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

  const stepNumber = (step: MatchStep) => step === 'teamA' ? 1 : step === 'teamB' ? 2 : 3;
  const currentStepNum = stepNumber(activeStep);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-3">
      {(['teamA', 'teamB', 'score'] as MatchStep[]).map((step, i) => {
        const num = i + 1;
        const isActive = activeStep === step;
        const isDone = step === 'teamA' ? !!selectedClubA
          : step === 'teamB' ? !!selectedClubB
          : (scoreA !== '' && scoreB !== '');
        const labels = ['קבוצה א׳', 'קבוצה ב׳', 'תוצאה'];
        return (
          <div key={step} className="flex items-center gap-1">
            {i > 0 && <div className={`w-6 h-0.5 ${isDone || isActive ? 'bg-neon-green/60' : 'bg-border/40'}`} />}
            <button
              onClick={() => {
                if (step === 'teamB' && !selectedClubA) return;
                if (step === 'score' && !bothTeamsSelected) return;
                setActiveStep(step);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                  : isDone
                    ? 'bg-neon-green/10 text-neon-green/70 border border-neon-green/20'
                    : 'bg-gaming-surface/50 text-muted-foreground border border-border/30'
              }`}
            >
              {isDone && !isActive ? <Check className="h-3 w-3" /> : <span>{num}</span>}
              <span>{labels[i]}</span>
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderTeamBank = (
    bank: FPTeamBank,
    selected: Club | null,
    onSelect: (c: Club) => void,
    label: string,
    step: MatchStep,
  ) => {
    const isActive = activeStep === step;
    const isCompleted = !!selected;
    const isLocked = step === 'teamB' && !selectedClubA;

    return (
      <Card className={`border p-3 transition-all duration-200 ${
        isActive
          ? 'bg-gradient-card border-neon-green/40 shadow-card shadow-neon-green/5'
          : isCompleted
            ? 'bg-gradient-card border-neon-green/20 shadow-card'
            : 'bg-gaming-surface/30 border-border/30 opacity-60'
      }`}>
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => {
            if (isLocked) return;
            setActiveStep(step);
          }}
        >
          <span className={`text-sm font-semibold ${isActive ? 'text-neon-green' : 'text-foreground'}`}>
            {label}
          </span>
          <div className="flex items-center gap-2">
            {selected && (
              <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">
                {selected.name} {renderStars(selected.stars)}
              </Badge>
            )}
            {!isLocked && (
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isActive ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>

        {isActive && (
          <div className="space-y-1 mt-2">
            {bank.clubs.map(club => {
              const isUsed = bank.usedClubIds.includes(club.id);
              const isSelected = selected?.id === club.id;
              return (
                <div
                  key={club.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm border transition-all ${
                    isSelected
                      ? 'border-neon-green bg-neon-green/15 scale-[1.01]'
                      : isUsed
                        ? 'border-border/20 bg-gaming-surface/20 opacity-30 pointer-events-none'
                        : 'border-border/40 bg-gaming-surface/80 cursor-pointer hover:border-neon-green/50 hover:bg-gaming-surface active:scale-[0.98]'
                  }`}
                  onClick={() => {
                    if (!isUsed) onSelect(club);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isUsed && !isSelected && (
                      <span className="text-[10px] text-muted-foreground/50 bg-muted/20 px-1.5 py-0.5 rounded">שוחק</span>
                    )}
                    <span className={`${isUsed && !isSelected ? 'line-through text-muted-foreground/40' : 'text-foreground'}`}>
                      {club.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(club.stars)}
                    {isSelected && <Check className="h-3.5 w-3.5 text-neon-green" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  const renderQuickScoreChips = (side: 'A' | 'B', value: string, onChange: (v: string) => void) => {
    const isManual = manualScoreSide === side;
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground text-center">
          {side === 'A' ? selectedClubA?.name : selectedClubB?.name}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {QUICK_SCORES.map(n => (
            <button
              key={n}
              onClick={() => handleQuickScore(side, n)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                value === String(n) && !isManual
                  ? 'bg-neon-green text-neon-green-foreground scale-105'
                  : 'bg-gaming-surface border border-border/50 text-foreground hover:border-neon-green/40 active:scale-95'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => {
              setManualScoreSide(side);
              onChange('');
            }}
            className={`px-2.5 h-9 rounded-lg text-xs font-medium transition-all ${
              isManual
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                : 'bg-gaming-surface border border-border/50 text-muted-foreground hover:border-neon-green/40'
            }`}
          >
            אחר
          </button>
        </div>
        {isManual && (
          <Input
            type="number"
            min="0"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="text-center text-lg font-bold bg-gaming-surface border-border w-20 mx-auto mt-1"
            inputMode="numeric"
            autoFocus
            placeholder="?"
          />
        )}
      </div>
    );
  };

  const renderWinnerMode = () => (
    <div className="space-y-3">
      <div className="flex gap-2 justify-center">
        {([
          { key: 'A' as const, label: `ניצחון ${pairName(currentMatch.pairA).split(' & ')[0]}` },
          { key: 'draw' as const, label: 'תיקו' },
          { key: 'B' as const, label: `ניצחון ${pairName(currentMatch.pairB).split(' & ')[0]}` },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => { setWinnerChoice(opt.key); setScoreA(''); setScoreB(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              winnerChoice === opt.key
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                : 'bg-gaming-surface border border-border/40 text-muted-foreground hover:border-neon-green/30'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {winnerChoice && (
        <div className="space-y-2">
          <div className="flex flex-wrap justify-center gap-2">
            {WINNER_SHORTCUTS[winnerChoice].map(([a, b]) => (
              <button
                key={`${a}-${b}`}
                onClick={() => handleWinnerShortcut([a, b])}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  scoreA === String(a) && scoreB === String(b)
                    ? 'bg-neon-green text-neon-green-foreground scale-105'
                    : 'bg-gaming-surface border border-border/40 text-foreground hover:border-neon-green/40 active:scale-95'
                }`}
              >
                {a} - {b}
              </button>
            ))}
            <button
              onClick={() => { setScoreMode('quick'); setWinnerChoice(null); setScoreA(''); setScoreB(''); }}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gaming-surface border border-border/40 text-muted-foreground hover:border-neon-green/40"
            >
              אחר
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderScoreEntry = () => {
    const isActive = activeStep === 'score';
    const isLocked = !bothTeamsSelected;

    return (
      <Card
        ref={scoreRef}
        className={`border p-3 transition-all duration-200 ${
          isActive
            ? 'bg-gradient-card border-neon-green/40 shadow-card shadow-neon-green/5'
            : isLocked
              ? 'bg-gaming-surface/30 border-border/30 opacity-40'
              : 'bg-gradient-card border-neon-green/20 shadow-card'
        }`}
      >
        <div
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={() => { if (!isLocked) setActiveStep('score'); }}
        >
          <span className={`text-sm font-semibold ${isActive ? 'text-neon-green' : 'text-foreground'}`}>
            תוצאה
          </span>
          {scoreA !== '' && scoreB !== '' && !isActive && (
            <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-xs">
              {scoreA} - {scoreB}
            </Badge>
          )}
        </div>

        {isActive && !isLocked && (
          <div className="space-y-3">
            {/* Mode toggle */}
            <div className="flex gap-1 justify-center">
              <button
                onClick={() => { setScoreMode('quick'); setWinnerChoice(null); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  scoreMode === 'quick'
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                    : 'bg-gaming-surface/50 text-muted-foreground border border-border/30'
                }`}
              >
                מהיר
              </button>
              <button
                onClick={() => { setScoreMode('winner'); setScoreA(''); setScoreB(''); setManualScoreSide(null); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  scoreMode === 'winner'
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                    : 'bg-gaming-surface/50 text-muted-foreground border border-border/30'
                }`}
              >
                לפי מנצח
              </button>
            </div>

            {scoreMode === 'winner' ? renderWinnerMode() : (
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {renderQuickScoreChips('A', scoreA, setScoreA)}
                </div>
                <span className="text-xl font-bold text-muted-foreground mt-7">:</span>
                <div className="flex-1">
                  {renderQuickScoreChips('B', scoreB, setScoreB)}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-[100svh] bg-gaming-bg p-3 pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
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
          <TabsList className="w-full grid grid-cols-3 mb-2">
            <TabsTrigger value="match">משחק</TabsTrigger>
            <TabsTrigger value="pairs">זוגות</TabsTrigger>
            <TabsTrigger value="players">שחקנים</TabsTrigger>
          </TabsList>

          <TabsContent value="match" className="space-y-2">
            {/* Saved confirmation overlay */}
            {showSaved && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-gaming-surface border border-neon-green/40 rounded-xl px-8 py-5 flex flex-col items-center gap-2 animate-in zoom-in-95 fade-in duration-300">
                  <Check className="h-10 w-10 text-neon-green" />
                  <span className="text-lg font-bold text-foreground">נשמר!</span>
                </div>
              </div>
            )}

            {/* Sitting out */}
            <Card className="bg-gaming-surface/50 border-border/50 p-2">
              <p className="text-center text-sm text-muted-foreground">
                יושב בחוץ: <strong className="text-foreground">{currentMatch.sittingOut.name}</strong>
              </p>
            </Card>

            {/* Match header */}
            <Card className="bg-gradient-card border-neon-green/20 p-3 shadow-card">
              <div className="text-center">
                <p className="text-base font-bold text-foreground">{pairName(currentMatch.pairA)}</p>
                <p className="text-xs text-muted-foreground my-0.5">vs</p>
                <p className="text-base font-bold text-foreground">{pairName(currentMatch.pairB)}</p>
              </div>
            </Card>

            {/* Step indicator */}
            {renderStepIndicator()}

            {/* Step 1: Team A */}
            {renderTeamBank(
              bankA, selectedClubA, handleSelectClubA,
              `בנק ${pairName(currentMatch.pairA)}`, 'teamA'
            )}

            {/* Step 2: Team B */}
            {renderTeamBank(
              bankB, selectedClubB, handleSelectClubB,
              `בנק ${pairName(currentMatch.pairB)}`, 'teamB'
            )}

            {/* Step 3: Score */}
            {renderScoreEntry()}

            {/* Submit */}
            <Button
              variant="gaming"
              className={`w-full transition-all duration-200 ${canSubmit ? 'scale-[1.02] shadow-lg shadow-neon-green/20' : ''}`}
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
