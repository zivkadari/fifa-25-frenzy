import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Trophy, Trash2, Users2, Share2, Loader2, ExternalLink, Clock, Edit2 } from "lucide-react";
import { FPEvening } from "@/types/fivePlayerTypes";
import { calculatePairStats, calculatePlayerStats } from "@/services/fivePlayerEngine";
import { StorageService } from "@/services/storageService";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { useToast } from "@/hooks/use-toast";
import { formatDuration } from "@/components/FPTimingCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "ikbywydyidnkohbdrqdk";

function toLocalDatetimeString(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface FPHistoryProps {
  onBack: () => void;
}

export const FPHistory = ({ onBack }: FPHistoryProps) => {
  const { toast } = useToast();
  const [evenings, setEvenings] = useState<FPEvening[]>([]);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [editTimingEvening, setEditTimingEvening] = useState<FPEvening | null>(null);
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editCompletedAt, setEditCompletedAt] = useState("");

  useEffect(() => {
    const local = StorageService.loadFPEvenings();
    setEvenings(local);
    
    // Auto-sync completed local FP evenings to Supabase
    const syncToRemote = async () => {
      const completed = local.filter(e => e.completed);
      for (const ev of completed) {
        try {
          await RemoteStorageService.upsertEveningLiveWithTeam(ev as any, null);
        } catch {}
      }
    };
    syncToRemote();
  }, []);

  const sorted = [...evenings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (id: string) => {
    StorageService.deleteFPEvening(id);
    setEvenings(StorageService.loadFPEvenings());
  };

  const handleShare = useCallback(async (ev: FPEvening) => {
    setSharingId(ev.id);
    try {
      // Ensure the evening is in Supabase
      await RemoteStorageService.upsertEveningLiveWithTeam(ev as any, null).catch(() => {});
      const code = await RemoteStorageService.getShareCode(ev.id);
      if (!code) {
        toast({ title: "לא ניתן ליצור קישור", description: "ודא שאתה מחובר", variant: "destructive" });
        return;
      }
      const url = `${window.location.origin}/spectate/${code}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: "תוצאות ליגת 5 שחקנים", url });
          return;
        } catch {}
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "קישור צפייה הועתק!" });
    } catch {
      toast({ title: "שגיאה ביצירת קישור", variant: "destructive" });
    } finally {
      setSharingId(null);
    }
  }, [toast]);

  return (
    <div className="min-h-[100svh] bg-gaming-bg p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">היסטוריית ליגות 5 שחקנים</h1>
            <p className="text-xs text-muted-foreground">{sorted.length} ליגות</p>
          </div>
        </div>

        {sorted.length === 0 && (
          <Card className="bg-gaming-surface/50 border-border/50 p-6">
            <p className="text-center text-muted-foreground">אין היסטוריה עדיין</p>
          </Card>
        )}

        <div className="space-y-3">
          {sorted.map(ev => {
            const pairStats = calculatePairStats(ev);
            const playerStats = calculatePlayerStats(ev);
            const topPair = pairStats[0];
            const completedCount = ev.schedule.filter(m => m.completed).length;
            const isSharing = sharingId === ev.id;

            return (
              <Collapsible key={ev.id}>
                <Card className="bg-gradient-card border-neon-green/20 shadow-card">
                  <CollapsibleTrigger className="w-full p-4 text-right">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(ev.date).toLocaleDateString('he-IL')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {completedCount}/{ev.matchCount || 30} משחקים
                          </Badge>
                          {(ev.matchCount === 15) && (
                            <Badge variant="secondary" className="text-[10px]">קצרה</Badge>
                          )}
                        </div>
                        {ev.durationMinutes ? (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDuration(ev.durationMinutes)}
                          </p>
                        ) : null}
                        <p className="text-sm text-muted-foreground">
                          {ev.players.map(p => p.name).join(', ')}
                        </p>
                      </div>
                      {topPair && (
                        <div className="text-left">
                          <Trophy className="h-4 w-4 text-yellow-400 inline ml-1" />
                          <span className="text-xs text-foreground">
                            {topPair.pair.players[0].name} & {topPair.pair.players[1].name}
                          </span>
                        </div>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3">
                      <Tabs defaultValue="pairs">
                        <TabsList className="w-full grid grid-cols-2">
                          <TabsTrigger value="pairs">זוגות</TabsTrigger>
                          <TabsTrigger value="players">שחקנים</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pairs">
                          <div className="overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right text-xs">#</TableHead>
                                  <TableHead className="text-right text-xs">זוג</TableHead>
                                  <TableHead className="text-center text-xs">נ</TableHead>
                                  <TableHead className="text-center text-xs">ת</TableHead>
                                  <TableHead className="text-center text-xs">ה</TableHead>
                                  <TableHead className="text-center text-xs font-bold">נק׳</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pairStats.map((s, idx) => (
                                  <TableRow key={s.pair.id}>
                                    <TableCell className="text-xs">{idx + 1}</TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">
                                      {s.pair.players[0].name} & {s.pair.players[1].name}
                                    </TableCell>
                                    <TableCell className="text-center text-xs">{s.wins}</TableCell>
                                    <TableCell className="text-center text-xs">{s.draws}</TableCell>
                                    <TableCell className="text-center text-xs">{s.losses}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-neon-green">{s.points}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        <TabsContent value="players">
                          <div className="overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right text-xs">#</TableHead>
                                  <TableHead className="text-right text-xs">שחקן</TableHead>
                                  <TableHead className="text-center text-xs">מש׳</TableHead>
                                  <TableHead className="text-center text-xs">נ</TableHead>
                                  <TableHead className="text-center text-xs font-bold">נק׳</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {playerStats.map((s, idx) => (
                                  <TableRow key={s.player.id}>
                                    <TableCell className="text-xs">{idx + 1}</TableCell>
                                    <TableCell className="text-xs">{s.player.name}</TableCell>
                                    <TableCell className="text-center text-xs">{s.played}</TableCell>
                                    <TableCell className="text-center text-xs">{s.wins}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-neon-green">{s.points}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Timing info & edit */}
                      {ev.completed && (
                        <div className="flex items-center justify-between bg-gaming-surface/40 rounded-lg px-3 py-2 border border-border/30">
                          <div className="text-xs space-y-0.5">
                            {ev.startedAt && (
                              <p className="text-muted-foreground">התחלה: <span className="text-foreground">{new Date(ev.startedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span></p>
                            )}
                            {ev.completedAt && (
                              <p className="text-muted-foreground">סיום: <span className="text-foreground">{new Date(ev.completedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span></p>
                            )}
                            {ev.durationMinutes ? (
                              <p className="text-muted-foreground">משך: <span className="text-neon-green font-medium">{formatDuration(ev.durationMinutes)}</span></p>
                            ) : (
                              <p className="text-muted-foreground text-[10px]">לא הוגדרו זמנים</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTimingEvening(ev);
                              setEditStartedAt(ev.startedAt ? toLocalDatetimeString(ev.startedAt) : toLocalDatetimeString(ev.date));
                              setEditCompletedAt(ev.completedAt ? toLocalDatetimeString(ev.completedAt) : "");
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                        onClick={(e) => { e.stopPropagation(); handleShare(ev); }}
                        disabled={isSharing}
                      >
                        {isSharing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Share2 className="h-3 w-3" />
                        )}
                        {isSharing ? "יוצר קישור..." : "שתף תצוגת צפייה"}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive w-full">
                            <Trash2 className="h-3 w-3" /> מחק
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחק ליגה?</AlertDialogTitle>
                            <AlertDialogDescription>פעולה זו לא ניתנת לביטול.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(ev.id)} className="bg-destructive">מחק</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
};
