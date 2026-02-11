import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Trophy, User, Edit2, Check, X, UserCheck, Target, Medal, Award, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { StorageService } from "@/services/storageService";
import type { Evening } from "@/types/tournament";
import { toast } from "sonner";

interface GlobalStats {
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  goals_for: number;
  goals_against: number;
  alpha_count: number;
  beta_count: number;
  gamma_count: number;
  delta_count: number;
}

interface TeamStats extends GlobalStats {
  team_id: string;
  team_name: string;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [evenings, setEvenings] = useState<Evening[]>([]);
  const [teamMemberships, setTeamMemberships] = useState<Array<{ team_id: string; team_name: string; role: string }>>([]);
  
  // Profile state
  const [displayName, setDisplayName] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  
  // Claimed player state
  const [claimedPlayer, setClaimedPlayer] = useState<{ player_id: string; player_name: string } | null>(null);
  const [allPlayers, setAllPlayers] = useState<Array<{ id: string; name: string }>>([]);
  const [showClaimSelect, setShowClaimSelect] = useState(false);

  // Stats state
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setUserEmail(user.email ?? null);
        setUserId(user.id);

        // Load profile
        const profile = await RemoteStorageService.getProfile(user.id);
        if (profile && mounted) {
          setDisplayName(profile.display_name);
        }

        // Load claimed player
        const claimed = await RemoteStorageService.getClaimedPlayer();
        if (mounted) setClaimedPlayer(claimed);

        // Load evenings (remote if available, otherwise local)
        let evs: Evening[] = [];
        try {
          evs = await RemoteStorageService.loadEvenings();
        } catch { evs = []; }
        if (!evs.length) {
          evs = StorageService.loadEvenings();
        }
        if (mounted) setEvenings(evs);

        // Load team memberships
        try {
          const memberships = await RemoteStorageService.getUserTeamMemberships();
          if (mounted) setTeamMemberships(memberships);
        } catch {}

        // Load all players for claiming
        try {
          const players = await RemoteStorageService.listAllPlayers();
          if (mounted) setAllPlayers(players);
        } catch {}

        // Load stats if player is claimed
        if (claimed && mounted) {
          setStatsLoading(true);
          try {
            const [global, byTeam] = await Promise.all([
              RemoteStorageService.getPlayerStatsGlobal(claimed.player_id),
              RemoteStorageService.getPlayerStatsByTeam(claimed.player_id)
            ]);
            if (mounted) {
              setGlobalStats(global);
              setTeamStats(byTeam);
            }
          } catch {}
          if (mounted) setStatsLoading(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Reload stats when claimed player changes
  useEffect(() => {
    if (!claimedPlayer) {
      setGlobalStats(null);
      setTeamStats([]);
      return;
    }
    
    let mounted = true;
    (async () => {
      setStatsLoading(true);
      try {
        const [global, byTeam] = await Promise.all([
          RemoteStorageService.getPlayerStatsGlobal(claimedPlayer.player_id),
          RemoteStorageService.getPlayerStatsByTeam(claimedPlayer.player_id)
        ]);
        if (mounted) {
          setGlobalStats(global);
          setTeamStats(byTeam);
        }
      } catch {}
      if (mounted) setStatsLoading(false);
    })();
    return () => { mounted = false; };
  }, [claimedPlayer?.player_id]);

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      toast.error("שם התצוגה לא יכול להיות ריק");
      return;
    }
    const success = await RemoteStorageService.updateProfile({ display_name: newDisplayName.trim() });
    if (success) {
      setDisplayName(newDisplayName.trim());
      setEditingName(false);
      toast.success("שם התצוגה עודכן בהצלחה");
    } else {
      toast.error("שגיאה בעדכון שם התצוגה");
    }
  };

  const handleClaimPlayer = async (playerId: string) => {
    const success = await RemoteStorageService.claimPlayer(playerId);
    if (success) {
      const player = allPlayers.find(p => p.id === playerId);
      setClaimedPlayer({ player_id: playerId, player_name: player?.name || playerId });
      setShowClaimSelect(false);
      toast.success("השחקן קושר לחשבון שלך בהצלחה");
    } else {
      toast.error("שגיאה בקישור השחקן - ייתכן שכבר קושר למשתמש אחר");
    }
  };

  const handleUnclaimPlayer = async () => {
    const success = await RemoteStorageService.unclaimPlayer();
    if (success) {
      setClaimedPlayer(null);
      toast.success("הקישור לשחקן הוסר");
    } else {
      toast.error("שגיאה בהסרת הקישור");
    }
  };

