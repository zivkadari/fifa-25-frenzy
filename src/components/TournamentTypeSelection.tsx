import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, User } from "lucide-react";
import { Player } from "@/types/tournament";

interface TournamentTypeSelectionProps {
  onBack: () => void;
  onSelectPairs: () => void;
  onSelectSingles: () => void;
  players: Player[];
  winsToComplete: number;
}

export const TournamentTypeSelection = ({ 
  onBack, 
  onSelectPairs, 
  onSelectSingles, 
  players, 
  winsToComplete 
}: TournamentTypeSelectionProps) => {
  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">סוג טורניר</h1>
            <p className="text-muted-foreground text-sm">איזה סוג טורניר תרצו לשחק?</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pairs Tournament */}
          <Card 
            className="bg-gradient-card border-neon-green/20 p-6 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
            onClick={onSelectPairs}
          >
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-neon-green" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">ערב זוגות</h3>
                <p className="text-muted-foreground text-sm">טורניר זוגות קלאסי - 4 שחקנים משחקים בזוגות</p>
                <p className="text-xs text-muted-foreground mt-1">3 סיבובים • ראשון ל-{winsToComplete} ניצחונות</p>
              </div>
            </div>
          </Card>

          {/* Singles Tournament */}
          <Card 
            className="bg-gradient-card border-neon-green/20 p-6 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
            onClick={onSelectSingles}
          >
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-neon-green" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">ערב יחידים</h3>
                <p className="text-muted-foreground text-sm">טורניר יחידים - כל שחקן מקבל מספר קבוצות אישיות</p>
                <p className="text-xs text-muted-foreground mt-1">המערכת תגריל משחקים עד שכל השחקנים יסיימו את הקבוצות</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};