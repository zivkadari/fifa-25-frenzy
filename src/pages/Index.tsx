import { useState, useEffect } from "react";
import { TournamentHome } from "@/components/TournamentHome";
import { EveningSetup } from "@/components/EveningSetup";
import { TournamentGame } from "@/components/TournamentGame";
import { EveningSummary } from "@/components/EveningSummary";
import { TournamentHistory } from "@/components/TournamentHistory";
import { FloatingScoreTable } from "@/components/FloatingScoreTable";
import { Evening, Player } from "@/types/tournament";
import { StorageService } from "@/services/storageService";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { useToast } from "@/hooks/use-toast";
import FitToScreen from "@/components/FitToScreen";

type AppState = 'home' | 'setup' | 'game' | 'summary' | 'history';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentEvening, setCurrentEvening] = useState<Evening | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Evening[]>([]);
  const { toast } = useToast();

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

const handleStartEvening = (players: Player[], winsToComplete: number) => {
    const newEvening: Evening = {
      id: `evening-${Date.now()}`,
      date: new Date().toISOString(),
      players,
      rounds: [],
      winsToComplete,
      completed: false
    };

    setCurrentEvening(newEvening);
    // Push an initial copy to Supabase for realtime collaboration (no-op if disabled)
    RemoteStorageService.upsertEveningLive(newEvening).catch(() => {});
    navigateTo('game');
  };

  const handleCompleteEvening = (evening: Evening) => {
    setCurrentEvening(evening);
    navigateTo('summary');
  };

const handleSaveToHistory = async (evening: Evening) => {
    try {
      if (RemoteStorageService.isEnabled()) {
        await RemoteStorageService.saveEvening(evening);
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

  const renderCurrentState = () => {
    switch (appState) {
      case 'home':
        return (
          <TournamentHome
            onStartNew={handleStartNewEvening}
            onViewHistory={handleViewHistory}
            onResume={currentEvening && !currentEvening.completed ? () => navigateTo('game') : undefined}
          />
        );
      
      case 'setup':
        return (
          <EveningSetup
            onBack={() => window.history.back()}
            onStartEvening={handleStartEvening}
            savedPlayers={currentEvening?.players}
            savedWinsToComplete={currentEvening?.winsToComplete}
          />
        );
      
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
      
      default:
        return null;
    }
  };

  return (
    <div className="font-sans antialiased">
      <FitToScreen>
        {renderCurrentState()}
      </FitToScreen>
    </div>
  );
};

export default Index;
