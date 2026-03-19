import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Check, Play } from "lucide-react";
import { FPEvening, FPTeamBank, FPPair } from "@/types/fivePlayerTypes";
import { useToast } from "@/hooks/use-toast";

interface FPBankOverviewProps {
  evening: FPEvening;
  onContinue: () => void;
  onBack: () => void;
}

export const FPBankOverview = ({ evening, onContinue, onBack }: FPBankOverviewProps) => {
  const { toast } = useToast();
  const [copiedPairId, setCopiedPairId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const pairName = (pair: FPPair) =>
    `${pair.players[0].name} & ${pair.players[1].name}`;

  const renderStars = (stars: number) => {
    const full = Math.floor(stars);
    const half = stars % 1 !== 0;
    return '★'.repeat(full) + (half ? '☆' : '');
  };

  const formatPairBank = (pair: FPPair, bank: FPTeamBank) => {
    const lines = [`*${pairName(pair)}*`];
    bank.clubs.forEach(club => {
      lines.push(`- ${club.name} (${renderStars(club.stars)})`);
    });
    return lines.join('\n');
  };

  const formatAllBanks = () => {
    const sections = evening.pairs.map(pair => {
      const bank = evening.teamBanks.find(b => b.pairId === pair.id);
      if (!bank) return '';
      return formatPairBank(pair, bank);
    });
    return `🏆 *ליגת 5 שחקנים*\n${evening.players.map(p => p.name).join(', ')}\n\n${sections.join('\n\n')}`;
  };

  const handleCopyPair = async (pair: FPPair, bank: FPTeamBank) => {
    try {
      await navigator.clipboard.writeText(formatPairBank(pair, bank));
      setCopiedPairId(pair.id);
      setTimeout(() => setCopiedPairId(null), 1500);
    } catch {
      toast({ title: "שגיאה בהעתקה", variant: "destructive" });
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatAllBanks());
      setCopiedAll(true);
      toast({ title: "הועתק בהצלחה!" });
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      toast({ title: "שגיאה בהעתקה", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[100svh] bg-gaming-bg p-3 pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
      <div className="max-w-md mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">בנקים - סקירה</h1>
              <p className="text-xs text-muted-foreground">
                {evening.players.map(p => p.name).join(', ')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-neon-green/30"
            onClick={handleCopyAll}
          >
            {copiedAll ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedAll ? 'הועתק!' : 'העתק הכל'}
          </Button>
        </div>

        {/* Pair banks */}
        {evening.pairs.map((pair, idx) => {
          const bank = evening.teamBanks.find(b => b.pairId === pair.id);
          if (!bank) return null;
          const isCopied = copiedPairId === pair.id;

          return (
            <Card key={pair.id} className="bg-gradient-card border-border/40 p-3 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
                  <span className="text-sm font-semibold text-foreground">{pairName(pair)}</span>
                </div>
                <button
                  onClick={() => handleCopyPair(pair, bank)}
                  className="p-1.5 rounded-md hover:bg-gaming-surface/80 transition-colors"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-neon-green" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {bank.clubs.map(club => (
                  <div
                    key={club.id}
                    className="flex items-center justify-between bg-gaming-surface/60 rounded-md px-2 py-1.5 border border-border/30"
                  >
                    <span className="text-xs text-foreground truncate">{club.name}</span>
                    <span className="text-yellow-400 text-[10px] mr-1 whitespace-nowrap">
                      {renderStars(club.stars)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {/* Continue button */}
        <Button
          variant="gaming"
          size="lg"
          className="w-full"
          onClick={onContinue}
        >
          <Play className="h-5 w-5" />
          התחל משחקים
        </Button>
      </div>
    </div>
  );
};
