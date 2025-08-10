import { useState, useEffect } from "react";
import { TournamentHome } from "@/components/TournamentHome";
import { EveningSetup } from "@/components/EveningSetup";
import { TournamentGame } from "@/components/TournamentGame";
import { EveningSummary } from "@/components/EveningSummary";
import { TournamentHistory } from "@/components/TournamentHistory";
import { FloatingScoreTable } from "@/components/FloatingScoreTable";
import { Evening, Player } from "@/types/tournament";

import { StorageService } from "@/services/storageService";

type AppState = 'home' | 'setup' | 'game' | 'summary' | 'history';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentEvening, setCurrentEvening] = useState<Evening | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Evening[]>([]);

  // Navigation helper that also pushes into browser history so Back goes to previous screen
  const navigateTo = (next: AppState) => {
    if (window.history.state?.appState !== next) {
      window.history.pushState({ appState: next }, '', '');
    }
    setAppState(next);
  };

  useEffect(() => {
    // Load tournament history on app start
    const history = StorageService.loadEvenings();
    setTournamentHistory(history);

    // Initialize history state and popstate handler
    if (!window.history.state || !window.history.state.appState) {
      window.history.replaceState({ appState: 'home' }, '', '');
    }
    const onPop = (e: PopStateEvent) => {
      const state = (e.state?.appState as AppState) || 'home';
      setAppState(state);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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
    navigateTo('game');
  };

  const handleCompleteEvening = (evening: Evening) => {
    setCurrentEvening(evening);
    navigateTo('summary');
  };

  const handleSaveToHistory = (evening: Evening) => {
    StorageService.saveEvening(evening);
    const updatedHistory = StorageService.loadEvenings();
    setTournamentHistory(updatedHistory);
  };

  const handleDeleteEvening = (eveningId: string) => {
    StorageService.deleteEvening(eveningId);
    const updatedHistory = StorageService.loadEvenings();
    setTournamentHistory(updatedHistory);
  };

  const renderCurrentState = () => {
    switch (appState) {
      case 'home':
        return (
          <TournamentHome
            onStartNew={handleStartNewEvening}
            onViewHistory={handleViewHistory}
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
      {renderCurrentState()}
    </div>
  );
};

export default Index;
