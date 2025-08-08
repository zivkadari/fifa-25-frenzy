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
  savedPlayers?: Player[];
  savedWinsToComplete?: number;
}

export const EveningSetup = ({ onBack, onStartEvening, savedPlayers, savedWinsToComplete }: EveningSetupProps) => {
  const { toast } = useToast();
  const [playerNames, setPlayerNames] = useState(
    savedPlayers ? savedPlayers.map(p => p.name) : ['', '', '', '']
  );
  const [winsToComplete, setWinsToComplete] = useState(savedWinsToComplete || 4);

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
        title: "שמות שחקנים לא תקינים",
        description: "יש למלא את כל שמות השחקנים",
        variant: "destructive",
      });
      return;
    }

    // Validate unique names
    const uniqueNames = new Set(trimmedNames);
    if (uniqueNames.size !== 4) {
      toast({
        title: "שמות שחקנים כפולים", 
        description: "כל שמות השחקנים חייבים להיות ייחודיים",
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
      title: "הטורניר מתחיל!",
      description: `3 סיבובים • הראשון ל-${winsToComplete} ניצחונות בכל סיבוב`,
    });

    onStartEvening(players, winsToComplete);
  };

  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">הגדרת הערב</h1>
            <p className="text-muted-foreground text-sm">הגדר את הטורניר עבור <span className="ltr-numbers">4</span> שחקנים</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Player Names */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">שמות השחקנים</h2>
            </div>
            <div className="space-y-3">
              {playerNames.map((name, index) => (
                <div key={index}>
                  <Label htmlFor={`player-${index}`} className="text-sm text-muted-foreground">
                    שחקן <span className="ltr-numbers">{index + 1}</span>
                  </Label>
                  <Input
                    id={`player-${index}`}
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    placeholder={`הזן שם שחקן ${index + 1}`}
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
              <h2 className="text-lg font-semibold text-foreground">ניצחונות לסיום סיבוב</h2>
            </div>
            <div className="space-y-3">
              <Label htmlFor="wins-to-complete" className="text-sm text-muted-foreground">
                הזוג הראשון שיגיע למספר הניצחונות הזה יזכה בסיבוב
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
                <span className="text-2xl font-bold text-neon-green min-w-[3ch] text-center ltr-numbers">
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
                מקסימום <span className="ltr-numbers">{winsToComplete * 2 - 1}</span> משחקים בסיבוב. אם תיקו ב-<span className="ltr-numbers">{winsToComplete}-{winsToComplete}</span>, משחק החלטה קובע את הזוכה.
              </p>
            </div>
          </Card>

          {/* Tournament Info */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-neon-green"><span className="ltr-numbers">3</span> סיבובים</strong> • פורמט כולם נגד כולם
              </p>
              <p className="text-xs text-muted-foreground">
                סיבוב <span className="ltr-numbers">1</span>: ש<span className="ltr-numbers">1</span>+ש<span className="ltr-numbers">2</span> נגד ש<span className="ltr-numbers">3</span>+ש<span className="ltr-numbers">4</span> • סיבוב <span className="ltr-numbers">2</span>: ש<span className="ltr-numbers">1</span>+ש<span className="ltr-numbers">3</span> נגד ש<span className="ltr-numbers">2</span>+ש<span className="ltr-numbers">4</span> • סיבוב <span className="ltr-numbers">3</span>: ש<span className="ltr-numbers">1</span>+ש<span className="ltr-numbers">4</span> נגד ש<span className="ltr-numbers">2</span>+ש<span className="ltr-numbers">3</span>
              </p>
              <p className="text-xs text-muted-foreground">
                הראשון ל-<span className="ltr-numbers">{winsToComplete}</span> ניצחונות זוכה בסיבוב • בחירת קבוצות אקראית לכל המשחקים כולל שוברי שוויון
              </p>
            </div>
          </Card>

          <Button
            variant="gaming"
            size="xl"
            onClick={validateAndStart}
            className="w-full"
          >
            התחל טורניר
          </Button>
        </div>
      </div>
    </div>
  );
};