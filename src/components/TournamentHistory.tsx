import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Trophy, Medal, Award, Trash2 } from "lucide-react";
import { Evening } from "@/types/tournament";

interface TournamentHistoryProps {
  evenings: Evening[];
  onBack: () => void;
  onDeleteEvening?: (eveningId: string) => void;
}

export const TournamentHistory = ({ evenings, onBack, onDeleteEvening }: TournamentHistoryProps) => {
  const sortedEvenings = [...evenings].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getRankIcon = (rank: 'alpha' | 'beta' | 'gamma') => {
    switch (rank) {
      case 'alpha': return <Trophy className="h-4 w-4 text-yellow-400" />;
      case 'beta': return <Medal className="h-4 w-4 text-gray-400" />;
      case 'gamma': return <Award className="h-4 w-4 text-amber-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (sortedEvenings.length === 0) {
    return (
      <div className="min-h-screen bg-gaming-bg p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tournament History</h1>
              <p className="text-muted-foreground text-sm">Past evening results</p>
            </div>
          </div>

          {/* Empty State */}
          <Card className="bg-gradient-card border-neon-green/20 p-8 text-center shadow-card">
            <div className="flex justify-center mb-4">
              <Trophy className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Tournaments Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start your first tournament to see results here
            </p>
            <Button variant="gaming" onClick={onBack}>
              Start New Tournament
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tournament History</h1>
            <p className="text-muted-foreground text-sm">
              {sortedEvenings.length} tournament{sortedEvenings.length !== 1 ? 's' : ''} played
            </p>
          </div>
        </div>

        {/* Tournament List */}
        <div className="space-y-4">
          {sortedEvenings.map((evening) => (
            <Card 
              key={evening.id} 
              className="bg-gradient-card border-neon-green/20 p-4 shadow-card hover:shadow-glow transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neon-green" />
                  <span className="font-semibold text-foreground">
                    {formatDate(evening.date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {evening.rounds.length} rounds
                  </Badge>
                  {onDeleteEvening && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteEvening(evening.id)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Rankings */}
              {evening.rankings && (
                <div className="space-y-2">
                  {/* Alpha */}
                  {evening.rankings.alpha.length > 0 && (
                    <div className="flex items-center gap-2">
                      {getRankIcon('alpha')}
                      <span className="text-sm font-medium text-foreground">Alpha:</span>
                      <div className="flex flex-wrap gap-1">
                        {evening.rankings.alpha.map((player, index) => (
                          <Badge 
                            key={player.id} 
                            variant="secondary" 
                            className="text-xs bg-yellow-400/20 text-yellow-300 border-yellow-400/30"
                          >
                            {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Beta */}
                  {evening.rankings.beta.length > 0 && (
                    <div className="flex items-center gap-2">
                      {getRankIcon('beta')}
                      <span className="text-sm font-medium text-foreground">Beta:</span>
                      <div className="flex flex-wrap gap-1">
                        {evening.rankings.beta.map((player, index) => (
                          <Badge 
                            key={player.id} 
                            variant="secondary" 
                            className="text-xs bg-gray-400/20 text-gray-300 border-gray-400/30"
                          >
                            {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gamma */}
                  {evening.rankings.gamma.length > 0 && (
                    <div className="flex items-center gap-2">
                      {getRankIcon('gamma')}
                      <span className="text-sm font-medium text-foreground">Gamma:</span>
                      <div className="flex flex-wrap gap-1">
                        {evening.rankings.gamma.map((player, index) => (
                          <Badge 
                            key={player.id} 
                            variant="secondary" 
                            className="text-xs bg-amber-600/20 text-amber-300 border-amber-600/30"
                          >
                            {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Players */}
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  Players: {evening.players.map(p => p.name).join(', ')}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Keep playing to build your tournament legacy! 🏆
          </p>
        </div>
      </div>
    </div>
  );
};