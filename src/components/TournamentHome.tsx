import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, History, Gamepad2, User, Users } from "lucide-react";
import alphaChampionImage from "@/assets/alpha-champion.png";
import { Link } from "react-router-dom";
interface TournamentHomeProps {
  onStartNew: () => void;
  onViewHistory: () => void;
  onResume?: () => void;
  onManageTeams?: () => void;
}

export const TournamentHome = ({ onStartNew, onViewHistory, onResume, onManageTeams }: TournamentHomeProps) => {
  return (
    <div className="min-h-screen bg-gaming-bg flex items-center justify-center p-3 mobile-optimized">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo Section */}
        <Card className="bg-gradient-card border-neon-green/20 p-3 text-center mb-4 shadow-card">
          {/* Hero Image */}
          <div className="flex justify-center mb-2">
            <img 
              src={alphaChampionImage} 
              alt="Alpha Champion" 
              className="rounded-lg max-h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-foreground">EA FC 26</h1>
          <h2 className="text-base font-semibold text-neon-green">Tournament Manager</h2>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {onResume && (
            <Button
              variant="gaming"
              size="lg"
              onClick={onResume}
              className="w-full"
            >
              <Gamepad2 className="h-4 w-4" />
              Resume Evening
            </Button>
          )}

          <Button
            variant="hero"
            size="lg"
            onClick={onStartNew}
            className="w-full"
          >
            <Trophy className="h-4 w-4" />
            Start New Evening
          </Button>
          
          {onManageTeams && (
            <Button
              variant="secondary"
              onClick={onManageTeams}
              className="w-full"
            >
              <Users className="h-4 w-4" />
              Teams
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={onViewHistory}
            className="w-full"
          >
            <History className="h-4 w-4" />
            History
          </Button>

          <Button
            asChild
            variant="secondary"
            className="w-full"
          >
            <Link to="/profile">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-xs">
            EA FC 26 • Ranking Tracking • Bragging Rights
          </p>
        </div>
      </div>
    </div>
  );
};