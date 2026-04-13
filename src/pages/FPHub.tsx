import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Eye, Loader2, AlertCircle, Radio, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { FPEvening, FPMatch } from "@/types/fivePlayerTypes";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "ikbywydyidnkohbdrqdk";

interface HubEvening {
  id: string;
  share_code: string;
  data: FPEvening;
  updated_at: string;
}

interface HubData {
  team_name: string | null;
  active: HubEvening[];
  completed: HubEvening[];
}

function computeAlpha(evening: FPEvening): string | null {
  const stats = new Map<string, { points: number; goalDiff: number; name: string }>();

  for (const player of evening.players) {
    stats.set(player.id, { points: 0, goalDiff: 0, name: player.name });
  }

  for (const match of evening.schedule) {
    if (!match.completed || match.scoreA === undefined || match.scoreB === undefined) continue;

    const diff = Math.min(3, Math.max(-3, match.scoreA - match.scoreB));
    const isWinA = match.scoreA > match.scoreB;
    const isWinB = match.scoreB > match.scoreA;
    const isDraw = match.scoreA === match.scoreB;

    for (const p of match.pairA.players) {
      const s = stats.get(p.id);
      if (s) {
        s.points += isWinA ? 3 : isDraw ? 1 : 0;
        s.goalDiff += diff;
      }
    }
    for (const p of match.pairB.players) {
      const s = stats.get(p.id);
      if (s) {
        s.points += isWinB ? 3 : isDraw ? 1 : 0;
        s.goalDiff -= diff;
      }
    }
  }

  let best: { name: string; points: number; goalDiff: number } | null = null;
  for (const [, s] of stats) {
    if (!best || s.points > best.points || (s.points === best.points && s.goalDiff > best.goalDiff)) {
      best = s;
    }
  }
  return best?.name || null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")} שעות`;
  return `${m} דקות`;
}

function getProgress(evening: FPEvening): { completed: number; total: number } {
  const total = evening.schedule.length;
  const completed = evening.schedule.filter((m) => m.completed).length;
  return { completed, total };
}

function LiveTournamentCard({ item, onOpen }: { item: HubEvening; onOpen: () => void }) {
  const evening = item.data;
  const progress = getProgress(evening);
  const pct = Math.round((progress.completed / progress.total) * 100);

  return (
    <Card className="border-2 border-neon-green/50 bg-gradient-to-br from-gaming-card to-gaming-surface shadow-glow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-neon-green animate-pulse" />
            <Badge className="bg-neon-green/20 text-neon-green border-neon-green/40 text-xs">
              🔴 לייב עכשיו
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            {evening.matchCount || 30} משחקים
          </Badge>
        </div>

        <h3 className="text-lg font-bold text-foreground">ליגת 5 שחקנים</h3>

        <div className="flex flex-wrap gap-1.5">
          {evening.players.map((p) => (
            <Badge key={p.id} variant="secondary" className="text-xs">
              {p.name}
            </Badge>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>התקדמות</span>
            <span>{progress.completed}/{progress.total} משחקים ({pct}%)</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-green rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {evening.startedAt && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            התחיל ב-{new Date(evening.startedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        <Button variant="gaming" className="w-full" onClick={onOpen}>
          <Eye className="h-4 w-4 ml-1" />
          פתח טורניר חי
        </Button>
      </CardContent>
    </Card>
  );
}

function CompletedTournamentCard({ item, onOpen }: { item: HubEvening; onOpen: () => void }) {
  const evening = item.data;
  const alpha = computeAlpha(evening);
  const matchCount = evening.matchCount || evening.schedule.length;

  return (
    <Card className="bg-gaming-card border-gaming-border hover:border-muted-foreground/30 transition-colors">
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(evening.date)}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {matchCount} משחקים
          </Badge>
        </div>

        {alpha && (
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold text-sm">{alpha}</span>
            <span className="text-xs text-muted-foreground">אלפא</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {evening.players.map((p) => (
            <span key={p.id} className="text-xs text-muted-foreground">
              {p.name}
            </span>
          )).reduce((prev, curr, i) => (
            <>{prev}{i > 0 && <span className="text-muted-foreground/40 text-xs mx-0.5">·</span>}{curr}</>
          ) as any)}
        </div>

        {evening.durationMinutes && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(evening.durationMinutes)}
          </p>
        )}

        <Button variant="outline" size="sm" className="w-full" onClick={onOpen}>
          <Eye className="h-3.5 w-3.5 ml-1" />
          פתח צפייה
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FPHub() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [hubData, setHubData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    const fetchHub = async () => {
      try {
        const res = await fetch(
          `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-fp-hub?team_id=${encodeURIComponent(teamId)}`
        );
        if (!res.ok) {
          setError("לא נמצאו נתונים");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setHubData(data);
      } catch {
        setError("שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    fetchHub();
    // Poll for live updates every 15 seconds
    const interval = setInterval(fetchHub, 15000);
    return () => clearInterval(interval);
  }, [teamId]);

  const openSpectate = (shareCode: string) => {
    navigate(`/spectate/${shareCode}`);
  };

  const recentCompleted = useMemo(() => {
    if (!hubData) return [];
    return showAll ? hubData.completed : hubData.completed.slice(0, 5);
  }, [hubData, showAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-neon-green" />
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (error || !hubData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-sm mx-4">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <p className="text-muted-foreground">{error || "שגיאה"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActive = hubData.active.length > 0;
  const hasCompleted = hubData.completed.length > 0;
  const hasMore = hubData.completed.length > 5;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-neon-green" />
            <h1 className="text-xl font-bold text-foreground">ליגת 5 שחקנים</h1>
          </div>
          {hubData.team_name && (
            <p className="text-sm text-muted-foreground">{hubData.team_name}</p>
          )}
        </div>

        {/* Live Section */}
        {hasActive && (
          <section className="space-y-2">
            {hubData.active.map((item) => (
              <LiveTournamentCard
                key={item.id}
                item={item}
                onOpen={() => openSpectate(item.share_code)}
              />
            ))}
          </section>
        )}

        {!hasActive && (
          <Card className="bg-gaming-card/50 border-dashed border-muted-foreground/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">אין טורניר חי כרגע</p>
            </CardContent>
          </Card>
        )}

        {/* Completed Section */}
        {hasCompleted && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              טורנירים שהסתיימו
            </h2>

            <div className="space-y-2">
              {recentCompleted.map((item) => (
                <CompletedTournamentCard
                  key={item.id}
                  item={item}
                  onOpen={() => openSpectate(item.share_code)}
                />
              ))}
            </div>

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 ml-1" />
                    הצג פחות
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 ml-1" />
                    הצג את כל {hubData.completed.length} הטורנירים
                  </>
                )}
              </Button>
            )}
          </section>
        )}

        {!hasActive && !hasCompleted && (
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">עדיין לא שוחקו טורנירים</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 pt-4">
          FIFA Night · צפייה ציבורית
        </p>
      </div>
    </div>
  );
}
