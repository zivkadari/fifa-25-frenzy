import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, History, Gamepad2 } from "lucide-react";

interface TournamentHomeProps {
  onStartNew: () => void;
  onViewHistory: () => void;
}

export const TournamentHome = ({ onStartNew, onViewHistory }: TournamentHomeProps) => {
  return (
    <div className="min-h-screen bg-gaming-bg flex items-center justify-center p-4 mobile-optimized" dir="rtl">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo Section */}
        <Card className="bg-gradient-card border-neon-green/20 p-8 text-center mb-8 shadow-card">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Gamepad2 className="h-16 w-16 text-neon-green animate-glow-pulse" />
              <Trophy className="h-8 w-8 text-neon-green absolute -top-2 -right-2" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            פיפא 25
          </h1>
          <h2 className="text-xl font-semibold text-neon-green mb-2">
            מנהל הטורנירים
          </h2>
          <p className="text-muted-foreground text-sm">
            <span className="ltr-numbers">2v2</span> ערב טורניר עבור <span className="ltr-numbers">4</span> שחקנים
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            variant="gaming"
            size="xl"
            onClick={onStartNew}
            className="w-full"
          >
            <Trophy className="h-5 w-5" />
            התחל ערב חדש
          </Button>
          
          <Button
            variant="hero"
            size="lg"
            onClick={onViewHistory}
            className="w-full"
          >
            <History className="h-5 w-5" />
            היסטוריה
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-xs">
            אוטומציה לטורנירי פיפא 25 • מעקב דירוגים • שמירת זכויות התרברבות
          </p>
        </div>
      </div>
    </div>
  );
};