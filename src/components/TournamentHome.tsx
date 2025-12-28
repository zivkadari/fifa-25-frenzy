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
    <div className="min-h-screen bg-gaming-bg flex flex-col p-4 mobile-optimized">
      {/* Hero Section - fills top area */}
      <div className="flex-1 flex flex-col items-center justify-center animate-scale-in">
        {/* Hero Image - larger */}
        <div className="w-full max-w-xs mb-4">
          <img 
            src={alphaChampionImage} 
            alt="Alpha Champion" 
            className="w-full rounded-xl shadow-lg border border-neon-green/30"
          />
        </div>
        
        {/* Titles */}
        <h1 className="text-3xl font-bold text-foreground">EA FC 26</h1>
        <h2 className="text-xl font-semibold text-neon-green">Tournament Manager</h2>
      </div>

      {/* Action Buttons - at bottom */}
      <div className="w-full max-w-md mx-auto space-y-3 pb-4">
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
      <div className="text-center pb-2">
        <p className="text-muted-foreground text-xs">
          EA FC 26 • Ranking Tracking • Bragging Rights
        </p>
      </div>
    </div>
  );
};