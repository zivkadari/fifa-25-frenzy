import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, Shield, Swords, Users, Zap } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Club } from '@/types/tournament';
import { FPMatch, FPPair } from '@/types/fivePlayerTypes';
import { fetchTeamSquad } from '@/services/teamSquadService';
import { generateRecommendation } from '@/services/teamRecommendationEngine';
import { TeamSetupRecommendation, LineupSlot } from '@/services/teamSquadTypes';

interface TeamSetupButtonProps {
  club: Club | undefined;
  matchLabel: string; // e.g. "משחק נוכחי" or "המשחק הבא"
  tournamentId: string;
}

export default function TeamSetupButton({ club, matchLabel, tournamentId }: TeamSetupButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<TeamSetupRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!club) return null;
  if (club.isNational || club.isPrime) return null;

  const handleOpen = async () => {
    setOpen(true);

    // If we already have a recommendation for this club, don't refetch
    if (recommendation) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchTeamSquad(club, tournamentId);
      if (result.error || !result.squad) {
        setError(result.error || 'לא הצלחנו לטעון את נתוני הקבוצה');
        return;
      }

      if (result.squad.players.length < 11) {
        setError('לא נמצאו מספיק שחקנים בסגל');
        return;
      }

      const rec = generateRecommendation(result.squad);
      setRecommendation(rec);
    } catch {
      setError('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  const getZoneIcon = (position: string) => {
    if (position === 'GK') return <Shield className="h-3 w-3" />;
    if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(position)) return <Shield className="h-3 w-3" />;
    if (['ST', 'CF', 'RW', 'LW', 'RF', 'LF'].includes(position)) return <Swords className="h-3 w-3" />;
    return <Users className="h-3 w-3" />;
  };

  const getZoneColor = (position: string) => {
    if (position === 'GK') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(position)) return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    if (['ST', 'CF', 'RW', 'LW', 'RF', 'LF'].includes(position)) return 'text-red-400 bg-red-400/10 border-red-400/30';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-neon-green/30 text-neon-green hover:bg-neon-green/10 text-xs gap-1.5"
        onClick={handleOpen}
      >
        <Sparkles className="h-3.5 w-3.5" />
        הרכב מומלץ
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-gaming-bg border-border max-h-[85vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-neon-green" />
              הרכב מומלץ
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground text-xs">
              {club.name} · {matchLabel}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto max-h-[65vh]" dir="rtl">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 text-neon-green animate-spin" />
                <p className="text-sm text-muted-foreground">טוען נתוני סגל מ-SoFIFA...</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRecommendation(null);
                    setError(null);
                    handleOpen();
                  }}
                  className="text-xs"
                >
                  נסה שוב
                </Button>
              </div>
            )}

            {recommendation && !loading && (
              <div className="space-y-4">
                {/* Formation header */}
                <div className="flex items-center justify-between">
                  <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-sm font-bold px-3">
                    {recommendation.formationLabel}
                  </Badge>
                  <div className="text-left">
                    <p className="text-lg font-bold text-neon-green">{recommendation.overallRating}</p>
                    <p className="text-[9px] text-muted-foreground">דירוג ממוצע</p>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-muted-foreground leading-relaxed">{recommendation.summary}</p>

                {/* Starting XI */}
                <div className="space-y-1.5">
                  {recommendation.startingXI.map((slot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 bg-gaming-surface/50 rounded-lg px-3 py-2 border border-border/30"
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono w-10 justify-center ${getZoneColor(slot.position)}`}
                      >
                        {slot.position}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground leading-tight truncate">
                          {slot.player.shortName}
                        </p>
                        <p className="text-[9px] text-muted-foreground leading-tight truncate">
                          {slot.positionLabel} · {slot.reasoning}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">
                        {slot.player.overallRating}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                <p className="text-[9px] text-muted-foreground text-center pt-2">
                  💡 המלצה בלבד · מבוסס על נתוני SoFIFA · לא משנה את הטורניר
                </p>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
