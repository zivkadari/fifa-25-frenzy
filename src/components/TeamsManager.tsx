import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { TournamentEngine } from "@/services/tournamentEngine";
import { Evening, PlayerStats } from "@/types/tournament";
import { ArrowLeft, Users, Plus, Trash2, Trophy } from "lucide-react";

interface TeamsManagerProps {
  onBack: () => void;
  onStartEveningForTeam: (teamId: string) => void;
}

export const TeamsManager = ({ onBack, onStartEveningForTeam }: TeamsManagerProps) => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Array<{ id: string; name: string }>>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [teamEvenings, setTeamEvenings] = useState<Evening[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const list = await RemoteStorageService.listTeams();
      setTeams(list);
      if (list.length && !selectedTeamId) {
        setSelectedTeamId(list[0].id);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    const loadTeam = async () => {
      setLoading(true);
      try {
        const [players, evenings] = await Promise.all([
          RemoteStorageService.listTeamPlayers(selectedTeamId),
          RemoteStorageService.loadEveningsByTeam(selectedTeamId),
        ]);
        setTeamPlayers(players);
        setTeamEvenings(evenings);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [selectedTeamId]);

  const leaderboard: PlayerStats[] = useMemo(() => {
    // Aggregate stats across all evenings for this team
    const map = new Map<string, PlayerStats>();
    const addStats = (ps: PlayerStats) => {
      const prev = map.get(ps.player.id);
      if (!prev) {
        map.set(ps.player.id, { ...ps });
        return;
      }
      prev.wins += ps.wins;
      prev.goalsFor += ps.goalsFor;
      prev.goalsAgainst += ps.goalsAgainst;
      prev.points += ps.points;
      prev.longestWinStreak = Math.max(prev.longestWinStreak, ps.longestWinStreak);
    };
    teamEvenings.forEach((e) => {
      TournamentEngine.calculatePlayerStats(e).forEach(addStats);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }, [teamEvenings]);

  const createTeam = async () => {
    const name = newTeamName.trim();
    if (!name) return;
    const created = await RemoteStorageService.createTeam(name);
    if (created) {
      setTeams((prev) => [created, ...prev]);
      setNewTeamName("");
      setSelectedTeamId(created.id);
      toast({ title: "קבוצה נוצרה", description: name });
    } else {
      toast({ title: "שגיאה ביצירת קבוצה", variant: "destructive" });
    }
  };

  const addPlayer = async () => {
    if (!selectedTeamId) return;
    const name = newPlayerName.trim();
    if (!name) return;
    const ok = await RemoteStorageService.addPlayerToTeamByName(selectedTeamId, name);
    if (ok) {
      setNewPlayerName("");
      const players = await RemoteStorageService.listTeamPlayers(selectedTeamId);
      setTeamPlayers(players);
    } else {
      toast({ title: "שגיאה בהוספת שחקן", variant: "destructive" });
    }
  };

  const removePlayer = async (pid: string) => {
    if (!selectedTeamId) return;
    const ok = await RemoteStorageService.removePlayerFromTeam(selectedTeamId, pid);
    if (ok) {
      setTeamPlayers((prev) => prev.filter((p) => p.id !== pid));
    } else {
      toast({ title: "שגיאה במחיקה", variant: "destructive" });
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!window.confirm("אתה בטוח שברצונך למחוק את הקבוצה? הפעולה לא ניתנת לביטול.")) return;
    const ok = await RemoteStorageService.deleteTeam(teamId);
    if (ok) {
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      if (selectedTeamId === teamId) {
        setSelectedTeamId(null);
        setTeamPlayers([]);
      }
      toast({ title: "קבוצה נמחקה", description: "הקבוצה נמחקה בהצלחה" });
    } else {
      toast({ title: "שגיאה במחיקת קבוצה", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="חזרה">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ניהול קבוצות</h1>
            <p className="text-muted-foreground text-sm">יצירה, הוספה וניהול שחקנים בקבוצה</p>
          </div>
        </div>

        {/* Teams list and create */}
        <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-neon-green" />
            <h2 className="text-lg font-semibold text-foreground">הקבוצות שלי</h2>
          </div>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="שם קבוצה חדשה"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="bg-gaming-surface border-border"
            />
            <Button variant="outline" onClick={createTeam}>
              <Plus className="h-4 w-4" />
              צור
            </Button>
          </div>
          <div className="space-y-2">
            {teams
              .filter((t) => teamPlayers.length > 0 || selectedTeamId !== t.id) // Hide empty teams unless selected
              .map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <Button
                    variant={t.id === selectedTeamId ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTeamId(t.id)}
                    className="flex-1"
                  >
                    {t.name}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => deleteTeam(t.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            {!teams.length && (
              <p className="text-sm text-muted-foreground">אין קבוצות עדיין</p>
            )}
          </div>
        </Card>

        {selectedTeamId && (
          <>
            {/* Players management */}
            <Card className="bg-gaming-surface/50 border-border/50 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">שחקני הקבוצה</h3>
                <Button variant="gaming" size="sm" onClick={() => onStartEveningForTeam(selectedTeamId!)}>
                  התחל ערב לקבוצה זו
                </Button>
              </div>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="שם שחקן להוספה"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="bg-gaming-surface border-border"
                />
                <Button variant="outline" onClick={addPlayer}>
                  <Plus className="h-4 w-4" />
                  הוסף
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teamPlayers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-border/50 py-1">
                    <span className="text-foreground">{p.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => removePlayer(p.id)} aria-label="הסר">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {!teamPlayers.length && <p className="text-sm text-muted-foreground">אין שחקנים עדיין</p>}
              </div>
            </Card>

            {/* Team leaderboard */}
            <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg font-semibold text-foreground">טבלת על של הקבוצה</h2>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                כולל את כל הערבים המשויכים לקבוצה זו אי פעם
              </div>
              <Separator className="mb-3" />
              <div className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">טוען...</p>
                ) : leaderboard.length ? (
                  leaderboard.map((s, idx) => (
                    <div key={s.player.id} className="flex items-center justify-between border-b border-border/50 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-5 text-right">{idx + 1}</span>
                        <span className="text-foreground font-medium">{s.player.name}</span>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <span className="inline-block min-w-[4ch]">נק׳ {s.points}</span>
                        <span className="inline-block min-w-[4ch] ml-3">ניצ׳ {s.wins}</span>
                        <span className="inline-block min-w-[7ch] ml-3">שערים {s.goalsFor}:{s.goalsAgainst}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">אין נתונים להצגה</p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
