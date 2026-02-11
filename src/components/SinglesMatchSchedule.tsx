import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Users, Trophy } from "lucide-react";
import { SinglesGame } from "@/types/tournament";

interface SinglesMatchScheduleProps {
  onBack: () => void;
  onStartTournament: () => void;
  gameSequence: SinglesGame[];
}

export const SinglesMatchSchedule = ({ 
  onBack, 
  onStartTournament, 
  gameSequence 
}: SinglesMatchScheduleProps) => {
  const totalGames = gameSequence.length;
  
  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">סדר המשחקים</h1>
            <p className="text-muted-foreground text-sm">{totalGames} משחקים סך הכל</p>
          </div>
        </div>

        {/* Tournament Overview */}
        <Card className="bg-gaming-surface/50 border-border/50 p-4 mb-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-neon-green" />
              <span className="text-lg font-semibold text-foreground">
                טורניר יחידים
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              הסדר אופטימלי לצמצום זמני המתנה
            </p>
          </div>
        </Card>

        {/* Game Schedule */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {gameSequence.map((game, index) => (
            <Card key={game.id} className="bg-gradient-card border-neon-green/20 p-3 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="min-w-[32px] h-6">
                    {index + 1}
                  </Badge>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {game.players[0].name}
                      </span>
                      <span className="text-muted-foreground">נגד</span>
                      <span className="font-medium text-foreground">
                        {game.players[1].name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      השחקנים יבחרו קבוצות במהלך המשחק
                    </div>
                  </div>
                </div>
                <Users className="h-4 w-4 text-neon-green" />
              </div>
            </Card>
          ))}
        </div>

        {/* Start Tournament Button */}
        <Button
          variant="gaming"
          size="xl"
          onClick={onStartTournament}
          className="w-full"
        >
          <Play className="h-5 w-5 mr-2" />
          התחל טורניר!
        </Button>
      </div>
    </div>
  );
};