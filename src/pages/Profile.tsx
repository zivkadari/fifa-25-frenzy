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
  const [evenings, setEvenings] = useState<Evening[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; players: Array<{ id: string; name: string }> }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setUserEmail(user.email ?? null);

        // Load evenings (remote if available, otherwise local)
        let evs: Evening[] = [];
        try {
          evs = await RemoteStorageService.loadEvenings();
        } catch { evs = []; }
        if (!evs.length) {
          evs = StorageService.loadEvenings();
        }
        if (mounted) setEvenings(evs);

        // Load teams via RemoteStorageService
        try {
          const teamsList = await RemoteStorageService.listTeams();
          const teamsWithPlayers: Array<{ id: string; name: string; players: Array<{ id: string; name: string }> }> = [];
          for (const t of teamsList) {
            const players = await RemoteStorageService.listTeamPlayers(t.id);
            teamsWithPlayers.push({ id: t.id, name: t.name, players });
          }
          if (mounted) setTeams(teamsWithPlayers);
        } catch {}
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
            {/* My tournament history */}
            <Card className="bg-gradient-card border-neon-green/30 p-4 mb-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-neon-green" />
                <h2 className="text-lg font-semibold text-foreground">ההיסטוריה שלי</h2>
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
                          <Badge key={p.id} variant="secondary">
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