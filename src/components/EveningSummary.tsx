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
        {/* Header - Compact */}
        <div className="text-center mb-4 animate-scale-in">
          <div className="flex justify-center mb-2">
            <Trophy className="h-10 w-10 text-neon-green animate-glow-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Tournament Complete!</h1>
          <p className="text-xs text-muted-foreground">{evening.date}</p>
        </div>

        {/* Podium - Compact */}
        <div className="space-y-2 mb-4">
          {/* Alpha (1st Place) */}
          {rankings.alpha.length > 0 && (
            <Card className={`${getRankColor('alpha')} border-2 p-3 shadow-glow animate-scale-in`}>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <div className="flex-1">
                  <span className="text-sm font-bold text-foreground">Alpha: </span>
                  {rankings.alpha.map((player) => (
                    <Badge key={player.id} variant="secondary" className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 ml-1">
                      {player.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Beta, Gamma, Delta in a row */}
          <div className="grid grid-cols-3 gap-2">
            {rankings.beta.length > 0 && (
              <Card className={`${getRankColor('beta')} border p-2 text-center`}>
                <Medal className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-medium">{rankings.beta.map(p => p.name).join(', ')}</p>
              </Card>
            )}
            {rankings.gamma.length > 0 && (
              <Card className={`${getRankColor('gamma')} border p-2 text-center`}>
                <Award className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <p className="text-xs font-medium">{rankings.gamma.map(p => p.name).join(', ')}</p>
              </Card>
            )}
            {rankings.delta && rankings.delta.length > 0 && (
              <Card className={`${getRankColor('delta')} border p-2 text-center`}>
                <Target className="h-4 w-4 text-sky-400 mx-auto mb-1" />
                <p className="text-xs font-medium">{rankings.delta.map(p => p.name).join(', ')}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Detailed Stats - Compact */}
        <Card className="bg-gradient-card border-neon-green/20 p-3 mb-4 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-neon-green" />
            Stats
          </h3>
          <div className="space-y-2">
            {playerStats.map((stats, index) => (
              <div key={stats.player.id} className="flex items-center justify-between py-1 border-b border-border/20 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{stats.player.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-neon-green font-medium">{stats.wins}W</span>
                  <span className="text-muted-foreground">{stats.goalsFor}-{stats.goalsAgainst}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!saved && (
            <Button
              variant="gaming"
              size="lg"
              onClick={handleSaveToHistory}
              className="w-full"
            >
              <Save className="h-4 w-4" />
              Save to History
            </Button>
          )}
          
          <Button
            variant="hero"
            onClick={onBackToHome}
            className="w-full"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};