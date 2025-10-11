import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Trophy, Star } from "lucide-react";
import { Player, Club } from "@/types/tournament";

interface SinglesClubAssignmentProps {
  onBack: () => void;
  onContinue: () => void;
  players: Player[];
  playerClubs: { [playerId: string]: Club[] };
  clubsPerPlayer: number;
}

export const SinglesClubAssignment = ({ 
  onBack, 
  onContinue, 
  players, 
  playerClubs, 
  clubsPerPlayer 
}: SinglesClubAssignmentProps) => {
  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">חלוקת קבוצות</h1>
            <p className="text-muted-foreground text-sm">כל שחקן קיבל {clubsPerPlayer} קבוצות</p>
          </div>
        </div>

        {/* Tournament Info */}
        <Card className="bg-gaming-surface/50 border-border/50 p-4 mb-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-neon-green" />
              <span className="text-lg font-semibold text-foreground">
                {players.length} שחקנים
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              כל שחקן ישחק עם כל השחקנים האחרים בכל הקבוצות שלו
            </p>
          </div>
        </Card>

        {/* Player Club Assignments */}
        <div className="space-y-4 mb-6">
          {players.map(player => (
            <Card key={player.id} className="bg-gradient-card border-neon-green/20 p-4 shadow-card">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gaming-surface border-2 border-neon-green flex items-center justify-center">
                    <span className="text-sm font-bold text-neon-green">
                      {player.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{player.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {playerClubs[player.id]?.map((club, index) => (
                    <div key={club.id} className="flex items-center justify-between p-2 rounded bg-gaming-surface/50 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">{club.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.floor(club.stars) }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-neon-green text-neon-green" />
                        ))}
                        {club.stars % 1 !== 0 && (
                          <div className="relative h-3 w-3">
                            <Star className="h-3 w-3 text-neon-green absolute" />
                            <Star className="h-3 w-3 fill-neon-green text-neon-green absolute" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <Button
          variant="gaming"
          size="xl"
          onClick={onContinue}
          className="w-full"
        >
          <Trophy className="h-5 w-5 mr-2" />
          המשך לסדר המשחקים
        </Button>
      </div>
    </div>
  );
};