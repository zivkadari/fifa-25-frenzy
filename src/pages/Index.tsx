import { useState, useEffect } from "react";
import { TournamentHome } from "@/components/TournamentHome";
import { EveningSetup } from "@/components/EveningSetup";
import { GameModeSelection } from "@/components/GameModeSelection";
import { TournamentGame } from "@/components/TournamentGame";
import { EveningSummary } from "@/components/EveningSummary";
import { TournamentHistory } from "@/components/TournamentHistory";
import { FloatingScoreTable } from "@/components/FloatingScoreTable";
import { Evening, Player } from "@/types/tournament";
import { StorageService } from "@/services/storageService";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { useToast } from "@/hooks/use-toast";
import FitToScreen from "@/components/FitToScreen";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TeamsManager } from "@/components/TeamsManager";
import { TournamentEngine } from "@/services/tournamentEngine";

type AppState = 'home' | 'setup' | 'mode-selection' | 'game' | 'summary' | 'history' | 'teams';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentEvening, setCurrentEvening] = useState<Evening | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Evening[]>([]);
  const { toast } = useToast();
  const [isAuthed, setIsAuthed] = useState(false);
const [userEmail, setUserEmail] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [showShareCodeDialog, setShowShareCodeDialog] = useState(false);
  const [shareCodeForDialog, setShareCodeForDialog] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<{players: Player[], winsToComplete: number, teamId?: string} | null>(null);

   // Navigation helper that also pushes into browser history so Back goes to previous screen
  const navigateTo = (next: AppState) => {
    if (window.history.state?.appState !== next) {
      window.history.pushState({ appState: next }, '', '');
    }
    setAppState(next);
  };

useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        const local = StorageService.loadEvenings();
        let remote: Evening[] = [];
        if (RemoteStorageService.isEnabled()) {
          remote = await RemoteStorageService.loadEvenings();
        }
        if (!mounted) return;
        setTournamentHistory(remote.length ? remote : local);
      } catch (e) {
        setTournamentHistory(StorageService.loadEvenings());
      }
    };

    loadHistory();

    // Initialize history state and popstate handler
    if (!window.history.state || !window.history.state.appState) {
      window.history.replaceState({ appState: 'home' }, '', '');
    }
    const onPop = (e: PopStateEvent) => {
      const state = (e.state?.appState as AppState) || 'home';
      setAppState(state);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      mounted = false;
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  // Auth state listener for header logout/login
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
      setUserEmail(session?.user?.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session?.user);
      setUserEmail(data.session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Realtime sync: subscribe to current evening when in game state
  useEffect(() => {
    if (appState !== 'game' || !currentEvening) return;
    const unsubscribe = RemoteStorageService.subscribeToEvening(currentEvening.id, (remoteEvening) => {
      setCurrentEvening(remoteEvening);
    });
    return () => unsubscribe && unsubscribe();
  }, [appState, currentEvening?.id]);

  const handleStartNewEvening = () => {
    navigateTo('setup');
    setCurrentEvening(null);
  };

  const handleViewHistory = () => {
    navigateTo('history');
  };

  const handleBackToHome = () => {
    setAppState('home');
    // Don't clear currentEvening here so we can preserve players if going back to setup
  };

  const handleBackToSetup = () => {
    setAppState('setup');
    // Keep currentEvening to preserve player data
  };

  const handleSetupComplete = (players: Player[], winsToComplete: number, teamId?: string) => {
    setSetupData({ players, winsToComplete, teamId });
    navigateTo('mode-selection');
  };

  const handleStartRandomEvening = async (players: Player[], winsToComplete: number, teamId?: string) => {
    await startEvening(players, winsToComplete, teamId);
  };

  const handleStartCustomEvening = async (players: Player[], winsToComplete: number, customTeams: [string[], string[]], teamId?: string) => {
    // TODO: Implement custom teams logic here
    // For now, just start with random mode
    await startEvening(players, winsToComplete, teamId);
  };

  const startEvening = async (players: Player[], winsToComplete: number, teamId?: string) => {
    // Generate a deterministic pairs schedule once and persist it to the evening to avoid changes on navigation
    const pairSchedule = TournamentEngine.generatePairs(players);

    const newEvening: Evening = {
      id: `evening-${Date.now()}`,
      date: new Date().toISOString(),
      players,
      rounds: [],
      winsToComplete,
      completed: false,
      pairSchedule,
    };

    // Determine team automatically if not provided
    let effectiveTeamId = teamId ?? currentTeamId ?? null;
    if (!effectiveTeamId && RemoteStorageService.isEnabled()) {
      try {
        effectiveTeamId = await RemoteStorageService.ensureTeamForPlayers(players);
      } catch {}
    }

    setCurrentEvening(newEvening);
    setCurrentTeamId(effectiveTeamId);
    // Push an initial copy to Supabase for realtime collaboration (with team relation if chosen)
    await RemoteStorageService.upsertEveningLiveWithTeam(newEvening, effectiveTeamId).catch(() => {});
    
    // Ensure a share code exists and show it in a persistent dialog
    try {
      const code = await RemoteStorageService.ensureShareCode(newEvening.id);
      if (code) {
        setShareCodeForDialog(code);
        setShowShareCodeDialog(true);
      } else {
        console.error("Failed to create share code");
      }
    } catch (error) {
      console.error("Error creating share code:", error);
    }
    
    navigateTo('game');
  };

  const handleCompleteEvening = (evening: Evening) => {
    setCurrentEvening(evening);
    navigateTo('summary');
  };

const handleSaveToHistory = async (evening: Evening) => {
    try {
      if (RemoteStorageService.isEnabled()) {
        await RemoteStorageService.saveEveningWithTeam(evening, currentTeamId ?? null);
      }
      StorageService.saveEvening(evening);
    } finally {
      const updatedHistory = RemoteStorageService.isEnabled()
        ? await RemoteStorageService.loadEvenings()
        : StorageService.loadEvenings();
      setTournamentHistory(updatedHistory);
    }
  };

const handleDeleteEvening = async (eveningId: string) => {
    // Attempt remote delete (will be allowed only for admin via RLS)
    if (RemoteStorageService.isEnabled()) {
      try {
        await RemoteStorageService.deleteEvening(eveningId);
      } catch (e) {
        toast({ title: "אין הרשאה למחיקה", description: "רק המנהל יכול למחוק", variant: "destructive" });
      }
    }
    // Keep local history in sync
    StorageService.deleteEvening(eveningId);
    const updatedHistory = RemoteStorageService.isEnabled()
      ? await RemoteStorageService.loadEvenings()
      : StorageService.loadEvenings();
    setTournamentHistory(updatedHistory);
  };

const handleGoHome = () => {
    navigateTo('home');
  };

  const handleUpdateEvening = (evening: Evening) => {
    setCurrentEvening(evening);
    RemoteStorageService.upsertEveningLive(evening).catch(() => {});
  };

  // Auth helpers available globally from home page
  const cleanupAuthState = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("supabase.auth") || key.includes("sb-")) localStorage.removeItem(key);
      });
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith("supabase.auth") || key.includes("sb-")) sessionStorage.removeItem(key);
      });
    } catch {}
  };

  const handleSignOut = async () => {
    try {
      cleanupAuthState();
      try { await supabase.auth.signOut({ scope: "global" }); } catch {}
    } finally {
      window.location.href = "/auth";
    }
  };

  const handleJoinShared = () => {
    setJoinOpen(true);
  };

  const handleConfirmJoin = async () => {
    const code = joinCode.trim();
    if (!code) return;
    setJoinLoading(true);
    try {
      const eid = await RemoteStorageService.joinEveningByCode(code);
      if (eid) {
        toast({ title: "הצטרפת בהצלחה", description: "נטען את ההיסטוריה המשותפת" });
        const updatedHistory = await RemoteStorageService.loadEvenings();
        setTournamentHistory(updatedHistory);
        setJoinOpen(false);
        setJoinCode("");
        navigateTo('history');
      } else {
        toast({ title: "קוד לא תקין או לא מחובר", description: "וודא התחברות וקוד נכון", variant: "destructive" });
      }
    } finally {
      setJoinLoading(false);
    }
  };
  const renderCurrentState = () => {
    switch (appState) {
      case 'home':
        return (
<TournamentHome
            onStartNew={handleStartNewEvening}
            onViewHistory={handleViewHistory}
            onResume={currentEvening && !currentEvening.completed ? () => navigateTo('game') : undefined}
            onJoinShared={handleJoinShared}
            onManageTeams={() => navigateTo('teams')}
          />
        );
      
      case 'setup':
        return (
          <EveningSetup
            onBack={() => window.history.back()}
            onStartEvening={handleSetupComplete}
            savedPlayers={currentEvening?.players}
            savedWinsToComplete={currentEvening?.winsToComplete}
            savedTeamId={currentTeamId ?? undefined}
          />
        );
      
      case 'mode-selection':
        return setupData ? (
          <GameModeSelection
            onBack={() => window.history.back()}
            onStartRandomMode={handleStartRandomEvening}
            onStartCustomMode={handleStartCustomEvening}
            players={setupData.players}
            winsToComplete={setupData.winsToComplete}
            teamId={setupData.teamId}
          />
        ) : null;
      
      case 'game':
        return currentEvening ? (
          <TournamentGame
            evening={currentEvening}
            onBack={() => window.history.back()}
            onComplete={handleCompleteEvening}
            onGoHome={handleGoHome}
            onUpdateEvening={handleUpdateEvening}
          />
        ) : null;
      
      case 'summary':
        return currentEvening ? (
          <EveningSummary
            evening={currentEvening}
            onSaveToHistory={handleSaveToHistory}
            onBackToHome={() => window.history.back()}
          />
        ) : null;
      
      case 'history':
        return (
          <TournamentHistory
            evenings={tournamentHistory}
            onBack={() => window.history.back()}
            onDeleteEvening={handleDeleteEvening}
          />
        );
        case 'teams':
          return (
            <TeamsManager
              onBack={() => window.history.back()}
              onStartEveningForTeam={(teamId) => {
                setCurrentTeamId(teamId);
                navigateTo('setup');
              }}
            />
          );
        
        default:
          return null;
    }
  };

  return (
    <div className="font-sans antialiased">
      <header className="w-full flex items-center justify-end p-3">
        {isAuthed ? (
          <div className="flex items-center gap-2 text-sm">
            {userEmail && <span className="text-muted-foreground hidden sm:inline">{userEmail}</span>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Logout</Button>
            <Button asChild variant="secondary" size="sm"><Link to="/profile">Profile</Link></Button>
          </div>
        ) : (
          <Button asChild variant="secondary" size="sm"><Link to="/auth">Log in / Sign up</Link></Button>
        )}
      </header>
      <FitToScreen>
        {renderCurrentState()}
      </FitToScreen>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הצטרפות לערב משותף</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">הזן קוד שיתוף</label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ABCDE12345"
              className="bg-gaming-surface border-border"
              inputMode="text"
              autoComplete="one-time-code"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setJoinOpen(false)} disabled={joinLoading}>בטל</Button>
            <Button variant="gaming" onClick={handleConfirmJoin} disabled={joinLoading || !joinCode.trim()}>
              {joinLoading ? "מצטרף..." : "הצטרף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareCodeDialog} onOpenChange={setShowShareCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>טורניר נוצר בהצלחה!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              הטורניר החל! שתפו את הקוד הזה עם המשתתפים כדי שיוכלו להצטרף ולצפות בזמן אמת.
            </p>
            {shareCodeForDialog && (
              <div className="bg-gaming-surface p-3 rounded-md border border-border">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg">{shareCodeForDialog}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(shareCodeForDialog);
                      toast({ title: "הקוד הועתק", description: shareCodeForDialog });
                    }}
                  >
                    העתק
                  </Button>
                </div>
              </div>
            )}
            <Button onClick={() => setShowShareCodeDialog(false)} className="w-full">
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
