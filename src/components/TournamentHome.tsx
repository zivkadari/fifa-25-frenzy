import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, History, Gamepad2, User, Users } from "lucide-react";
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
        <Card className="bg-gradient-card border-neon-green/20 p-5 text-center mb-4 shadow-card">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <Gamepad2 className="h-10 w-10 text-neon-green animate-glow-pulse" />
              <Trophy className="h-5 w-5 text-neon-green absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">EA FC 26</h1>
          <h2 className="text-lg font-semibold text-neon-green">Tournament Manager</h2>
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