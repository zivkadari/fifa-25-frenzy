import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Medal, 
  Award, 
  Target, 
  TrendingUp,
  Save,
  Home,
  Sparkles
} from "lucide-react";
import { Evening, PlayerStats } from "@/types/tournament";
import { TournamentEngine } from "@/services/tournamentEngine";
import { useToast } from "@/hooks/use-toast";

interface EveningSummaryProps {
  evening: Evening;
  onSaveToHistory: (evening: Evening) => void;
  onBackToHome: () => void;
}

export const EveningSummary = ({ evening, onSaveToHistory, onBackToHome }: EveningSummaryProps) => {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  
  const playerStats = TournamentEngine.calculatePlayerStats(evening);
  const rankings = evening.rankings || TournamentEngine.calculateRankings(playerStats);

  const handleSaveToHistory = async () => {
    await onSaveToHistory(evening);
    setSaved(true);
    toast({
      title: "הטורניר נשמר!",
      description: "תוצאות הטורניר נשמרו בהיסטוריה",
    });
  };

  const getRankIcon = (rank: 'alpha' | 'beta' | 'gamma' | 'delta') => {
    switch (rank) {
      case 'alpha': return <Trophy className="h-6 w-6 text-yellow-400" />;
      case 'beta': return <Medal className="h-6 w-6 text-gray-400" />;
      case 'gamma': return <Award className="h-6 w-6 text-amber-600" />;
      case 'delta': return <Target className="h-6 w-6 text-sky-400" />;
    }
  };

  const getRankColor = (rank: 'alpha' | 'beta' | 'gamma' | 'delta') => {
    switch (rank) {
      case 'alpha': return 'border-yellow-400/50 bg-yellow-400/10';
      case 'beta': return 'border-gray-400/50 bg-gray-400/10';
      case 'gamma': return 'border-amber-600/50 bg-amber-600/10';
      case 'delta': return 'border-sky-400/50 bg-sky-400/10';
    }
  };

  return (
    <div className="min-h-screen bg-gaming-bg p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="h-4 w-4 text-neon-green" />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="h-16 w-16 text-neon-green animate-glow-pulse" />
              <div className="absolute -inset-4 bg-neon-green/20 rounded-full blur-xl"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tournament Complete!
          </h1>
          <p className="text-muted-foreground">
            {evening.date} • {evening.rounds.length} Rounds Played
          </p>
        </div>

        {/* Podium */}
        <div className="space-y-4 mb-8">
          {/* Alpha (1st Place) */}
          {rankings.alpha.length > 0 && (
            <Card className={`${getRankColor('alpha')} border-2 p-6 shadow-glow animate-scale-in`}>
              <div className="flex items-center gap-4">
                {getRankIcon('alpha')}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    Alpha of the Night
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {rankings.alpha.map((player, index) => (
                      <Badge key={player.id} variant="secondary" className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
                        {player.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Beta (2nd Place) */}
          {rankings.beta.length > 0 && (
            <Card className={`${getRankColor('beta')} border-2 p-4`}>
              <div className="flex items-center gap-4">
                {getRankIcon('beta')}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Beta</h3>
                  <div className="flex flex-wrap gap-2">
                    {rankings.beta.map((player, index) => (
                      <Badge key={player.id} variant="secondary" className="bg-gray-400/20 text-gray-300 border-gray-400/30">
                        {player.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Gamma (3rd Place) */}
          {rankings.gamma.length > 0 && (
            <Card className={`${getRankColor('gamma')} border-2 p-4`}>
              <div className="flex items-center gap-4">
                {getRankIcon('gamma')}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Gamma</h3>
                  <div className="flex flex-wrap gap-2">
                    {rankings.gamma.map((player, index) => (
                      <Badge key={player.id} variant="secondary" className="bg-amber-600/20 text-amber-300 border-amber-600/30">
                        {player.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Delta (4th Place) */}
          {rankings.delta && rankings.delta.length > 0 && (
            <Card className={`${getRankColor('delta')} border-2 p-4`}>
              <div className="flex items-center gap-4">
                {getRankIcon('delta')}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Delta</h3>
                  <div className="flex flex-wrap gap-2">
                    {rankings.delta.map((player) => (
                      <Badge key={player.id} variant="secondary" className="bg-sky-400/20 text-sky-300 border-sky-400/30">
                        {player.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Detailed Stats */}
        <Card className="bg-gradient-card border-neon-green/20 p-6 mb-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neon-green" />
            Player Statistics
          </h3>
          <div className="space-y-4">
            {playerStats.map((stats, index) => (
              <div key={stats.player.id} className="border-b border-border/30 pb-3 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-semibold text-foreground">{stats.player.name}</span>
                  </div>
                  <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30">
                    {stats.points} pts
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{stats.wins}</p>
                    <p>Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{stats.goalsFor}</p>
                    <p>Goals For</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{stats.goalsAgainst}</p>
                    <p>Goals Against</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{stats.longestWinStreak}</p>
                    <p>Longest Streak</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {!saved && (
            <Button
              variant="gaming"
              size="xl"
              onClick={handleSaveToHistory}
              className="w-full"
            >
              <Save className="h-5 w-5" />
              Save to History
            </Button>
          )}
          
          <Button
            variant="hero"
            size="lg"
            onClick={onBackToHome}
            className="w-full"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Button>
        </div>

        {/* Footer Message */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            🎮 Great tournament! Ready for another round? 🏆
          </p>
        </div>
      </div>
    </div>
  );
};