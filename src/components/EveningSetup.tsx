import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { Player } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";

interface EveningSetupProps {
  onBack: () => void;
  onStartEvening: (players: Player[], winsToComplete: number) => void;
}

export const EveningSetup = ({ onBack, onStartEvening }: EveningSetupProps) => {
  const { toast } = useToast();
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [winsToComplete, setWinsToComplete] = useState(4);

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const validateAndStart = () => {
    // Validate non-empty names
    const trimmedNames = playerNames.map(name => name.trim());
    if (trimmedNames.some(name => name === '')) {
      toast({
        title: "Invalid Player Names",
        description: "All player names must be filled out",
        variant: "destructive",
      });
      return;
    }

    // Validate unique names
    const uniqueNames = new Set(trimmedNames);
    if (uniqueNames.size !== 4) {
      toast({
        title: "Duplicate Player Names", 
        description: "All player names must be unique",
        variant: "destructive",
      });
      return;
    }

    // Create players
    const players: Player[] = trimmedNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name
    }));

    toast({
      title: "Tournament Starting!",
      description: `3 rounds • First to ${winsToComplete} wins per round`,
    });

    onStartEvening(players, winsToComplete);
  };

  return (
    <div className="min-h-screen bg-gaming-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Evening Setup</h1>
            <p className="text-muted-foreground text-sm">Configure your 4-player tournament</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Player Names */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">Player Names</h2>
            </div>
            <div className="space-y-3">
              {playerNames.map((name, index) => (
                <div key={index}>
                  <Label htmlFor={`player-${index}`} className="text-sm text-muted-foreground">
                    Player {index + 1}
                  </Label>
                  <Input
                    id={`player-${index}`}
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    placeholder={`Enter player ${index + 1} name`}
                    className="bg-gaming-surface border-border focus:border-neon-green"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Wins to Complete Round */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">Wins to Complete Round</h2>
            </div>
            <div className="space-y-3">
              <Label htmlFor="wins-to-complete" className="text-sm text-muted-foreground">
                First pair to reach this many wins takes the round
              </Label>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setWinsToComplete(Math.max(1, winsToComplete - 1))}
                  disabled={winsToComplete <= 1}
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-neon-green min-w-[3ch] text-center">
                  {winsToComplete}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setWinsToComplete(Math.min(10, winsToComplete + 1))}
                  disabled={winsToComplete >= 10}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Max {winsToComplete * 2 - 1} matches per round. If tied at {winsToComplete}-{winsToComplete}, sudden death match decides winner.
              </p>
            </div>
          </Card>

          {/* Tournament Info */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-neon-green">3 Rounds</strong> • Round-robin format
              </p>
              <p className="text-xs text-muted-foreground">
                Round 1: P1+P2 vs P3+P4 • Round 2: P1+P3 vs P2+P4 • Round 3: P1+P4 vs P2+P3
              </p>
              <p className="text-xs text-muted-foreground">
                First to {winsToComplete} wins takes the round • Random team selection for all matches including tiebreakers
              </p>
            </div>
          </Card>

          <Button
            variant="gaming"
            size="xl"
            onClick={validateAndStart}
            className="w-full"
          >
            Start Tournament
          </Button>
        </div>
      </div>
    </div>
  );
};