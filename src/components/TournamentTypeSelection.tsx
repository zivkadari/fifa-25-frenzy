import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, User } from "lucide-react";
import { Player } from "@/types/tournament";

interface TournamentTypeSelectionProps {
  onBack: () => void;
  onSelectPairs: () => void;
  onSelectSingles: () => void;
}

export const TournamentTypeSelection = ({ 
  onBack, 
  onSelectPairs, 
  onSelectSingles
}: TournamentTypeSelectionProps) => {
  return (
    <div className="min-h-screen bg-gaming-bg p-3 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">סוג טורניר</h1>
        </div>

        <div className="space-y-3">
          {/* Pairs Tournament */}
          <Card 
            className="bg-gradient-card border-neon-green/20 p-4 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
            onClick={onSelectPairs}
          >
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-neon-green" />
              <div>
                <h3 className="text-base font-semibold text-foreground">ערב זוגות</h3>
                <p className="text-muted-foreground text-xs">4 שחקנים בזוגות • 3 סיבובים</p>
              </div>
            </div>
          </Card>

          {/* Singles Tournament */}
          <Card 
            className="bg-gradient-card border-neon-green/20 p-4 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
            onClick={onSelectSingles}
          >
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-neon-green" />
              <div>
                <h3 className="text-base font-semibold text-foreground">ערב יחידים</h3>
                <p className="text-muted-foreground text-xs">כל שחקן מקבל קבוצות אישיות</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};