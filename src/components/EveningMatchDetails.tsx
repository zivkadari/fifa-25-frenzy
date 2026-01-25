import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Trophy, Target, Flame } from "lucide-react";
import { Evening, Match, Round, PlayerStats } from "@/types/tournament";
import { TournamentEngine } from "@/services/tournamentEngine";
import { useState } from "react";

interface EveningMatchDetailsProps {
  evening: Evening;
}

export const EveningMatchDetails = ({ evening }: EveningMatchDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate evening statistics
  const stats = calculateEveningStats(evening);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-2 px-1 hover:bg-muted/50 rounded transition-colors">
          <span className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-neon-green" />
            פרטי משחקים וסטטיסטיקות
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        {/* Evening Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">סה״כ גולים</p>
            <p className="text-lg font-bold text-neon-green">{stats.totalGoals}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">משחקים</p>
            <p className="text-lg font-bold text-foreground">{stats.totalMatches}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">תיקו</p>
            <p className="text-lg font-bold text-foreground">{stats.draws}</p>
          </div>
        </div>

        {/* Highest Scoring Match */}
        {stats.highestScoringMatch && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-400">המשחק עם הכי הרבה גולים</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate max-w-[100px]">{stats.highestScoringMatch.clubs[0].name}</span>
              <span className="font-bold text-amber-400 px-2">
                {stats.highestScoringMatch.score?.[0]}-{stats.highestScoringMatch.score?.[1]}
              </span>
              <span className="truncate max-w-[100px]">{stats.highestScoringMatch.clubs[1].name}</span>
            </div>
          </div>
        )}

        {/* Rounds Details */}
        {evening.rounds.map((round, roundIdx) => (
          <RoundDetails key={round.id} round={round} roundNumber={roundIdx + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface RoundDetailsProps {
  round: Round;
  roundNumber: number;
}

const RoundDetails = ({ round, roundNumber }: RoundDetailsProps) => {
  // Get round winner info
  const pair1Score = round.pairScores[round.matches[0]?.pairs[0]?.id] || 0;
  const pair2Score = round.pairScores[round.matches[0]?.pairs[1]?.id] || 0;
  const pair1Names = round.matches[0]?.pairs[0]?.players.map(p => p.name).join(' + ') || '';
  const pair2Names = round.matches[0]?.pairs[1]?.players.map(p => p.name).join(' + ') || '';
  
  const roundWinner = pair1Score > pair2Score 
    ? pair1Names 
    : pair2Score > pair1Score 
      ? pair2Names 
      : null;

  return (
    <Card className="bg-muted/30 border-border/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">סיבוב {roundNumber}</span>
          {round.isDeciderMatch && (
            <Badge variant="destructive" className="text-xs">Decider</Badge>
          )}
        </div>
        {roundWinner && (
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-400 truncate max-w-[100px]">{roundWinner}</span>
          </div>
        )}
      </div>
      
      {/* Round Score */}
      <div className="flex items-center justify-center gap-4 mb-2 py-1 bg-muted/50 rounded">
        <span className="text-xs truncate max-w-[80px]">{pair1Names}</span>
        <span className="font-bold text-neon-green">{pair1Score}-{pair2Score}</span>
        <span className="text-xs truncate max-w-[80px]">{pair2Names}</span>
      </div>

      {/* Individual Matches */}
      <div className="space-y-1">
        {round.matches.filter(m => m.completed).map((match, matchIdx) => (
          <MatchRow key={match.id} match={match} matchNumber={matchIdx + 1} />
        ))}
      </div>
    </Card>
  );
};

interface MatchRowProps {
  match: Match;
  matchNumber: number;
}

const MatchRow = ({ match, matchNumber }: MatchRowProps) => {
  const score = match.score || [0, 0];
  const isDraw = score[0] === score[1];
  const winner = score[0] > score[1] ? 0 : score[1] > score[0] ? 1 : null;

  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-b-0">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className={`truncate ${winner === 0 ? 'font-bold text-neon-green' : ''}`}>
          {match.clubs[0].name}
        </span>
        {match.clubs[0].isPrime && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0">Pr</Badge>
        )}
      </div>
      <div className="px-2 flex-shrink-0">
        <Badge 
          variant={isDraw ? "outline" : "default"} 
          className={`text-xs ${isDraw ? 'bg-muted' : 'bg-neon-green/20 text-neon-green border-neon-green/30'}`}
        >
          {score[0]}-{score[1]}
        </Badge>
      </div>
      <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
        {match.clubs[1].isPrime && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0">Pr</Badge>
        )}
        <span className={`truncate ${winner === 1 ? 'font-bold text-neon-green' : ''}`}>
          {match.clubs[1].name}
        </span>
      </div>
    </div>
  );
};

// Helper function to calculate evening statistics
function calculateEveningStats(evening: Evening) {
  let totalGoals = 0;
  let totalMatches = 0;
  let draws = 0;
  let highestScoringMatch: Match | null = null;
  let highestGoals = 0;

  evening.rounds.forEach(round => {
    round.matches.forEach(match => {
      if (match.completed && match.score) {
        totalMatches++;
        const matchGoals = match.score[0] + match.score[1];
        totalGoals += matchGoals;
        
        if (match.score[0] === match.score[1]) {
          draws++;
        }
        
        if (matchGoals > highestGoals) {
          highestGoals = matchGoals;
          highestScoringMatch = match;
        }
      }
    });
  });

  return {
    totalGoals,
    totalMatches,
    draws,
    highestScoringMatch,
  };
}
