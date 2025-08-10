import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Users, 
  Play, 
  Pause, 
  RotateCcw,
  Crown
} from "lucide-react";
import { Home } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Evening, Round, Match, Pair, Club, PlayerStats } from "@/types/tournament";
import { FloatingScoreTable } from "@/components/FloatingScoreTable";
import { DiceScoreInput } from "@/components/DiceScoreInput";
import { TournamentEngine } from "@/services/tournamentEngine";
import { TeamSelector } from "@/services/teamSelector";
import { useToast } from "@/hooks/use-toast";

interface TournamentGameProps {
  evening: Evening;
  onBack: () => void;
  onComplete: (evening: Evening) => void;
  onGoHome: () => void;
  onUpdateEvening: (evening: Evening) => void;
}

export const TournamentGame = ({ evening, onBack, onComplete, onGoHome, onUpdateEvening }: TournamentGameProps) => {
  const { toast } = useToast();
  const [currentEvening, setCurrentEvening] = useState(evening);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentRoundPairs, setCurrentRoundPairs] = useState<Pair[]>([]); // Store pairs for current round
  const [originalTeamPools, setOriginalTeamPools] = useState<[Club[], Club[]]>([[], []]); // Keep original pools for the round
  const [teamPools, setTeamPools] = useState<[Club[], Club[]]>([[], []]);
  const [selectedClubs, setSelectedClubs] = useState<[Club | null, Club | null]>([null, null]);
  const [usedClubIds, setUsedClubIds] = useState<Set<string>>(new Set());
  const [gamePhase, setGamePhase] = useState<'team-selection' | 'countdown' | 'result-entry'>('team-selection');
  const [countdown, setCountdown] = useState(60);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [showRoundWinnerDialog, setShowRoundWinnerDialog] = useState(false);
  const [roundWinnerMessage, setRoundWinnerMessage] = useState('');
  const [pairSchedule] = useState<Pair[][]>(() => TournamentEngine.generatePairs(evening.players));

  // Initialize first round
  useEffect(() => {
    if (currentEvening.rounds.length === 0) {
      startNextRound(0);
    } else {
      loadCurrentRound();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCountdownActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
      setGamePhase('result-entry');
    }
    return () => clearInterval(interval);
  }, [isCountdownActive, countdown]);

  const startNextRound = (targetRoundIndex?: number) => {
    const roundIndex = targetRoundIndex ?? currentRound;
    const roundNumber = roundIndex + 1;
    const roundPairs = pairSchedule[roundIndex];
    
    if (!roundPairs) {
      // Tournament complete
      completeEvening();
      return;
    }

    // Store the pairs for this round
    setCurrentRoundPairs(roundPairs);

    const newRound = TournamentEngine.createRound(roundNumber, roundPairs, currentEvening.winsToComplete);
    
    const updatedEvening = {
      ...currentEvening,
      rounds: [...currentEvening.rounds, newRound]
    };
    setCurrentEvening(updatedEvening);
    onUpdateEvening(updatedEvening);
    // Do NOT reset used clubs between rounds; we want uniqueness across the entire evening
    // setUsedClubIds(new Set());
    
    // Generate team pools for the entire round, excluding clubs already used this evening
    const teamSelector = new TeamSelector();
    const maxMatches = currentEvening.winsToComplete * 2 - 1;
    console.log('Generating pools for round with maxMatches:', maxMatches);
    const pools = teamSelector.generateTeamPools(roundPairs, Array.from(usedClubIds), maxMatches);
    console.log('Generated pools:', pools);
    setOriginalTeamPools([pools[0], pools[1]]);
    setTeamPools([pools[0], pools[1]]);
    
    // Reset game state for new round
    setSelectedClubs([null, null]);
    setGamePhase('team-selection');
    
    // Create and start first match
    const firstMatch = TournamentEngine.createNextMatch(newRound, roundPairs);
    setCurrentMatch(firstMatch);
  };

  const createNextMatch = (evening: Evening, roundIndex: number, pairs?: Pair[]) => {
    // Use stored round pairs if pairs not provided
    const roundPairs = pairs || currentRoundPairs;
    const round = evening.rounds[roundIndex];
    
    // Check if round is complete or tied
    if (TournamentEngine.isRoundComplete(round, evening.winsToComplete)) {
      if (TournamentEngine.isRoundTied(round, evening.winsToComplete)) {
        // Create decider match
        const deciderMatch = TournamentEngine.createDeciderMatch(round, roundPairs);
        setCurrentMatch(deciderMatch);

        // For decider, don't pre-generate pools. We'll draw balanced teams via button.
        setTeamPools([[], []]);

        toast({
          title: "Sudden Death!",
          description: `Tied at ${evening.winsToComplete}-${evening.winsToComplete}. Tap \"Draw Balanced Teams\" to start the decider.`,
        });

        // Mark round as decider
        const updatedRound = { ...round, isDeciderMatch: true };
        const updatedEvening = {
          ...evening,
          rounds: [
            ...evening.rounds.slice(0, roundIndex),
            updatedRound,
            ...evening.rounds.slice(roundIndex + 1)
          ]
        };
        setCurrentEvening(updatedEvening);
        onUpdateEvening(updatedEvening);
      } else {
        // Round complete, move to next round
        handleRoundComplete();
      }
    } else {
      // Create next regular match
      const nextMatch = TournamentEngine.createNextMatch(round, roundPairs);
      setCurrentMatch(nextMatch);
      
      // Generate team pools if we don't have them yet or filter existing ones
      if (originalTeamPools[0].length === 0) {
        const teamSelector = new TeamSelector();
        const maxMatches = currentEvening.winsToComplete * 2 - 1;
        const pools = teamSelector.generateTeamPools(roundPairs, Array.from(usedClubIds), maxMatches);
        setOriginalTeamPools([pools[0], pools[1]]);
        setTeamPools([pools[0], pools[1]]);
      } else {
        // Filter original pools to remove used clubs
        const filteredPools: [Club[], Club[]] = [
          originalTeamPools[0].filter(club => !usedClubIds.has(club.id)),
          originalTeamPools[1].filter(club => !usedClubIds.has(club.id))
        ];
        setTeamPools(filteredPools);
      }
    }
    
    setSelectedClubs([null, null]);
    setGamePhase('team-selection');
  };

  const loadCurrentRound = () => {
    const round = currentEvening.rounds[currentRound];
    if (round && round.matches.length > 0) {
      // Load existing round - restore original pools and used clubs
      const allPairs = pairSchedule;
      const roundPairs = allPairs[currentRound];
      
      // Store the pairs for this round
      setCurrentRoundPairs(roundPairs);
      
      // Restore used clubs from all completed matches across the evening up to this round
      const usedIds = new Set<string>();
      currentEvening.rounds.forEach((r) => {
        r.matches.forEach(match => {
          if (match.completed) {
            usedIds.add(match.clubs[0].id);
            usedIds.add(match.clubs[1].id);
          }
        });
      });
      setUsedClubIds(usedIds);
      
      // Restore original team pools for this round, excluding already used clubs
      const teamSelector = new TeamSelector();
      const maxMatches = currentEvening.winsToComplete * 2 - 1;
      const pools = teamSelector.generateTeamPools(roundPairs, Array.from(usedIds), maxMatches);
      setOriginalTeamPools([pools[0], pools[1]]);
      
      createNextMatch(currentEvening, currentRound);
    }
  };

  const selectClub = (pairIndex: 0 | 1, club: Club) => {
    const newSelected = [...selectedClubs] as [Club | null, Club | null];
    newSelected[pairIndex] = club;
    setSelectedClubs(newSelected);

    // Add selected club to used clubs immediately
    const newUsedIds = new Set([...usedClubIds, club.id]);
    setUsedClubIds(newUsedIds);

    if (newSelected[0] && newSelected[1]) {
      // Both teams selected, start countdown
      setGamePhase('countdown');
      setCountdown(60);
      toast({
        title: "Teams Selected!",
        description: "60-second countdown started. Get ready to play!",
      });
    }
  };

  // Auto-draw balanced teams for decider matches (stars >= 4, diff <= 1)
  const drawDeciderTeams = () => {
    const teamSelector = new TeamSelector();
    const [club1, club2] = teamSelector.generateBalancedDeciderTeams(Array.from(usedClubIds), 4, 1);
    setSelectedClubs([club1, club2]);
    setUsedClubIds(new Set([...Array.from(usedClubIds), club1.id, club2.id]));
    setGamePhase('countdown');
    setCountdown(60);
    toast({
      title: 'Balanced Teams Drawn',
      description: `${club1.name} vs ${club2.name} (stars >= 4, diff <= 1)`,
    });
  };

  const toggleCountdown = () => {
    setIsCountdownActive(!isCountdownActive);
  };

  const resetCountdown = () => {
    setCountdown(60);
    setIsCountdownActive(false);
  };

  const submitResult = (score1: number, score2: number) => {
    if (!currentMatch) return;
    
    let winner: string;
    if (score1 > score2) {
      winner = currentMatch.pairs[0].id;
    } else if (score2 > score1) {
      winner = currentMatch.pairs[1].id;
    } else {
      // Draw - no winner
      winner = '';
    }

    const completedMatch: Match = {
      ...currentMatch,
      clubs: [selectedClubs[0]!, selectedClubs[1]!],
      score: [score1, score2],
      winner,
      completed: true
    };

    // Update round with completed match
    const round = currentEvening.rounds[currentRound];
    const updatedMatches = [...round.matches, completedMatch];
    
    // Update pair scores if there's a winner
    const updatedPairScores = { ...round.pairScores };
    if (winner) {
      updatedPairScores[winner] = (updatedPairScores[winner] || 0) + 1;
    }

    const updatedRound = {
      ...round,
      matches: updatedMatches,
      pairScores: updatedPairScores
    };

    const updatedEvening = {
      ...currentEvening,
      rounds: [
        ...currentEvening.rounds.slice(0, currentRound),
        updatedRound,
        ...currentEvening.rounds.slice(currentRound + 1)
      ]
    };

    setCurrentEvening(updatedEvening);
    onUpdateEvening(updatedEvening);

    // Calculate winner names for notification
    const winnerNames = winner ? 
      (winner === currentMatch.pairs[0].id ? 
        currentMatch.pairs[0].players.map(p => p.name).join(' + ') :
        currentMatch.pairs[1].players.map(p => p.name).join(' + ')
      ) : 'Draw';

    toast({
      title: `Match Complete!`,
      description: winner ? `${winnerNames} wins ${score1}-${score2}!` : `Draw ${score1}-${score2}`,
    });

    

    // Check if round is complete after this match using TournamentEngine
    console.log('Checking round completion:', {
      roundPairScores: updatedRound.pairScores,
      winsToComplete: currentEvening.winsToComplete,
      isComplete: TournamentEngine.isRoundComplete(updatedRound, currentEvening.winsToComplete),
      isTied: TournamentEngine.isRoundTied(updatedRound, currentEvening.winsToComplete)
    });
    if (TournamentEngine.isRoundComplete(updatedRound, currentEvening.winsToComplete)) {
      if (TournamentEngine.isRoundTied(updatedRound, currentEvening.winsToComplete)) {
        // Tie! Need decider match
        setTimeout(() => {
          createNextMatch(updatedEvening, currentRound);
        }, 2000);
      } else {
        // Round winner determined - announce winner
        const roundWinner = TournamentEngine.getRoundWinner(updatedRound);
        if (roundWinner) {
          const winnerPair = currentRoundPairs.find(pair => pair.id === roundWinner);
          if (winnerPair) {
            const winnerNames = winnerPair.players.map(p => p.name).join(' + ');
            setRoundWinnerMessage(`${winnerNames} wins Round ${currentRound + 1}!`);
            setShowRoundWinnerDialog(true);
          }
        }
      }
    } else {
      // Continue with next match
      setTimeout(() => {
        createNextMatch(updatedEvening, currentRound);
      }, 2000);
    }
  };

  const handleRoundWinnerConfirm = () => {
    setShowRoundWinnerDialog(false);
    handleRoundComplete();
  };

  const handleRoundComplete = () => {
    if (currentRound === 2) { 
      // Tournament complete
      completeEvening();
    } else {
      // Move to next round
      setCurrentRound(prev => {
        const next = prev + 1;
        startNextRound(next);
        return next;
      });
    }
  };

  const completeEvening = () => {
    const playerStats = TournamentEngine.calculatePlayerStats(currentEvening);
    const rankings = TournamentEngine.calculateRankings(playerStats);
    
    const completedEvening = {
      ...currentEvening,
      completed: true,
      rankings
    };

    onComplete(completedEvening);
  };

  const currentRoundData = currentEvening.rounds[currentRound];
  const currentRoundScore = currentRoundData && currentMatch ? 
    [currentRoundData.pairScores[currentMatch.pairs[0].id] || 0, currentRoundData.pairScores[currentMatch.pairs[1].id] || 0] : 
    [0, 0];
  const maxMatchesInRound = currentEvening.winsToComplete * 2 - 1;
  const completedMatches = currentRoundData ? currentRoundData.matches.filter(m => m.completed).length : 0;

  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">
              Round {currentRoundData?.number || 1}
            </h1>
            <p className="text-sm text-muted-foreground">
              First to {currentEvening.winsToComplete} wins
            </p>
            {currentRoundData && (
              <p className="text-lg font-bold text-neon-green">
                {currentRoundScore[0]} - {currentRoundScore[1]}
              </p>
            )}
          </div>
          <div>
            <Button variant="ghost" size="icon" onClick={onGoHome} aria-label="Home">
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Round Progress</span>
            <span>Matches {completedMatches} / {maxMatchesInRound}</span>
          </div>
          <Progress 
            value={currentRoundData ? (Math.max(...Object.values(currentRoundData.pairScores)) / currentEvening.winsToComplete) * 100 : 0} 
            className="h-2" 
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Tournament: Round {currentRound + 1}/3</span>
            <span>Matches {completedMatches} / {maxMatchesInRound}</span>
          </div>
        </div>

        {/* Current Matchup */}
        {currentMatch && (
          <Card className="bg-gradient-card border-neon-green/20 p-4 mb-6 shadow-card">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pair 1</p>
                <p className="font-semibold text-foreground">
                  {currentMatch.pairs[0].players.map(p => p.name).join(' + ')}
                </p>
                <p className="text-lg font-bold text-neon-green">{currentRoundScore[0]}</p>
              </div>
              <div className="text-neon-green font-bold text-xl">VS</div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pair 2</p>
                <p className="font-semibold text-foreground">
                  {currentMatch.pairs[1].players.map(p => p.name).join(' + ')}
                </p>
                <p className="text-lg font-bold text-neon-green">{currentRoundScore[1]}</p>
              </div>
            </div>
            {currentRoundData?.isDeciderMatch && (
              <div className="text-center mt-2">
                <Badge variant="destructive" className="animate-pulse">
                  Decider Match
                </Badge>
              </div>
            )}
          </Card>
        )}

        {/* Game Phases */}
        {gamePhase === 'team-selection' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center text-foreground">
              {currentRoundData?.isDeciderMatch ? "Decider Match - Balanced Teams" : "Select Your Teams"}
            </h2>

            {currentRoundData?.isDeciderMatch && (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">Stars ≥ 4, difference ≤ 1</p>
                <Button variant="gaming" onClick={drawDeciderTeams}>Draw Balanced Teams</Button>
              </div>
            )}
            {/* Debug info (hidden in decider) */}
            {!currentRoundData?.isDeciderMatch && (
              <div className="text-xs text-muted-foreground text-center">
                Team pools: {teamPools[0]?.length || 0} / {teamPools[1]?.length || 0}
              </div>
            )}

            
            {currentMatch && teamPools[0] && teamPools[1] && teamPools[0].length > 0 && teamPools[1].length > 0 ? (
              teamPools.map((pool, pairIndex) => (
                <Card key={pairIndex} className="bg-gaming-surface border-border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {currentMatch.pairs[pairIndex].players.map(p => p.name).join(' + ')}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {pool.map((club) => (
                      <Button
                        key={club.id}
                        variant={selectedClubs[pairIndex]?.id === club.id ? "gaming" : "hero"}
                        onClick={() => selectClub(pairIndex as 0 | 1, club)}
                        className="justify-between h-auto p-3"
                      >
                        <span className="font-medium">{club.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs ltr-numbers">
                            {club.stars}★
                          </Badge>
                          {club.isNational && (
                            <Badge variant="outline" className="text-xs">
                              National
                            </Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Loading teams...</p>
                <p className="text-xs mt-2">Pools: {JSON.stringify(teamPools.map(p => p?.length || 0))}</p>
              </div>
            )}
          </div>
        )}

        {gamePhase === 'countdown' && (
          <div className="text-center space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Get Ready to Play!</h2>
            
            {/* Selected Teams */}
            <div className="grid grid-cols-2 gap-4">
              {selectedClubs.map((club, index) => (
                club && (
                  <Card key={index} className="bg-gaming-surface border-neon-green/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {currentMatch?.pairs[index].players.map(p => p.name).join(' + ')}
                    </p>
                    <p className="font-semibold text-neon-green text-sm">{club.name}</p>
                  </Card>
                )
              ))}
            </div>

            {/* Countdown */}
            <Card className="bg-gradient-card border-neon-green/20 p-8 shadow-glow">
              <div className="text-center">
                <Clock className="h-12 w-12 text-neon-green mx-auto mb-4 animate-glow-pulse" />
                <div className="text-4xl font-bold text-neon-green mb-4">
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex justify-center gap-4">
                  <Button variant="gaming" onClick={toggleCountdown}>
                    {isCountdownActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isCountdownActive ? 'Pause' : 'Start'}
                  </Button>
                  <Button variant="outline" onClick={resetCountdown}>
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            <Button 
              variant="neon" 
              onClick={() => setGamePhase('result-entry')}
              className="w-full"
            >
              Skip to Result Entry
            </Button>
          </div>
        )}

        {gamePhase === 'result-entry' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-center text-foreground">Enter Match Result</h2>
            
            {/* Selected Teams Display */}
            <div className="grid grid-cols-2 gap-4">
              {selectedClubs.map((club, index) => (
                club && (
                  <Card key={index} className="bg-gaming-surface border-neon-green/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {currentMatch?.pairs[index].players.map(p => p.name).join(' + ')}
                    </p>
                    <p className="font-semibold text-neon-green">{club.name}</p>
                  </Card>
                )
              ))}
            </div>

            {/* Dice Score Input */}
            <DiceScoreInput onSubmit={submitResult} />
          </div>
        )}

        {/* Round Winner Dialog */}
        <Dialog open={showRoundWinnerDialog} onOpenChange={setShowRoundWinnerDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-center">
                <Crown className="w-6 h-6 text-yellow-500" />
                Round Complete!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-6">
              <div className="text-lg font-bold text-primary mb-4">
                {roundWinnerMessage}
              </div>
              <Button onClick={handleRoundWinnerConfirm} className="w-full">
                Continue to Next Round
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Score Table Component */}
        <FloatingScoreTable evening={currentEvening} />
      </div>
    </div>
  );
};