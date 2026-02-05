import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Star, Trophy, AlertCircle } from "lucide-react";
import { Club, Pair } from "@/types/tournament";
import { TriviaQuestion } from "@/data/triviaQuestions";

type PhaseState = 'guessing' | 'reveal' | 'picking';

interface TierQuestionPhaseProps {
  tierLabel: string;
  tierStars: number;
  isPrime?: boolean;
  availableTeams: Club[];
  question: TriviaQuestion;
  pairs: [Pair, Pair];
  onComplete: (result: {
    winnerPairId: string;
    chosenClubId: string;
    pair1Guess: number;
    pair2Guess: number;
  }) => void;
  onTiebreaker: () => void; // Request another question for tiebreaker
  isTiebreaker?: boolean;
}

export const TierQuestionPhase = ({
  tierLabel,
  tierStars,
  isPrime,
  availableTeams,
  question,
  pairs,
  onComplete,
  onTiebreaker,
  isTiebreaker = false,
}: TierQuestionPhaseProps) => {
  const [phase, setPhase] = useState<PhaseState>('guessing');
  const [pair1Guess, setPair1Guess] = useState<number>(Math.floor((question.min_value + question.max_value) / 2));
  const [pair2Guess, setPair2Guess] = useState<number>(Math.floor((question.min_value + question.max_value) / 2));
  const [winnerPairId, setWinnerPairId] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const pair1Names = pairs[0].players.map(p => p.name).join(' + ');
  const pair2Names = pairs[1].players.map(p => p.name).join(' + ');

  const handleSubmitGuesses = () => {
    const dist1 = Math.abs(pair1Guess - question.correct_answer);
    const dist2 = Math.abs(pair2Guess - question.correct_answer);

    if (dist1 === dist2) {
      // Tie - request another question
      onTiebreaker();
      return;
    }

    const winner = dist1 < dist2 ? pairs[0].id : pairs[1].id;
    setWinnerPairId(winner);
    setPhase('reveal');
  };

  const handlePickTeam = () => {
    if (!selectedClubId || !winnerPairId) return;
    onComplete({
      winnerPairId,
      chosenClubId: selectedClubId,
      pair1Guess,
      pair2Guess,
    });
  };

  const handleContinueToPicking = () => {
    setPhase('picking');
  };

  const dist1 = Math.abs(pair1Guess - question.correct_answer);
  const dist2 = Math.abs(pair2Guess - question.correct_answer);

  const renderStars = (count: number) => {
    return Array.from({ length: Math.floor(count) }).map((_, i) => (
      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
    ));
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Tier Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          {isPrime ? (
            <Badge variant="outline" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              PRIME
            </Badge>
          ) : (
            <div className="flex items-center gap-1">
              {renderStars(tierStars)}
            </div>
          )}
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {isTiebreaker ? '🎯 שאלת הכרעה!' : `קבוצות ${tierLabel}`}
        </h2>
      </div>

      {/* Available Teams Display */}
      {phase === 'guessing' && (
        <Card className="bg-gaming-surface/50 border-border/50 p-3">
          <p className="text-xs text-muted-foreground mb-2 text-center">
            קבוצות זמינות ({availableTeams.length})
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {availableTeams.map(team => (
              <Badge 
                key={team.id} 
                variant="outline" 
                className="text-xs bg-gaming-surface"
              >
                {team.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Question Card */}
      <Card className="bg-gradient-card border-neon-purple/30 p-4">
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-neon-purple shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {question.question_text}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              מקור: {question.source}
            </p>
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          טווח: {question.min_value.toLocaleString()} - {question.max_value.toLocaleString()}
        </div>
      </Card>

      {/* Guessing Phase */}
      {phase === 'guessing' && (
        <div className="space-y-4">
          {/* Pair 1 Input */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">{pair1Names}</span>
              <span className="text-lg font-bold text-neon-green">{pair1Guess.toLocaleString()}</span>
            </div>
            <Slider
              value={[pair1Guess]}
              min={question.min_value}
              max={question.max_value}
              step={1}
              onValueChange={(value) => setPair1Guess(value[0])}
              className="mb-2"
            />
            <Input
              type="number"
              value={pair1Guess}
              onChange={(e) => {
                const val = parseInt(e.target.value) || question.min_value;
                setPair1Guess(Math.min(Math.max(val, question.min_value), question.max_value));
              }}
              min={question.min_value}
              max={question.max_value}
              className="bg-gaming-bg border-border text-center"
            />
          </Card>

          {/* Pair 2 Input */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">{pair2Names}</span>
              <span className="text-lg font-bold text-neon-purple">{pair2Guess.toLocaleString()}</span>
            </div>
            <Slider
              value={[pair2Guess]}
              min={question.min_value}
              max={question.max_value}
              step={1}
              onValueChange={(value) => setPair2Guess(value[0])}
              className="mb-2"
            />
            <Input
              type="number"
              value={pair2Guess}
              onChange={(e) => {
                const val = parseInt(e.target.value) || question.min_value;
                setPair2Guess(Math.min(Math.max(val, question.min_value), question.max_value));
              }}
              min={question.min_value}
              max={question.max_value}
              className="bg-gaming-bg border-border text-center"
            />
          </Card>

          <Button
            variant="gaming"
            className="w-full"
            onClick={handleSubmitGuesses}
          >
            גלה תשובה
          </Button>
        </div>
      )}

      {/* Reveal Phase */}
      {phase === 'reveal' && (
        <div className="space-y-4">
          {/* Correct Answer */}
          <Card className="bg-neon-green/10 border-neon-green/30 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">התשובה הנכונה</p>
            <p className="text-3xl font-bold text-neon-green">
              {question.correct_answer.toLocaleString()}
            </p>
          </Card>

          {/* Results */}
          <div className="grid grid-cols-2 gap-3">
            <Card className={`p-3 ${winnerPairId === pairs[0].id ? 'bg-neon-green/10 border-neon-green/50' : 'bg-gaming-surface/50 border-border/50'}`}>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{pair1Names}</p>
                <p className="text-lg font-bold text-foreground">{pair1Guess.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">מרחק: {dist1.toLocaleString()}</p>
                {winnerPairId === pairs[0].id && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">מנצח!</span>
                  </div>
                )}
              </div>
            </Card>
            <Card className={`p-3 ${winnerPairId === pairs[1].id ? 'bg-neon-green/10 border-neon-green/50' : 'bg-gaming-surface/50 border-border/50'}`}>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{pair2Names}</p>
                <p className="text-lg font-bold text-foreground">{pair2Guess.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">מרחק: {dist2.toLocaleString()}</p>
                {winnerPairId === pairs[1].id && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">מנצח!</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Button
            variant="gaming"
            className="w-full"
            onClick={handleContinueToPicking}
          >
            בחר קבוצה
          </Button>
        </div>
      )}

      {/* Picking Phase */}
      {phase === 'picking' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {winnerPairId === pairs[0].id ? pair1Names : pair2Names} בוחרים
            </p>
            <p className="text-xs text-muted-foreground">
              בחרו קבוצה אחת מהרשימה
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {availableTeams.map(team => (
              <Card
                key={team.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedClubId === team.id
                    ? 'bg-neon-green/20 border-neon-green'
                    : 'bg-gaming-surface/50 border-border/50 hover:border-neon-green/50'
                }`}
                onClick={() => setSelectedClubId(team.id)}
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{team.name}</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {renderStars(team.stars)}
                  </div>
                  {team.isPrime && (
                    <Badge variant="outline" className="mt-1 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                      PRIME
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="gaming"
            className="w-full"
            onClick={handlePickTeam}
            disabled={!selectedClubId}
          >
            אישור בחירה
          </Button>
        </div>
      )}
    </div>
  );
};
