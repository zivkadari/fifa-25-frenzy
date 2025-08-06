import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ChevronUp,
  ChevronDown,
  Crown
} from "lucide-react";
import { Evening, Round, Match, Pair, Club, PlayerStats } from "@/types/tournament";
import { TournamentEngine } from "@/services/tournamentEngine";
import { TeamSelector } from "@/services/teamSelector";
import { useToast } from "@/hooks/use-toast";

interface TournamentGameProps {
  evening: Evening;
  onBack: () => void;
  onComplete: (evening: Evening) => void;
}

export const TournamentGame = ({ evening, onBack, onComplete }: TournamentGameProps) => {
  const { toast } = useToast();
  const [currentEvening, setCurrentEvening] = useState(evening);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [originalTeamPools, setOriginalTeamPools] = useState<[Club[], Club[]]>([[], []]); // Keep original pools for the round
  const [teamPools, setTeamPools] = useState<[Club[], Club[]]>([[], []]);
  const [selectedClubs, setSelectedClubs] = useState<[Club | null, Club | null]>([null, null]);
  const [usedClubIds, setUsedClubIds] = useState<Set<string>>(new Set());
  const [gamePhase, setGamePhase] = useState<'team-selection' | 'countdown' | 'result-entry'>('team-selection');
  const [countdown, setCountdown] = useState(60);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [showScoreboard, setShowScoreboard] = useState(false);

  // Initialize first round
  useEffect(() => {
    if (currentEvening.rounds.length === 0) {
      startNextRound();
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

  const startNextRound = () => {
    const roundNumber = currentRound + 1;
    const allPairs = TournamentEngine.generatePairs(currentEvening.players);
    const roundPairs = allPairs[currentRound];
    
    if (!roundPairs) {
      // Tournament complete
      completeEvening();
      return;
    }

    const newRound = TournamentEngine.createRound(roundNumber, roundPairs, currentEvening.winsToComplete);
    
    const updatedEvening = {
      ...currentEvening,
      rounds: [...currentEvening.rounds, newRound]
    };
    setCurrentEvening(updatedEvening);
    setUsedClubIds(new Set());
    
    // Generate team pools for the entire round
    const teamSelector = new TeamSelector();
    const maxMatches = currentEvening.winsToComplete * 2 - 1;
    console.log('Generating pools for round with maxMatches:', maxMatches);
    const pools = teamSelector.generateTeamPools(roundPairs, [], maxMatches);
    console.log('Generated pools:', pools);
    setOriginalTeamPools([pools[0], pools[1]]);
    setTeamPools([pools[0], pools[1]]);
    
    // Create and start first match - this will set team pools
    setTimeout(() => {
      createNextMatch(updatedEvening, currentRound, roundPairs);
    }, 100);
  };

  const createNextMatch = (evening: Evening, roundIndex: number, pairs: Pair[]) => {
    const round = evening.rounds[roundIndex];
    
    // Check if round is complete or tied
    if (TournamentEngine.isRoundComplete(round, evening.winsToComplete)) {
      if (TournamentEngine.isRoundTied(round, evening.winsToComplete)) {
        // Create decider match
        const deciderMatch = TournamentEngine.createDeciderMatch(round, pairs);
        setCurrentMatch(deciderMatch);
        
        // Generate random clubs for decider match (1 club each)
        const teamSelector = new TeamSelector();
        const randomClubs = teamSelector.generateTeamPools(pairs, Array.from(usedClubIds), 1);
        setTeamPools([randomClubs[0], randomClubs[1]]);
        
        toast({
          title: "Sudden Death!",
          description: `Tied at ${evening.winsToComplete}-${evening.winsToComplete}! Random teams selected for decider match.`,
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
      } else {
        // Round complete, move to next round
        handleRoundComplete();
      }
    } else {
      // Create next regular match
      const nextMatch = TournamentEngine.createNextMatch(round, pairs);
      setCurrentMatch(nextMatch);
      
      // Filter original pools to remove used clubs
      const filteredPools: [Club[], Club[]] = [
        originalTeamPools[0].filter(club => !usedClubIds.has(club.id)),
        originalTeamPools[1].filter(club => !usedClubIds.has(club.id))
      ];
      setTeamPools(filteredPools);
    }
    
    setSelectedClubs([null, null]);
    setGamePhase('team-selection');
  };

  const loadCurrentRound = () => {
    const round = currentEvening.rounds[currentRound];
    if (round && round.matches.length > 0) {
      // Load existing round - restore original pools and used clubs
      const allPairs = TournamentEngine.generatePairs(currentEvening.players);
      const roundPairs = allPairs[currentRound];
      
      // Restore original team pools for this round
      const teamSelector = new TeamSelector();
      const maxMatches = currentEvening.winsToComplete * 2 - 1;
      const pools = teamSelector.generateTeamPools(roundPairs, [], maxMatches);
      setOriginalTeamPools([pools[0], pools[1]]);
      
      // Restore used clubs from completed matches
      const usedIds = new Set<string>();
      round.matches.forEach(match => {
        if (match.completed) {
          usedIds.add(match.clubs[0].id);
          usedIds.add(match.clubs[1].id);
        }
      });
      setUsedClubIds(usedIds);
      
      createNextMatch(currentEvening, currentRound, roundPairs);
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

  const toggleCountdown = () => {
    setIsCountdownActive(!isCountdownActive);
  };

  const resetCountdown = () => {
    setCountdown(60);
    setIsCountdownActive(false);
  };

  const submitResult = () => {
    if (!scoreInput.match(/^\d+-\d+$/)) {
      toast({
        title: "Invalid Score",
        description: "Please enter score in format: 3-1",
        variant: "destructive",
      });
      return;
    }

    if (!currentMatch) return;

    const [score1, score2] = scoreInput.split('-').map(Number);
    
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

    setScoreInput('');

    // Check if round is complete after this match
    const newPairScores = updatedPairScores;
    const maxScore = Math.max(...Object.values(newPairScores));
    
    if (maxScore >= currentEvening.winsToComplete) {
      // Check for tie
      const scores = Object.values(newPairScores);
      if (scores.filter(s => s === currentEvening.winsToComplete).length === 2) {
        // Tie! Need decider match
        setTimeout(() => {
          const allPairs = TournamentEngine.generatePairs(currentEvening.players);
          const roundPairs = allPairs[currentRound];
          createNextMatch(updatedEvening, currentRound, roundPairs);
        }, 2000);
      } else {
        // Round winner determined
        setTimeout(() => {
          handleRoundComplete();
        }, 2000);
      }
    } else {
      // Continue with next match
      setTimeout(() => {
        const allPairs = TournamentEngine.generatePairs(currentEvening.players);
        const roundPairs = allPairs[currentRound];
        createNextMatch(updatedEvening, currentRound, roundPairs);
      }, 2000);
    }
  };

  const handleRoundComplete = () => {
    if (currentRound === 2) { 
      // Tournament complete
      completeEvening();
    } else {
      // Move to next round
      setCurrentRound(prev => prev + 1);
      startNextRound();
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
  const currentRoundScore = currentRoundData ? Object.values(currentRoundData.pairScores) : [0, 0];

  return (
    <div className="min-h-screen bg-gaming-bg p-4">
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
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowScoreboard(!showScoreboard)}
          >
            {showScoreboard ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Round Progress</span>
            <span>Match {(currentRoundData?.matches.length || 0) + 1}</span>
          </div>
          <Progress 
            value={currentRoundData ? (Math.max(...Object.values(currentRoundData.pairScores)) / currentEvening.winsToComplete) * 100 : 0} 
            className="h-2" 
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Tournament: Round {currentRound + 1}/3</span>
            <span>Max {currentEvening.winsToComplete * 2 - 1} matches</span>
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
                  SUDDEN DEATH
                </Badge>
              </div>
            )}
          </Card>
        )}

        {/* Game Phases */}
        {gamePhase === 'team-selection' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center text-foreground">
              {currentRoundData?.isDeciderMatch ? "Sudden Death - Random Teams" : "Select Your Teams"}
            </h2>
            
            {/* Debug info */}
            <div className="text-xs text-muted-foreground text-center">
              Pools length: {teamPools[0]?.length || 0} / {teamPools[1]?.length || 0}
            </div>
            
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
                          <Badge variant="secondary" className="text-xs">
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

            {/* Score Input */}
            <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
              <div className="text-center space-y-4">
                <Trophy className="h-8 w-8 text-neon-green mx-auto" />
                <div>
                  <Label className="text-sm text-muted-foreground">Final Score</Label>
                  <Input
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    placeholder="e.g., 3-1"
                    className="text-center text-lg font-bold bg-gaming-surface border-border focus:border-neon-green mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: Team1-Team2 (e.g., 3-1)
                  </p>
                </div>
                <Button variant="gaming" size="lg" onClick={submitResult} className="w-full">
                  Submit Result
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Collapsible Scoreboard */}
        {showScoreboard && (
          <Card className="mt-6 bg-gaming-surface border-border p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-neon-green" />
              Live Scoreboard
            </h3>
            <div className="space-y-3 text-sm">
              {currentEvening.rounds.map((round, roundIndex) => 
                round.matches.filter(match => match.completed).map((match, matchIndex) => (
                  <div key={`${roundIndex}-${matchIndex}`} className="border-b border-border/30 pb-3 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground text-xs">
                        Round {round.number} - Match {matchIndex + 1}
                        {round.isDeciderMatch && matchIndex === round.matches.length - 1 && " (Decider)"}
                      </span>
                      <span className="font-bold text-neon-green text-lg">
                        {match.score?.[0]}-{match.score?.[1]}
                      </span>
                    </div>
                    
                    {/* Teams and players */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-left">
                        <p className="text-muted-foreground">{match.pairs[0].players.map(p => p.name).join(' + ')}</p>
                        <p className="text-foreground">{match.clubs[0].name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">{match.pairs[1].players.map(p => p.name).join(' + ')}</p>
                        <p className="text-foreground">{match.clubs[1].name}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};