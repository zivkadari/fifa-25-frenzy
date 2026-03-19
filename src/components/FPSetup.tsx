import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X, Play, Users } from "lucide-react";
import { Player } from "@/types/tournament";
import { useToast } from "@/hooks/use-toast";

interface FPSetupProps {
  onBack: () => void;
  onStart: (players: Player[]) => void;
  savedPlayers?: Player[];
}

export const FPSetup = ({ onBack, onStart, savedPlayers }: FPSetupProps) => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>(
    savedPlayers && savedPlayers.length === 5
      ? savedPlayers
      : Array.from({ length: 5 }, (_, i) => ({ id: `player-${Date.now()}-${i}`, name: '' }))
  );

  const updateName = (index: number, name: string) => {
    const updated = [...players];
    updated[index] = { ...updated[index], name };
    setPlayers(updated);
  };

  const allFilled = players.every(p => p.name.trim().length > 0);
  const hasDuplicates = new Set(players.map(p => p.name.trim().toLowerCase())).size < 5;

  const handleStart = () => {
    if (!allFilled) {
      toast({ title: "יש למלא את כל השמות", variant: "destructive" });
      return;
    }
    if (hasDuplicates) {
      toast({ title: "שמות השחקנים חייבים להיות ייחודיים", variant: "destructive" });
      return;
    }
    // Trim names
    const cleaned = players.map(p => ({ ...p, name: p.name.trim() }));
    onStart(cleaned);
  };

  return (
    <div className="min-h-[100svh] bg-gaming-bg flex flex-col p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5 rotate-180" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">ליגת זוגות (5 שחקנים)</h1>
          <p className="text-xs text-muted-foreground">6 סיבובים • 30 משחקים • 10 זוגות</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Card className="bg-gradient-card border-neon-green/20 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-neon-green" />
              <h2 className="text-base font-semibold text-foreground">הזינו 5 שחקנים</h2>
            </div>
            <div className="space-y-3">
              {players.map((player, idx) => (
                <Input
                  key={player.id}
                  placeholder={`שחקן ${idx + 1}`}
                  value={player.name}
                  onChange={e => updateName(idx, e.target.value)}
                  className="bg-gaming-surface border-border text-right"
                />
              ))}
            </div>
          </Card>

          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                <strong className="text-neon-green">10 זוגות</strong> • כל שחקן ב-4 משחקים לסיבוב
              </p>
              <p className="text-xs text-muted-foreground">
                כל זוג מקבל בנק של 6 קבוצות: 2×5★ / 2×4.5★ / 2×4★
              </p>
            </div>
          </Card>

          <Button
            variant="gaming"
            size="lg"
            className="w-full"
            onClick={handleStart}
            disabled={!allFilled || hasDuplicates}
          >
            <Play className="h-5 w-5" />
            התחל ליגה
          </Button>
        </div>
      </div>
    </div>
  );
};
