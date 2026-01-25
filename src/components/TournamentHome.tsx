import { Button } from "@/components/ui/button";
import { Trophy, History, Gamepad2, User, Users } from "lucide-react";
import alphaChampionImage from "@/assets/alpha-champion.png";
import { Link } from "react-router-dom";

interface TournamentHomeProps {
  onStartNew: () => void;
  onViewHistory: () => void;
  onResume?: () => void;
  onManageTeams?: () => void;
  isAuthed?: boolean;
  userEmail?: string | null;
  onSignOut?: () => void;
}

export const TournamentHome = ({ 
  onStartNew, 
  onViewHistory, 
  onResume, 
  onManageTeams,
  isAuthed,
  userEmail,
  onSignOut
}: TournamentHomeProps) => {
  return (
    <div className="bg-gaming-bg flex flex-col p-3 mobile-optimized">
      {/* Auth Header - integrated into content */}
      {isAuthed && (
        <div className="flex items-center justify-end gap-2 mb-2">
          {userEmail && <span className="text-muted-foreground text-xs hidden sm:inline">{userEmail}</span>}
          <Button variant="ghost" size="sm" onClick={onSignOut}>Logout</Button>
          <Button asChild variant="secondary" size="sm"><Link to="/profile">Profile</Link></Button>
        </div>
      )}
      {!isAuthed && (
        <div className="flex items-center justify-end mb-2">
          <Button asChild variant="secondary" size="sm"><Link to="/auth">Log in / Sign up</Link></Button>
        </div>
      )}

      {/* Hero Section - compact, no flex-1 */}
      <div className="flex flex-col items-center justify-center py-2 animate-scale-in">
        {/* Hero Image - smaller */}
        <div className="w-full max-w-[200px] mb-2">
          <img 
            src={alphaChampionImage} 
            alt="Alpha Champion" 
            className="w-full rounded-xl shadow-lg border border-neon-green/30"
          />
        </div>
        
        {/* Titles - tighter spacing */}
        <h1 className="text-2xl font-bold text-foreground">EA FC 26</h1>
        <h2 className="text-lg font-semibold text-neon-green">Tournament Manager</h2>
      </div>

      {/* Action Buttons - reduced spacing */}
      <div className="w-full max-w-md mx-auto space-y-2 pb-2 mt-2">
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

      {/* Footer - minimal */}
      <div className="text-center py-1">
        <p className="text-muted-foreground text-xs">
          EA FC 26 • Ranking Tracking • Bragging Rights
        </p>
      </div>
    </div>
  );
};