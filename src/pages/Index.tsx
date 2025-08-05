import { useState, useEffect } from "react";
import { TournamentHome } from "@/components/TournamentHome";
import { EveningSetup } from "@/components/EveningSetup";
import { TournamentGame } from "@/components/TournamentGame";
import { EveningSummary } from "@/components/EveningSummary";
import { TournamentHistory } from "@/components/TournamentHistory";
import { Evening, Player } from "@/types/tournament";

import { StorageService } from "@/services/storageService";

type AppState = 'home' | 'setup' | 'game' | 'summary' | 'history';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentEvening, setCurrentEvening] = useState<Evening | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Evening[]>([]);

  useEffect(() => {
    // Load tournament history on app start
    const history = StorageService.loadEvenings();
    setTournamentHistory(history);
  }, []);

  const handleStartNewEvening = () => {
    setAppState('setup');
    setCurrentEvening(null);
  };

  const handleViewHistory = () => {
    setAppState('history');
  };

  const handleBackToHome = () => {
    setAppState('home');
    setCurrentEvening(null);
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
    setAppState('game');
  };

  const handleCompleteEvening = (evening: Evening) => {
    setCurrentEvening(evening);
    setAppState('summary');
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
            onBack={handleBackToHome}
            onStartEvening={handleStartEvening}
          />
        );
      
      case 'game':
        return currentEvening ? (
          <TournamentGame
            evening={currentEvening}
            onBack={handleBackToHome}
            onComplete={handleCompleteEvening}
          />
        ) : null;
      
      case 'summary':
        return currentEvening ? (
          <EveningSummary
            evening={currentEvening}
            onSaveToHistory={handleSaveToHistory}
            onBackToHome={handleBackToHome}
          />
        ) : null;
      
      case 'history':
        return (
          <TournamentHistory
            evenings={tournamentHistory}
            onBack={handleBackToHome}
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
