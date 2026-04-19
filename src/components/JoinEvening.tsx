import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RemoteStorageService } from "@/services/remoteStorageService";

interface JoinEveningProps {
  onBack: () => void;
  onJoinSuccess: (eveningId: string) => void;
  onJoinTeamSuccess?: (teamId: string, teamName: string) => void;
}

export const JoinEvening = ({ onBack, onJoinSuccess, onJoinTeamSuccess }: JoinEveningProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      toast({
        title: "קוד נדרש",
        description: "אנא הזן קוד הצטרפות",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1) Try as evening/tournament code first
      const eveningId = await RemoteStorageService.joinEveningByCode(trimmedCode);
      if (eveningId) {
        toast({
          title: "הצטרפת בהצלחה!",
          description: "אתה יכול כעת לצפות ולהשתתף בטורניר",
        });
        onJoinSuccess(eveningId);
        return;
      }

      // 2) Fallback: maybe the user pasted a TEAM invite code by mistake.
      //    Try the team-join flow as a safety net.
      try {
        const teamResult = await RemoteStorageService.joinTeamByCode(trimmedCode);
        if (teamResult) {
          toast({
            title: "הצטרפת לקבוצה!",
            description: `${teamResult.team_name} — לקישור שחקן עבור לפרופיל`,
          });
          if (onJoinTeamSuccess) {
            onJoinTeamSuccess(teamResult.team_id, teamResult.team_name);
          } else {
            // Default: send the user to the team-join flow which handles linking
            window.location.href = `/join-team/${trimmedCode}`;
          }
          return;
        }
      } catch {
        // ignore — fall through to generic error
      }

      toast({
        title: "קוד לא תקין",
        description: "הקוד לא נמצא כקוד טורניר ולא כקוד קבוצה",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להצטרף כרגע",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">הצטרף לערב</h1>
            <p className="text-muted-foreground text-sm">הזן קוד להצטרפות לטורניר קיים</p>
          </div>
        </div>

        <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-neon-green" />
            <h2 className="text-lg font-semibold text-foreground">קוד הצטרפות</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="join-code" className="text-sm text-muted-foreground">
                הזן את הקוד שקיבלת מהמארגן
              </Label>
              <Input
                id="join-code"
                placeholder="הזן קוד..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="bg-gaming-surface border-border text-center text-2xl font-mono tracking-wider"
                maxLength={10}
              />
            </div>

            <Button
              variant="gaming"
              size="xl"
              onClick={handleJoin}
              disabled={loading || !code.trim()}
              className="w-full"
            >
              {loading ? "מצטרף..." : "הצטרף לערב"}
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• הקוד מורכב מ-6-10 תווים</p>
              <p>• לאחר הצטרפות תוכל לצפות בטורניר ולהזין ציונים</p>
              <p>• רק המארגן יכול להתחיל משחקים חדשים</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};