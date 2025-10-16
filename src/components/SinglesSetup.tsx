import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Trophy, Plus, X } from "lucide-react";
import { Player } from "@/types/tournament";
import { StorageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";

interface SinglesSetupProps {
  onBack: () => void;
  onStartSingles: (players: Player[], clubsPerPlayer: number) => void;
  savedPlayers?: Player[];
}

export const SinglesSetup = ({ onBack, onStartSingles, savedPlayers }: SinglesSetupProps) => {
  const { toast } = useToast();
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [clubsPerPlayer, setClubsPerPlayer] = useState(7);
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const history = StorageService.loadEvenings();
    const names = new Set<string>();
    history.forEach((e) => e.players.forEach((p) => names.add(p.name.trim())));
    (savedPlayers || []).forEach((p) => names.add(p.name.trim()));
    setAllPlayers(Array.from(names).sort((a, b) => a.localeCompare(b)));

    if (savedPlayers && savedPlayers.length > 0) {
      setPlayerNames(savedPlayers.map((p) => p.name));
    } else {
      setPlayerNames(['', '', '']); // Start with 3 empty slots
    }
  }, [savedPlayers]);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const addPlayer = () => {
    setPlayerNames([...playerNames, '']);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length <= 2) {
      toast({ 
        title: "מינימום שחקנים", 
        description: "נדרשים לפחות 2 שחקנים לטורניר יחידים", 
        variant: "destructive" 
      });
      return;
    }
    const newNames = playerNames.filter((_, i) => i !== index);
    setPlayerNames(newNames);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const selectFromList = (name: string) => {
    if (playerNames.includes(name)) {
      toast({ title: "כבר נבחר", description: `${name} כבר נבחר`, variant: "destructive" });
      return;
    }
    const emptyIndex = playerNames.findIndex((n) => n.trim() === "");
    if (emptyIndex === -1) {
      // Add to end if no empty slots
      setPlayerNames([...playerNames, name]);
    } else {
      const newNames = [...playerNames];
      newNames[emptyIndex] = name;
      setPlayerNames(newNames);
    }
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
      toast({ title: "השם קיים", description: "השחקן הזה כבר ברשימה", variant: "destructive" });
      return;
    }
    setAllPlayers((prev) => [...prev, name].sort((a, b) => a.localeCompare(b)));
    setNewPlayer("");
  };

  const validateAndStart = () => {
    // Filter out empty names and validate
    const trimmedNames = playerNames.map((name) => name.trim()).filter(name => name !== "");
    
    if (trimmedNames.length < 2) {
      toast({
        title: "מספר שחקנים לא תקין",
        description: "נדרשים לפחות 2 שחקנים לטורניר יחידים",
        variant: "destructive",
      });
      return;
    }

    // Validate unique names
    const uniqueNames = new Set(trimmedNames);
    if (uniqueNames.size !== trimmedNames.length) {
      toast({
        title: "שמות כפולים",
        description: "כל שמות השחקנים חייבים להיות ייחודיים",
        variant: "destructive",
      });
      return;
    }

    // Create players with stable ids based on name
    const players: Player[] = trimmedNames.map((name) => ({ id: `player-${slugify(name)}`, name }));

    onStartSingles(players, clubsPerPlayer);
    
    toast({ 
      title: "טורניר יחידים מתחיל!", 
      description: `${players.length} שחקנים • ${clubsPerPlayer} קבוצות לכל שחקן` 
    });
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
            <h1 className="text-2xl font-bold text-foreground">הגדרת טורניר יחידים</h1>
            <p className="text-muted-foreground text-sm">כל שחקן יקבל קבוצות אישיות לטורניר</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Player Names */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">שחקנים</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                {playerNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`player-${index}`} className="text-sm text-muted-foreground">
                        שחקן {index + 1}
                      </Label>
                      <div className="relative">
                        <Input
                          id={`player-${index}`}
                          value={name}
                          onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                          placeholder={`שם שחקן ${index + 1}`}
                          className="bg-gaming-surface border-border pr-8"
                          dir="rtl"
                        />
                        {name && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => clearSlot(index)}
                            aria-label="Clear player"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {playerNames.length > 2 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removePlayer(index)}
                        className="mt-6"
                        aria-label="Remove player"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addPlayer}
                className="w-full"
                disabled={playerNames.length >= 8}
              >
                <Plus className="h-4 w-4 mr-2" />
                הוסף שחקן
              </Button>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="חפש שחקנים..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-gaming-surface border-border"
                  dir="rtl"
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="הוסף שחקן חדש"
                  value={newPlayer}
                  onChange={(e) => setNewPlayer(e.target.value)}
                  className="bg-gaming-surface border-border"
                  dir="rtl"
                />
                <Button variant="outline" size="sm" onClick={addNewPlayerToList}>
                  הוסף
                </Button>
              </div>

              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">לחץ על שם להוספה לרשימה</p>
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

          {/* Clubs per Player */}
          <Card className="bg-gradient-card border-neon-green/20 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-foreground">קבוצות לכל שחקן</h2>
            </div>
            <div className="space-y-3">
              <Label htmlFor="clubs-per-player" className="text-sm text-muted-foreground">
                כמה קבוצות כל שחקן יקבל במשחק?
              </Label>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setClubsPerPlayer(Math.max(3, clubsPerPlayer - 1))}
                  disabled={clubsPerPlayer <= 3}
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-neon-green min-w-[3ch] text-center">
                  {clubsPerPlayer}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setClubsPerPlayer(Math.min(15, clubsPerPlayer + 1))}
                  disabled={clubsPerPlayer >= 15}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                המערכת תגריל {clubsPerPlayer} קבוצות לכל שחקן. הטורניר יסתיים כאשר כל השחקנים יסיימו את כל הקבוצות שלהם.
              </p>
            </div>
          </Card>

          {/* Tournament Info */}
          <Card className="bg-gaming-surface/50 border-border/50 p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-neon-green">טורניר יחידים</strong> • {playerNames.filter(n => n.trim()).length} שחקנים
              </p>
              <p className="text-xs text-muted-foreground">
                כל שחקן יקבל {clubsPerPlayer} קבוצות • המערכת תגריל סדר משחקים
              </p>
              <p className="text-xs text-muted-foreground">
                הטורניר מסתיים כאשר כל השחקנים סיימו את כל הקבוצות שלהם
              </p>
            </div>
          </Card>

          <Button
            variant="gaming"
            size="xl"
            onClick={validateAndStart}
            className="w-full"
            disabled={playerNames.filter(n => n.trim()).length < 2}
          >
            התחל טורניר יחידים
          </Button>
        </div>
      </div>
    </div>
  );
};