import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { StorageService } from "@/services/storageService";
import type { Evening } from "@/types/tournament";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [evenings, setEvenings] = useState<Evening[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; players: Array<{ id: string; name: string }> }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setUserEmail(user.email ?? null);

        // Fetch claimed player mapping
        const { data: mapping } = await supabase
          .from("player_accounts")
          .select("player_id")
          .eq("user_id", user.id)
          .maybeSingle();
        let pid = mapping?.player_id || null;
        // Try to infer from profile display name if no mapping
        if (!pid) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .maybeSingle();
          const name = prof?.display_name?.trim();
          if (name) {
            const toSlug = (s: string) =>
              s.toLowerCase().trim().replace(/[^a-z0-9\u0590-\u05FF]+/g, "-").replace(/^-+|-+$/g, "");
            pid = `player-${toSlug(name)}`;
          }
        }
        if (mounted) setPlayerId(pid);

        // Load evenings (remote if available, otherwise local)
        let evs: Evening[] = [];
        try {
          evs = await RemoteStorageService.loadEvenings();
        } catch { evs = []; }
        if (!evs.length) {
          evs = StorageService.loadEvenings();
        }
        if (pid) {
          evs = evs.filter(e => e.players.some(p => p.id === pid));
        }
        if (mounted) setEvenings(evs);

        // Load teams the user belongs to
        const { data: memberRows } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id);
        const teamIds = (memberRows || []).map((r: any) => r.team_id);
        const uniqueTeamIds = Array.from(new Set(teamIds));
        if (uniqueTeamIds.length) {
          const { data: teamRows } = await supabase
            .from("teams")
            .select("id, name")
            .in("id", uniqueTeamIds);
          const teamsWithPlayers: Array<{ id: string; name: string; players: Array<{ id: string; name: string }> }> = [];
          for (const t of teamRows || []) {
            const { data: links } = await supabase
              .from("team_players")
              .select("player_id")
              .eq("team_id", t.id);
            const pids = (links || []).map((l: any) => l.player_id);
            let players: Array<{ id: string; name: string }> = [];
            if (pids.length) {
              const { data: playerRows } = await supabase
                .from("players")
                .select("id, display_name")
                .in("id", pids);
              players = (playerRows || []).map((pr: any) => ({ id: pr.id, name: pr.display_name }));
            }
            teamsWithPlayers.push({ id: t.id as string, name: (t as any).name as string, players });
          }
          if (mounted) setTeams(teamsWithPlayers);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Derived rank stats for the mapped player across evenings
  const myRankCounts = (() => {
    const counts = { alpha: 0, beta: 0, gamma: 0, delta: 0, tournaments: 0 };
    if (!playerId) return counts;
    for (const e of evenings) {
      if (e.players.some((p) => p.id === playerId)) counts.tournaments += 1;
      if (!e.rankings) continue;
      const inAlpha = e.rankings.alpha?.some((p) => p.id === playerId);
      const inBeta = e.rankings.beta?.some((p) => p.id === playerId);
      const inGamma = e.rankings.gamma?.some((p) => p.id === playerId);
      if (inAlpha) counts.alpha += 1;
      else if (inBeta) counts.beta += 1;
      else if (inGamma) counts.gamma += 1;
      else if (e.players.some((p) => p.id === playerId)) counts.delta += 1;
    }
    return counts;
  })();

  return (
    <div className="min-h-screen bg-gaming-bg p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
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
            {/* Player mapping */}
            <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
              <h2 className="text-lg font-semibold text-foreground mb-2">שחקן משויך</h2>
              {playerId ? (
                <p className="text-sm text-muted-foreground ltr-numbers">Player ID: <span className="text-neon-green font-semibold">{playerId}</span></p>
              ) : (
                <p className="text-sm text-muted-foreground">אין שיוך שחקן. פנה למנהל או השתמש במסך הקבוצות לשיוך.</p>
              )}
            </Card>

            {/* Rank stats */}
            {playerId && (
              <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-2">סטטיסטיקת דירוג</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary">Alpha: {myRankCounts.alpha}</Badge>
                  <Badge variant="secondary">Beta: {myRankCounts.beta}</Badge>
                  <Badge variant="secondary">Gamma: {myRankCounts.gamma}</Badge>
                  <Badge variant="secondary">Delta: {myRankCounts.delta}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">סה"כ טורנירים: {myRankCounts.tournaments}</p>
              </Card>
            )}

            {/* My tournament history */}
            <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg font-semibold text-foreground">ההיסטוריה האישית</h2>
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
                              <Badge
                                key={p.id}
                                variant="secondary"
                                className={p.id === playerId ? "bg-neon-green/20 text-neon-green border-neon-green/30" : ""}
                              >
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

            {/* My teams */}
            <Card className="bg-gradient-card border-neon-green/30 p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg font-semibold text-foreground">הקבוצות שלי</h2>
              </div>
              {teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">לא נמצאו קבוצות.</p>
              ) : (
                <div className="space-y-3">
                  {teams.map((t) => (
                    <Card key={t.id} className="bg-gaming-surface border-border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">{t.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.players.map((p) => (
                          <Badge
                            key={p.id}
                            variant="secondary"
                            className={p.id === playerId ? "bg-neon-green/20 text-neon-green border-neon-green/30" : ""}
                          >
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