  const winRate = globalStats && globalStats.games_played > 0 
    ? Math.round((globalStats.games_won / globalStats.games_played) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gaming-bg p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">הפרופיל שלי</h1>
            <p className="text-muted-foreground text-sm">{userEmail || "לא מחובר"}</p>
          </div>
        </div>

        {loading ? (
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            טוען פרופיל...
          </Card>
        ) : !userEmail ? (
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card text-center">
            <p className="mb-4">כדי לראות היסטוריה וקבוצות, התחבר לחשבון.</p>
            <Button variant="gaming" onClick={() => (window.location.href = "/auth")}>התחבר</Button>
          </Card>
        ) : (
          <>
            {/* Profile Info */}
            <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg font-semibold text-foreground">פרטי פרופיל</h2>
              </div>
              
              <div className="space-y-4">
                {/* Display Name */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">שם תצוגה:</span>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        className="h-8 w-32"
                        maxLength={50}
                      />
                      <Button size="icon" variant="ghost" onClick={handleUpdateDisplayName}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{displayName}</span>
                      <Button size="icon" variant="ghost" onClick={() => { setNewDisplayName(displayName); setEditingName(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Claimed Player */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">שחקן מקושר:</span>
                  {claimedPlayer ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        {claimedPlayer.player_name}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={handleUnclaimPlayer}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : showClaimSelect ? (
                    <div className="flex items-center gap-2">
                      <Select onValueChange={handleClaimPlayer}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="בחר שחקן" />
                        </SelectTrigger>
                        <SelectContent>
                          {allPlayers.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => setShowClaimSelect(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setShowClaimSelect(true)}>
                      קשר שחקן
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Global Stats */}
            {claimedPlayer && (
              <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-neon-green" />
                  <h2 className="text-lg font-semibold text-foreground">סטטיסטיקות כלליות</h2>
                </div>
                
                {statsLoading ? (
                  <p className="text-sm text-muted-foreground">טוען סטטיסטיקות...</p>
                ) : globalStats ? (
                  <div className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-gaming-surface rounded-lg">
                        <div className="text-2xl font-bold text-neon-green">{globalStats.games_played}</div>
                        <div className="text-xs text-muted-foreground">משחקים</div>
                      </div>
                      <div className="text-center p-3 bg-gaming-surface rounded-lg">
                        <div className="text-2xl font-bold text-green-400">{globalStats.games_won}</div>
                        <div className="text-xs text-muted-foreground">נצחונות</div>
                      </div>
                      <div className="text-center p-3 bg-gaming-surface rounded-lg">
                        <div className="text-2xl font-bold text-foreground">{winRate}%</div>
                        <div className="text-xs text-muted-foreground">אחוז נצחון</div>
                      </div>
                    </div>

                    {/* Goals */}
                    <div className="flex items-center justify-between p-3 bg-gaming-surface rounded-lg">
                      <span className="text-sm text-muted-foreground">שערים</span>
                      <span className="font-bold text-foreground">{globalStats.goals_for} : {globalStats.goals_against}</span>
                    </div>

                    {/* Rankings */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-center p-2 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                        <Trophy className="h-4 w-4 text-yellow-400 mb-1" />
                        <span className="text-lg font-bold text-yellow-400">{globalStats.alpha_count}</span>
                        <span className="text-xs text-muted-foreground">אלפא</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-400/10 rounded-lg border border-gray-400/30">
                        <Medal className="h-4 w-4 text-gray-400 mb-1" />
                        <span className="text-lg font-bold text-gray-400">{globalStats.beta_count}</span>
                        <span className="text-xs text-muted-foreground">בטא</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-amber-600/10 rounded-lg border border-amber-600/30">
                        <Award className="h-4 w-4 text-amber-500 mb-1" />
                        <span className="text-lg font-bold text-amber-500">{globalStats.gamma_count}</span>
                        <span className="text-xs text-muted-foreground">גמא</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-sky-400/10 rounded-lg border border-sky-400/30">
                        <Target className="h-4 w-4 text-sky-400 mb-1" />
                        <span className="text-lg font-bold text-sky-400">{globalStats.delta_count}</span>
                        <span className="text-xs text-muted-foreground">דלתא</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">אין נתונים עדיין. הסטטיסטיקות יתעדכנו לאחר סיום טורנירים.</p>
                )}
              </Card>
            )}

            {/* Per-Team Stats Breakdown */}
            {claimedPlayer && teamStats.length > 0 && (
              <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-neon-green" />
                  <h2 className="text-lg font-semibold text-foreground">סטטיסטיקות לפי קבוצה</h2>
                </div>
                
                <div className="space-y-3">
                  {teamStats.map((team) => {
                    const teamWinRate = team.games_played > 0 
                      ? Math.round((team.games_won / team.games_played) * 100) 
                      : 0;
                    return (
                      <div key={team.team_id} className="p-3 bg-gaming-surface rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{team.team_name}</span>
                          <Badge variant="outline">{team.games_played} משחקים</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-sm">
                          <div>
                            <div className="font-bold text-green-400">{team.games_won}</div>
                            <div className="text-xs text-muted-foreground">נצחונות</div>
                          </div>
                          <div>
                            <div className="font-bold text-red-400">{team.games_lost}</div>
                            <div className="text-xs text-muted-foreground">הפסדים</div>
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{teamWinRate}%</div>
                            <div className="text-xs text-muted-foreground">אחוז</div>
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{team.goals_for}:{team.goals_against}</div>
                            <div className="text-xs text-muted-foreground">שערים</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* My Team Memberships */}
            <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg font-semibold text-foreground">הקבוצות שלי</h2>
              </div>
              {teamMemberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">לא נמצאו קבוצות.</p>
              ) : (
                <div className="space-y-2">
                  {teamMemberships.map((m) => (
                    <div key={m.team_id} className="flex items-center justify-between p-2 bg-gaming-surface rounded-lg">
                      <span className="font-medium text-foreground">{m.team_name}</span>
                      <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>
                        {m.role === 'owner' ? 'בעלים' : 'חבר'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* My tournament history */}
            <Card className="bg-gradient-card border-neon-green/30 p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg font-semibold text-foreground">היסטוריית טורנירים</h2>
              </div>
              {evenings.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין ערבים בהיסטוריה שלך עדיין.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">תאריך</TableHead>
                      <TableHead className="text-left">שחקנים</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evenings.map((e) => (
                      <TableRow key={e.id} className="hover:bg-gaming-surface/50">
                        <TableCell className="text-left">{new Date(e.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-left">
                          <div className="flex flex-wrap gap-1">
                            {e.players.map((p) => (
                              <Badge key={p.id} variant="secondary">
                                {p.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
