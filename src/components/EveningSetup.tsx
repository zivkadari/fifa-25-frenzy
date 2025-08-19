import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { Player } from "@/types/tournament";
import { StorageService } from "@/services/storageService";
import { RemoteStorageService } from "@/services/remoteStorageService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EveningSetupProps {
  onBack: () => void;
  onStartEvening: (players: Player[], winsToComplete: number, teamId?: string) => void;
  savedPlayers?: Player[];
  savedWinsToComplete?: number;
  savedTeamId?: string | null;
}

export const EveningSetup = ({ onBack, onStartEvening, savedPlayers, savedWinsToComplete, savedTeamId }: EveningSetupProps) => {
  const { toast } = useToast();
  const [playerNames, setPlayerNames] = useState(
    savedPlayers ? savedPlayers.map(p => p.name) : ['', '', '', '']
  );
  const [winsToComplete, setWinsToComplete] = useState(savedWinsToComplete || 4);
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(savedTeamId ?? undefined);
  const [teamPlayers, setTeamPlayers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    const history = StorageService.loadEvenings();
    const names = new Set<string>();
    history.forEach((e) => e.players.forEach((p) => names.add(p.name.trim())));
    (savedPlayers || []).forEach((p) => names.add(p.name.trim()));
    setAllPlayers(Array.from(names).sort((a, b) => a.localeCompare(b)));

    if (savedPlayers && savedPlayers.length > 0) {
      setPlayerNames(savedPlayers.map((p) => p.name));
    }

    (async () => {
      try {
        const t = await RemoteStorageService.listTeams();
        setTeams(t);
        if (savedTeamId && t.find((x) => x.id === savedTeamId)) {
          setSelectedTeamId(savedTeamId);
        }
      } catch {}
    })();
  }, []);

  // Load players when a team is selected and auto-fill names
  useEffect(() => {
    let mounted = true;
    if (!selectedTeamId) {
      setTeamPlayers([]);
      return;
    }
    setLoadingTeam(true);
    (async () => {
      try {
        const players = await RemoteStorageService.listTeamPlayers(selectedTeamId);
        if (!mounted) return;
        setTeamPlayers(players);
        if (players.length > 0) {
          const names = players.slice(0, 4).map((p) => p.name);
          setPlayerNames([...names, "", "", ""].slice(0, 4));
          if (players.length !== 4) {
            toast({
              title: "שימו לב",
              description: `בקבוצה הנבחרת יש ${players.length} שחקנים. נמלא את הראשונים ללוח הערב (צריך 4).`,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoadingTeam(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedTeamId]);
  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const selectFromList = (name: string) => {
    if (playerNames.includes(name)) {
      toast({ title: "Already selected", description: `${name} is already selected`, variant: "destructive" });
      return;
    }
    const emptyIndex = playerNames.findIndex((n) => n.trim() === "");
    if (emptyIndex === -1) {
      toast({ title: "All slots filled", description: "Remove a player to select another", variant: "destructive" });
      return;
    }
    const newNames = [...playerNames];
    newNames[emptyIndex] = name;
    setPlayerNames(newNames);
  };

  const clearSlot = (index: number) => {
    const newNames = [...playerNames];
    newNames[index] = "";
    setPlayerNames(newNames);
  };

  const addNewPlayerToList = () => {
    const name = newPlayer.trim();
    if (!name) return;
    if (allPlayers.includes(name)) {
      toast({ title: "Name exists", description: "This player is already in the list", variant: "destructive" });
      return;
    }
    setAllPlayers((prev) => [...prev, name].sort((a, b) => a.localeCompare(b)));
    setNewPlayer("");
  };

  const createTeamInline = async () => {
    const name = window.prompt("הזן שם קבוצה חדש");
    if (!name || !name.trim()) return;
    const created = await RemoteStorageService.createTeam(name.trim());
    if (created) {
      setTeams((prev) => [created, ...prev]);
      setSelectedTeamId(created.id);
      toast({ title: "קבוצה נוצרה", description: created.name });
    } else {
      toast({ title: "שגיאה", description: "יצירת קבוצה נכשלה", variant: "destructive" });
    }
  };

  const validateAndStart = async () => {
    // Validate non-empty names
    const trimmedNames = playerNames.map((name) => name.trim());
    if (trimmedNames.some((name) => name === "")) {
      toast({
        title: "Invalid Player Names",
        description: "Please fill in all player names",
        variant: "destructive",
      });
      return;
    }

    // Validate unique names
    const uniqueNames = new Set(trimmedNames);
    if (uniqueNames.size !== 4) {
      toast({
        title: "Duplicate Player Names",
        description: "All player names must be unique",
        variant: "destructive",
      });
      return;
    }

    // Create players with stable ids based on name
    const players: Player[] = trimmedNames.map((name) => ({ id: `player-${slugify(name)}`, name }));

    // Start evening first to get the evening object
    onStartEvening(players, winsToComplete, selectedTeamId);
    
    toast({ title: "Tournament Starting!", description: `3 rounds • First to ${winsToComplete} wins each round` });
  };

  return (
    <div className="min-h-screen bg-gaming-bg p-4 mobile-optimized">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Evening Setup</h1>
            <p className="text-muted-foreground text-sm">Setup tournament for 4 players</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Team selection (optional) */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">בחר קבוצה (אופציונלי)</h2>
            </div>
            {teams.length ? (
              <>
                <Select value={selectedTeamId} onValueChange={(v) => setSelectedTeamId(v)}>
                  <SelectTrigger className="bg-gaming-surface border-border">
                    <SelectValue placeholder="בחר קבוצה" />
                  </SelectTrigger>
                  <SelectContent className="bg-gaming-surface z-[60]">
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-between items-center mt-3">
                  <Button variant="outline" size="sm" onClick={createTeamInline}>צור קבוצה חדשה</Button>
                </div>
                {selectedTeamId && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">שחקני הקבוצה ({teamPlayers.length})</p>
                    {loadingTeam ? (
                      <p className="text-xs text-muted-foreground">טוען...</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {teamPlayers.map((p) => (
                          <span key={p.id} className="px-2 py-1 rounded-md bg-gaming-surface text-foreground border border-border text-xs">
                            {p.name}
                          </span>
                        ))}
                        {teamPlayers.length === 0 && (
                          <p className="text-xs text-muted-foreground">אין שחקנים בקבוצה זו עדיין.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">אין קבוצות. צור אחת כדי למלא שחקנים אוטומטית.</p>
                <Button variant="outline" size="sm" onClick={createTeamInline}>צור קבוצה</Button>
              </div>
            )}
          </Card>
          {/* Player Names */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">Player Names</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {playerNames.map((name, index) => (
                  <div key={index}>
                    <Label htmlFor={`slot-${index}`} className="text-sm text-muted-foreground">
                      Player {index + 1}
                    </Label>
                    <div className="relative h-16 rounded-md border border-border bg-gaming-surface flex items-center justify-center">
                      {name ? (
                        <>
                          <span className="text-foreground font-medium">{name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1"
                            onClick={() => clearSlot(index)}
                            aria-label="Clear player"
                          >
                            ×
                          </Button>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">Empty</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search players..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gaming-surface border-border"
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add new player"
                  value={newPlayer}
                  onChange={(e) => setNewPlayer(e.target.value)}
                  className="bg-gaming-surface border-border"
                />
                <Button variant="outline" size="sm" onClick={addNewPlayerToList}>
                  Add
                </Button>
              </div>

              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">Tap a name to assign it to the next empty slot</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {allPlayers
                    .filter((n) => n.toLowerCase().includes(search.toLowerCase()))
                    .map((n) => {
                      const isSelected = playerNames.includes(n);
                      return (
                        <Button
                          key={n}
                          variant={isSelected ? "secondary" : "outline"}
                          size="sm"
                          className="justify-start"
                          onClick={() => selectFromList(n)}
                          disabled={isSelected}
                        >
                          {n}
                        </Button>
                      );
                    })}
                </div>
              </div>
            </div>
          </Card>

          {/* Wins to Complete Round */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">Wins to Complete Round</h2>
            </div>
            <div className="space-y-3">
              <Label htmlFor="wins-to-complete" className="text-sm text-muted-foreground">
                First pair to reach this number of wins will win the round
              </Label>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setWinsToComplete(Math.max(1, winsToComplete - 1))}
                  disabled={winsToComplete <= 1}
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-neon-green min-w-[3ch] text-center">
                  {winsToComplete}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setWinsToComplete(Math.min(10, winsToComplete + 1))}
                  disabled={winsToComplete >= 10}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum {winsToComplete * 2 - 1} matches per round. If tied at {winsToComplete}-{winsToComplete}, a decider match determines the winner.
              </p>
            </div>
          </Card>

          {/* Tournament Info */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-neon-green">3 Rounds</strong> • Round Robin Format
              </p>
              <p className="text-xs text-muted-foreground">
                Round 1: P1+P2 vs P3+P4 • Round 2: P1+P3 vs P2+P4 • Round 3: P1+P4 vs P2+P3
              </p>
              <p className="text-xs text-muted-foreground">
                First to {winsToComplete} wins each round • Random team selection for all matches including tiebreakers
              </p>
            </div>
          </Card>

          <Button
            variant="gaming"
            size="xl"
            onClick={validateAndStart}
            className="w-full"
          >
            Start Tournament
          </Button>
        </div>

      </div>
    </div>
  );
};