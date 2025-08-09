import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";

interface DiceScoreInputProps {
  onSubmit: (score1: number, score2: number) => void;
  disabled?: boolean;
}

export const DiceScoreInput = ({ onSubmit, disabled = false }: DiceScoreInputProps) => {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const adjustScore = (player: 1 | 2, increment: boolean) => {
    if (player === 1) {
      setScore1(prev => increment ? prev + 1 : Math.max(0, prev - 1));
    } else {
      setScore2(prev => increment ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleSubmit = () => {
    onSubmit(score1, score2);
    setScore1(0);
    setScore2(0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-center text-foreground">
        Enter Match Result
      </h2>
      
      <div className="flex items-center justify-center gap-8">
        {/* Player 1 Score */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustScore(1, true)}
            disabled={disabled}
            className="border-neon-green/50 hover:border-neon-green"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="text-3xl font-bold text-neon-green text-center min-w-[3ch]">
              {score1}
            </div>
          </Card>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustScore(1, false)}
            disabled={disabled || score1 === 0}
            className="border-neon-green/50 hover:border-neon-green"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* VS Separator */}
        <div className="text-neon-green font-bold text-xl">VS</div>

        {/* Player 2 Score */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustScore(2, true)}
            disabled={disabled}
            className="border-neon-green/50 hover:border-neon-green"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="text-3xl font-bold text-neon-green text-center min-w-[3ch]">
              {score2}
            </div>
          </Card>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustScore(2, false)}
            disabled={disabled || score2 === 0}
            className="border-neon-green/50 hover:border-neon-green"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button
        variant="gaming"
        size="lg"
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full"
      >
        Submit Result
      </Button>
    </div>
  );
};