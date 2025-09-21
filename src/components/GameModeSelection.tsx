import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Dice1, Users, Trophy, Sparkles } from "lucide-react";
import { Player, Club } from "@/types/tournament";
import { FIFA_CLUBS } from "@/data/clubs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GameModeSelectionProps {
  onBack: () => void;
  onStartRandomMode: (players: Player[], winsToComplete: number, teamId?: string) => void;
  onStartCustomMode: (players: Player[], winsToComplete: number, customTeams: [string[], string[]], teamId?: string) => void;
  players: Player[];
  winsToComplete: number;
  teamId?: string;
}

type GameMode = 'random' | 'ucl-uel' | null;

// Get Champions League teams (5-star and some 4.5-star teams)
const getChampionsLeagueTeams = (): Club[] => {
  return FIFA_CLUBS.filter(club => 
    club.stars >= 4.5 && 
    !club.isNational && 
    ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'].includes(club.league)
  );
};

export const GameModeSelection = ({ 
  onBack, 
  onStartRandomMode, 
  onStartCustomMode, 
  players, 
  winsToComplete, 
  teamId 
}: GameModeSelectionProps) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [assignedTeams, setAssignedTeams] = useState<Club[]>([]);
  const [customTeams, setCustomTeams] = useState<[string[], string[]]>([
    Array(winsToComplete).fill(''),
    Array(winsToComplete).fill('')
  ]);

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    
    if (mode === 'ucl-uel') {
      // Randomly assign one Champions League team to each pair
      const championsLeagueTeams = getChampionsLeagueTeams();
      const selectedTeams: Club[] = [];
      
      // For each pair, randomly select a Champions League team
      players.forEach((_, index) => {
        if (index < 2) { // Only need 2 teams for 2 pairs
          const availableTeams = championsLeagueTeams.filter(team => 
            !selectedTeams.find(selected => selected.id === team.id)
          );
          if (availableTeams.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableTeams.length);
            selectedTeams.push(availableTeams[randomIndex]);
          }
        }
      });
      
      setAssignedTeams(selectedTeams);
    }
  };

  const handleCustomTeamChange = (pairIndex: 0 | 1, teamIndex: number, teamName: string) => {
    const newCustomTeams = [...customTeams] as [string[], string[]];
    newCustomTeams[pairIndex][teamIndex] = teamName;
    setCustomTeams(newCustomTeams);
  };

  const handleStartCustomMode = () => {
    // Validate that all team slots are filled
    const allTeamsFilled = customTeams[0].every(team => team.trim() !== '') && 
                          customTeams[1].every(team => team.trim() !== '');
    
    if (!allTeamsFilled) {
      return;
    }

    onStartCustomMode(players, winsToComplete, customTeams, teamId);
  };

  const getPairName = (pairIndex: number): string => {
    const pairPlayers = pairIndex === 0 ? [players[0], players[1]] : [players[2], players[3]];
    return `${pairPlayers[0]?.name} & ${pairPlayers[1]?.name}`;
  };

  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">בחירת מצב משחק</h1>
            <p className="text-muted-foreground text-sm">כיצד תרצו לבחור קבוצות?</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Mode Selection */}
          {!selectedMode && (
            <>
              <Card 
                className="bg-gradient-card border-neon-green/20 p-6 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
                onClick={() => handleModeSelect('random')}
              >
                <div className="flex items-center gap-3">
                  <Dice1 className="h-8 w-8 text-neon-green" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">בחירה רנדומלית</h3>
                    <p className="text-muted-foreground text-sm">המערכת תבחר קבוצות באופן רנדומלי לכל משחק</p>
                  </div>
                </div>
              </Card>

              <Card 
                className="bg-gradient-card border-neon-green/20 p-6 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
                onClick={() => handleModeSelect('ucl-uel')}
              >
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-neon-green" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">UCL & UEL</h3>
                    <p className="text-muted-foreground text-sm">כל זוג יקבל קבוצה מליגת האלופות ויוכל למלא שמות קבוצות בעצמו</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Random Mode Confirmation */}
          {selectedMode === 'random' && (
            <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
              <div className="text-center space-y-4">
                <Dice1 className="h-12 w-12 text-neon-green mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">בחירה רנדומלית</h3>
                <p className="text-muted-foreground">המערכת תבחר קבוצות באופן רנדומלי לכל משחק במהלך הטורניר</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedMode(null)}>
                    חזור
                  </Button>
                  <Button 
                    variant="gaming" 
                    onClick={() => onStartRandomMode(players, winsToComplete, teamId)}
                    className="flex-1"
                  >
                    התחל טורניר
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* UCL Mode Setup */}
          {selectedMode === 'ucl-uel' && (
            <div className="space-y-6">
              {/* Assigned Champions League Teams */}
              <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-neon-green" />
                  <h3 className="text-lg font-semibold text-foreground">קבוצות שנבחרו מליגת האלופות</h3>
                </div>
                <div className="space-y-3">
                  {assignedTeams.map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gaming-surface rounded-md border border-border">
                      <span className="font-medium text-foreground">{getPairName(index)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{team.league}</span>
                        <span className="font-semibold text-foreground">{team.name}</span>
                        <div className="flex">
                          {Array.from({ length: Math.floor(team.stars) }, (_, i) => (
                            <span key={i} className="text-yellow-400">★</span>
                          ))}
                          {team.stars % 1 !== 0 && <span className="text-yellow-400">☆</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Custom Team Input */}
              <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-neon-green" />
                  <h3 className="text-lg font-semibold text-foreground">מלאו שמות קבוצות לכל זוג</h3>
                </div>
                <div className="space-y-6">
                  {[0, 1].map((pairIndex) => (
                    <div key={pairIndex}>
                      <Label className="text-sm font-medium text-foreground mb-2 block">
                        {getPairName(pairIndex)}
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {customTeams[pairIndex].map((teamName, teamIndex) => (
                          <Input
                            key={teamIndex}
                            placeholder={`קבוצה ${teamIndex + 1}`}
                            value={teamName}
                            onChange={(e) => handleCustomTeamChange(pairIndex as 0 | 1, teamIndex, e.target.value)}
                            className="bg-gaming-surface border-border"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedMode(null)}>
                  חזור
                </Button>
                <Button 
                  variant="gaming" 
                  onClick={handleStartCustomMode}
                  className="flex-1"
                  disabled={!customTeams[0].every(team => team.trim() !== '') || !customTeams[1].every(team => team.trim() !== '')}
                >
                  התחל טורניר
                </Button>
              </div>
            </div>
          )}

          {/* Tournament Info */}
          {selectedMode && (
            <Card className="bg-gaming-surface/50 border-border/50 p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-neon-green">3 סיבובים</strong> • פורמט כולם נגד כולם
                </p>
                <p className="text-xs text-muted-foreground">
                  ראשון ל-{winsToComplete} ניצחונות בכל סיבוב
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};