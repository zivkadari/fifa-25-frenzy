import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Users, Target } from "lucide-react";
import { Player } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";

interface EveningSetupProps {
  onBack: () => void;
  onStartEvening: (players: Player[], pointsToWin: number) => void;
}

export const EveningSetup = ({ onBack, onStartEvening }: EveningSetupProps) => {
  const { toast } = useToast();
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [pointsToWin, setPointsToWin] = useState([5]);

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
      description: `3 rounds • ${pointsToWin[0]} points to win each round`,
    });

    onStartEvening(players, pointsToWin[0]);
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

          {/* Points to Win */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">Points to Win</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Points needed to win each round</span>
                <span className="text-lg font-bold text-neon-green">{pointsToWin[0]}</span>
              </div>
              <Slider
                value={pointsToWin}
                onValueChange={setPointsToWin}
                min={3}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3</span>
                <span>Quick (5)</span>
                <span>10</span>
              </div>
            </div>
          </Card>

          {/* Tournament Info */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-neon-green">3 Rounds</strong> • Every pair combination plays once
              </p>
              <p className="text-xs text-muted-foreground">
                Round 1: P1+P2 vs P3+P4 • Round 2: P1+P3 vs P2+P4 • Round 3: P1+P4 vs P2+P3
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