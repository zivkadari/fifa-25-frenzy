import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Star } from "lucide-react";
import { Evening, Pair, Club, TierQuestionRoundState } from "@/types/tournament";
import { TierQuestionPhase } from "@/components/TierQuestionPhase";
import { getRandomQuestion, getTierConfig, TriviaQuestion } from "@/data/triviaQuestions";
import { getClubsOnly, getNationalTeamsByStars, getPrimeTeams } from "@/data/clubs";

interface TierQuestionFlowProps {
  evening: Evening;
  pairs: [Pair, Pair];
  clubsWithOverrides: Club[];
  onBack: () => void;
  onComplete: (pools: [Club[], Club[]]) => void;
  onUpdateEvening: (evening: Evening) => void;
}

interface TierResult {
  tierIndex: number;
  winnerPairId: string;
  chosenClubId: string;
  pair1Assignments: Club[];
  pair2Assignments: Club[];
}

export const TierQuestionFlow = ({
  evening,
  pairs,
  clubsWithOverrides,
  onBack,
  onComplete,
  onUpdateEvening,
}: TierQuestionFlowProps) => {
  const tierConfig = getTierConfig(evening.winsToComplete);
  
  // Initialize state from evening or fresh
  const initialState: TierQuestionRoundState = evening.tierQuestionState || {
    currentTierIndex: 0,
    tiersCompleted: [],
    pairTeamChoices: { [pairs[0].id]: [], [pairs[1].id]: [] },
    usedQuestionIds: [],
  };

  const [currentTierIndex, setCurrentTierIndex] = useState(initialState.currentTierIndex);
  const [tiersCompleted, setTiersCompleted] = useState<TierResult[]>([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState<number[]>(initialState.usedQuestionIds);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [currentTierTeams, setCurrentTierTeams] = useState<Club[]>([]); // Store teams for current tier
  const [pair1Pool, setPair1Pool] = useState<Club[]>([]);
  const [pair2Pool, setPair2Pool] = useState<Club[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isTiebreaker, setIsTiebreaker] = useState(false);

  // Get available teams for current tier
  const getTeamsForTier = (tierIndex: number): Club[] => {
    const tier = tierConfig[tierIndex];
    if (!tier) return [];

    // Get all used club IDs from completed tiers
    const usedClubIds = new Set<string>();
    tiersCompleted.forEach(result => {
      result.pair1Assignments.forEach(c => usedClubIds.add(c.id));
      result.pair2Assignments.forEach(c => usedClubIds.add(c.id));
    });

    let sourceClubs: Club[];
    if (tier.isPrime) {
      sourceClubs = getPrimeTeams(clubsWithOverrides);
    } else if (tier.stars === 5) {
      sourceClubs = [
        ...getClubsOnly(5, clubsWithOverrides),
        ...getNationalTeamsByStars(5, clubsWithOverrides),
      ];
    } else if (tier.stars === 4.5) {
      sourceClubs = [
        ...getClubsOnly(4.5, clubsWithOverrides),
        ...getNationalTeamsByStars(4.5, clubsWithOverrides),
      ];
    } else {
      sourceClubs = [
        ...getClubsOnly(4, clubsWithOverrides),
        ...getNationalTeamsByStars(4, clubsWithOverrides),
      ];
    }

    // Filter out already used clubs
    const available = sourceClubs.filter(c => !usedClubIds.has(c.id));
    
    // Shuffle and take required count * 2 (for both pairs)
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, tier.count * 2);
  };

  // Initialize teams and question for current tier
  useEffect(() => {
    if (currentTierIndex < tierConfig.length) {
      // Calculate available teams once when entering a new tier
      if (currentTierTeams.length === 0) {
        const teams = getTeamsForTier(currentTierIndex);
        setCurrentTierTeams(teams);
      }
      
      // Get a new question if we don't have one
      if (!currentQuestion) {
        const question = getRandomQuestion(usedQuestionIds);
        if (question) {
          setCurrentQuestion(question);
          setUsedQuestionIds(prev => [...prev, question.id]);
        }
      }
    }
  }, [currentTierIndex, currentQuestion, currentTierTeams.length]);

  const handleTierComplete = (result: {
    winnerPairId: string;
    chosenClubId: string;
    pair1Guess: number;
    pair2Guess: number;
  }) => {
    const tier = tierConfig[currentTierIndex];
    const availableTeams = getTeamsForTier(currentTierIndex);
    const chosenClub = availableTeams.find(c => c.id === result.chosenClubId)!;
    const remainingTeams = availableTeams.filter(c => c.id !== result.chosenClubId);

    // Distribute remaining teams evenly
    // Winner gets the chosen club + half of remaining (minus 1 since they already have one)
    // Loser gets the other half
    const teamsPerPair = tier.count;
    const winnerIsP1 = result.winnerPairId === pairs[0].id;

    // Winner gets chosen + (teamsPerPair - 1) from remaining
    // Loser gets teamsPerPair from remaining
    const shuffledRemaining = [...remainingTeams].sort(() => Math.random() - 0.5);
    
    let pair1Assignments: Club[];
    let pair2Assignments: Club[];

    if (winnerIsP1) {
      pair1Assignments = [chosenClub, ...shuffledRemaining.slice(0, teamsPerPair - 1)];
      pair2Assignments = shuffledRemaining.slice(teamsPerPair - 1, teamsPerPair * 2 - 1);
    } else {
      pair2Assignments = [chosenClub, ...shuffledRemaining.slice(0, teamsPerPair - 1)];
      pair1Assignments = shuffledRemaining.slice(teamsPerPair - 1, teamsPerPair * 2 - 1);
    }

    const tierResult: TierResult = {
      tierIndex: currentTierIndex,
      winnerPairId: result.winnerPairId,
      chosenClubId: result.chosenClubId,
      pair1Assignments,
      pair2Assignments,
    };

    const newTiersCompleted = [...tiersCompleted, tierResult];
    setTiersCompleted(newTiersCompleted);

    // Update evening state
    const newState: TierQuestionRoundState = {
      currentTierIndex: currentTierIndex + 1,
      tiersCompleted: newTiersCompleted.map(t => t.tierIndex),
      pairTeamChoices: {
        [pairs[0].id]: newTiersCompleted.flatMap(t => t.pair1Assignments.map(c => c.id)),
        [pairs[1].id]: newTiersCompleted.flatMap(t => t.pair2Assignments.map(c => c.id)),
      },
      usedQuestionIds,
    };

    // Move to next tier or complete
    if (currentTierIndex + 1 >= tierConfig.length) {
      // All tiers complete - build final pools
      const finalPair1Pool = newTiersCompleted.flatMap(t => t.pair1Assignments);
      const finalPair2Pool = newTiersCompleted.flatMap(t => t.pair2Assignments);
      
      setPair1Pool(finalPair1Pool);
      setPair2Pool(finalPair2Pool);
      newState.assignedPools = [finalPair1Pool, finalPair2Pool];
      
      const updatedEvening = { ...evening, tierQuestionState: newState };
      onUpdateEvening(updatedEvening);
      
      setShowSummary(true);
    } else {
      const updatedEvening = { ...evening, tierQuestionState: newState };
      onUpdateEvening(updatedEvening);
      
      setCurrentTierIndex(currentTierIndex + 1);
      setCurrentQuestion(null);
      setIsTiebreaker(false);
    }
  };

  const handleTiebreaker = () => {
    // Get a new question for tiebreaker
    const question = getRandomQuestion(usedQuestionIds);
    if (question) {
      setUsedQuestionIds(prev => [...prev, question.id]);
      setCurrentQuestion(question);
      setIsTiebreaker(true);
    }
  };

  const handleStartGame = () => {
    onComplete([pair1Pool, pair2Pool]);
  };

  const renderStars = (count: number) => {
    return Array.from({ length: Math.floor(count) }).map((_, i) => (
      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400 inline-block" />
    ));
  };

  // Summary view after all tiers complete
  if (showSummary) {
    return (
      <div className="min-h-screen bg-gaming-bg p-4" dir="rtl">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <CheckCircle className="h-12 w-12 text-neon-green mx-auto mb-2" />
            <h1 className="text-xl font-bold text-foreground">חלוקת הקבוצות הושלמה!</h1>
          </div>

          <div className="space-y-4">
            {/* Pair 1 Pool */}
            <Card className="bg-gaming-surface/50 border-neon-green/30 p-4">
              <h3 className="text-sm font-bold text-neon-green mb-3">
                {pairs[0].players.map(p => p.name).join(' + ')}
              </h3>
              <div className="space-y-2">
                {pair1Pool.map(club => (
                  <div key={club.id} className="flex items-center justify-between bg-gaming-bg/50 rounded-md p-2">
                    <span className="text-sm text-foreground">{club.name}</span>
                    <div className="flex items-center gap-1">
                      {renderStars(club.stars)}
                      {club.isPrime && (
                        <Badge variant="outline" className="text-[10px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 ml-1">
                          P
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground text-center">
                סה"כ כוכבים: {pair1Pool.reduce((sum, c) => sum + c.stars, 0)}
              </div>
            </Card>

            {/* Pair 2 Pool */}
            <Card className="bg-gaming-surface/50 border-neon-purple/30 p-4">
              <h3 className="text-sm font-bold text-neon-purple mb-3">
                {pairs[1].players.map(p => p.name).join(' + ')}
              </h3>
              <div className="space-y-2">
                {pair2Pool.map(club => (
                  <div key={club.id} className="flex items-center justify-between bg-gaming-bg/50 rounded-md p-2">
                    <span className="text-sm text-foreground">{club.name}</span>
                    <div className="flex items-center gap-1">
                      {renderStars(club.stars)}
                      {club.isPrime && (
                        <Badge variant="outline" className="text-[10px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 ml-1">
                          P
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground text-center">
                סה"כ כוכבים: {pair2Pool.reduce((sum, c) => sum + c.stars, 0)}
              </div>
            </Card>
          </div>

          <Button
            variant="gaming"
            className="w-full mt-6"
            onClick={handleStartGame}
          >
            התחל משחק!
          </Button>
        </div>
      </div>
    );
  }

  // Current tier question phase
  const currentTier = tierConfig[currentTierIndex];
  const availableTeams = getTeamsForTier(currentTierIndex);

  return (
    <div className="min-h-screen bg-gaming-bg p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">בחירת קבוצות</h1>
            <p className="text-xs text-muted-foreground">
              שלב {currentTierIndex + 1} מתוך {tierConfig.length}
            </p>
          </div>
          {/* Progress indicator */}
          <div className="flex gap-1">
            {tierConfig.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < currentTierIndex
                    ? 'bg-neon-green'
                    : i === currentTierIndex
                    ? 'bg-neon-purple'
                    : 'bg-gaming-surface'
                }`}
              />
            ))}
          </div>
        </div>

        {currentQuestion && (
          <TierQuestionPhase
            tierLabel={currentTier.label}
            tierStars={currentTier.stars}
            isPrime={currentTier.isPrime}
            availableTeams={availableTeams}
            question={currentQuestion}
            pairs={pairs}
            onComplete={handleTierComplete}
            onTiebreaker={handleTiebreaker}
            isTiebreaker={isTiebreaker}
          />
        )}
      </div>
    </div>
  );
};
