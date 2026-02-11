import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, User } from "lucide-react";

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
    <div className="min-h-[100svh] bg-gaming-bg flex flex-col p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5 rotate-180" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">סוג טורניר</h1>
      </div>

      {/* Content centered */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          {/* Pairs Tournament */}
          <Card 
            className="bg-gradient-card border-neon-green/20 p-6 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
            onClick={onSelectPairs}
          >
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-neon-green" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">ערב זוגות</h3>
                <p className="text-muted-foreground text-sm">4 שחקנים בזוגות • 3 סיבובים</p>
              </div>
            </div>
          </Card>

          {/* Singles Tournament */}
          <Card 
            className="bg-gradient-card border-neon-green/20 p-6 shadow-card cursor-pointer hover:border-neon-green/40 transition-colors"
            onClick={onSelectSingles}
          >
            <div className="flex items-center gap-4">
              <User className="h-8 w-8 text-neon-green" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">ערב יחידים</h3>
                <p className="text-muted-foreground text-sm">כל שחקן מקבל קבוצות אישיות</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
