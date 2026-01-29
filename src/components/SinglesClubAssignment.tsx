import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Users, Trophy, Star, RefreshCw, Copy } from "lucide-react";
import { Player, Club } from "@/types/tournament";
import { toast } from "sonner";

interface SinglesClubAssignmentProps {
  onBack: () => void;
  onContinue: () => void;
  players: Player[];
  playerClubs: { [playerId: string]: Club[] };
  clubsPerPlayer: number;
  clubsWithOverrides: Club[];
}

export const SinglesClubAssignment = ({ 
  onBack, 
  onContinue, 
  players, 
  playerClubs: initialPlayerClubs, 
  clubsPerPlayer,
  clubsWithOverrides
}: SinglesClubAssignmentProps) => {
  const [playerClubs, setPlayerClubs] = useState(initialPlayerClubs);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<{
    fromPlayerId: string;
    fromClubIndex: number;
    toPlayerId?: string;
    toClubIndex?: number;
  } | null>(null);

  // Helper function to get current star rating from database overrides
  const getDisplayStars = (club: Club): number => {
    const override = clubsWithOverrides.find(c => c.id === club.id);
    return override?.stars ?? club.stars;
  };
  // Function to shorten long club names intelligently
  const shortenClubName = (name: string): string => {
    if (name.length <= 15) return name;
    
    const words = name.split(' ');
    if (words.length === 1) {
      // Single word - truncate with ellipsis
      return name.substring(0, 12) + '...';
    }
    
    // Multiple words - shorten first word(s) if long
    const shortened = words.map((word, index) => {
      if (index === 0 && word.length > 4) {
        return word.substring(0, 3) + '.';
      }
      return word;
    }).join(' ');
    
    // If still too long, truncate
    return shortened.length > 18 ? shortened.substring(0, 15) + '...' : shortened;
  };

  const handleSwapClick = (playerId: string, clubIndex: number) => {
    setSelectedSwap({
      fromPlayerId: playerId,
      fromClubIndex: clubIndex,
      toPlayerId: undefined,
      toClubIndex: undefined
    });
    setSwapDialogOpen(true);
  };

  const handleSwapConfirm = () => {
    if (!selectedSwap || !selectedSwap.toPlayerId || selectedSwap.toClubIndex === undefined) {
      return;
    }

    const fromPlayer = players.find(p => p.id === selectedSwap.fromPlayerId);
    const toPlayer = players.find(p => p.id === selectedSwap.toPlayerId);
    
    if (!fromPlayer || !toPlayer) return;

    const newPlayerClubs = { ...playerClubs };
    const fromClub = newPlayerClubs[selectedSwap.fromPlayerId][selectedSwap.fromClubIndex];
    const toClub = newPlayerClubs[selectedSwap.toPlayerId][selectedSwap.toClubIndex];

    // Swap the clubs
    newPlayerClubs[selectedSwap.fromPlayerId][selectedSwap.fromClubIndex] = toClub;
    newPlayerClubs[selectedSwap.toPlayerId][selectedSwap.toClubIndex] = fromClub;

    setPlayerClubs(newPlayerClubs);
    setSwapDialogOpen(false);
    setSelectedSwap(null);
    
    toast.success(`הקבוצה ${fromClub.name} של ${fromPlayer.name} הוחלפה עם ${toClub.name} של ${toPlayer.name}`);
  };

  const handleCopyClubsList = () => {
    let text = "";
    
    players.forEach((player, playerIndex) => {
      text += `*${player.name}*\n`;
      const clubs = playerClubs[player.id] || [];
      clubs.forEach((club, clubIndex) => {
        text += `${club.name}\n`;
      });
      // Add extra line between players (except after last player)
      if (playerIndex < players.length - 1) {
        text += "\n";
      }
    });

    navigator.clipboard.writeText(text).then(() => {
      toast.success("רשימת הקבוצות הועתקה ללוח!");
    }).catch(() => {
      toast.error("שגיאה בהעתקת הרשימה");
    });
  };

  const availablePlayersForSwap = selectedSwap 
    ? players.filter(p => p.id !== selectedSwap.fromPlayerId)
    : [];

  const availableClubsForSwap = selectedSwap?.toPlayerId 
    ? playerClubs[selectedSwap.toPlayerId] || []
    : [];

  const handleContinue = () => {
    // Pass the updated playerClubs to the parent
    onContinue();
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
            <h1 className="text-2xl font-bold text-foreground">חלוקת קבוצות</h1>
            <p className="text-muted-foreground text-sm">כל שחקן קיבל {clubsPerPlayer} קבוצות</p>
          </div>
        </div>

        {/* Tournament Info */}
        <Card className="bg-gaming-surface/50 border-border/50 p-4 mb-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-neon-green" />
              <span className="text-lg font-semibold text-foreground">
                {players.length} שחקנים
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              כל שחקן ישחק עם כל השחקנים האחרים בכל הקבוצות שלו
            </p>
          </div>
        </Card>

        {/* Player Club Assignments */}
        <div className="space-y-4 mb-6">
          {players.map(player => (
            <Card key={player.id} className="bg-gradient-card border-neon-green/20 p-4 shadow-card">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gaming-surface border-2 border-neon-green flex items-center justify-center">
                    <span className="text-sm font-bold text-neon-green">
                      {player.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{player.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {playerClubs[player.id]?.map((club, index) => (
                    <div key={club.id} className="flex items-center gap-2 p-3 rounded bg-gaming-surface/50 border border-border/50">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {index + 1}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium text-foreground">{shortenClubName(club.name)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-gaming-surface border-neon-green/20">
                            <p className="text-sm text-foreground">{club.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.floor(club.stars) }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-neon-green text-neon-green" />
                          ))}
                          {club.stars % 1 !== 0 && (
                            <div className="relative h-3 w-3">
                              <Star className="h-3 w-3 text-neon-green absolute" />
                              <Star className="h-3 w-3 fill-neon-green text-neon-green absolute" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwapClick(player.id, index)}
                          className="h-8 px-3 bg-gaming-bg/50 border-neon-green/30 hover:bg-neon-green/10 hover:border-neon-green"
                        >
                          <RefreshCw className="h-3 w-3 ml-1" />
                          <span className="text-xs">החלף</span>
                        </Button>
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCopyClubsList}
            className="w-full bg-gaming-surface/50 border-neon-green/30 hover:bg-neon-green/10 hover:border-neon-green"
          >
            <Copy className="h-5 w-5 ml-2" />
            העתק רשימת קבוצות
          </Button>

          <Button
            variant="gaming"
            size="xl"
            onClick={handleContinue}
            className="w-full"
          >
            <Trophy className="h-5 w-5 mr-2" />
            המשך לסדר המשחקים
          </Button>
        </div>

        {/* Swap Dialog */}
        <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
          <DialogContent className="bg-gaming-surface border-neon-green/20">
            <DialogHeader>
              <DialogTitle className="text-foreground">החלף קבוצות</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedSwap && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      מחליף:
                    </label>
                    <div className="p-3 rounded bg-gaming-bg border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {players.find(p => p.id === selectedSwap.fromPlayerId)?.name}
                        </span>
                        <span className="text-sm font-medium text-neon-green">
                          {playerClubs[selectedSwap.fromPlayerId]?.[selectedSwap.fromClubIndex]?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      בחר שחקן להחלפה:
                    </label>
                    <Select
                      value={selectedSwap.toPlayerId}
                      onValueChange={(value) => {
                        setSelectedSwap({
                          ...selectedSwap,
                          toPlayerId: value,
                          toClubIndex: undefined
                        });
                      }}
                    >
                      <SelectTrigger className="bg-gaming-bg border-border/50">
                        <SelectValue placeholder="בחר שחקן..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlayersForSwap.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSwap.toPlayerId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        בחר קבוצה להחלפה:
                      </label>
                      <Select
                        value={selectedSwap.toClubIndex?.toString()}
                        onValueChange={(value) => {
                          setSelectedSwap({
                            ...selectedSwap,
                            toClubIndex: parseInt(value)
                          });
                        }}
                      >
                        <SelectTrigger className="bg-gaming-bg border-border/50">
                          <SelectValue placeholder="בחר קבוצה..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClubsForSwap.map((club, index) => (
                            <SelectItem key={club.id} value={index.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{club.name}</span>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.floor(club.stars) }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-neon-green text-neon-green" />
                                  ))}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSwapDialogOpen(false);
                        setSelectedSwap(null);
                      }}
                      className="flex-1"
                    >
                      ביטול
                    </Button>
                    <Button
                      variant="gaming"
                      onClick={handleSwapConfirm}
                      disabled={!selectedSwap.toPlayerId || selectedSwap.toClubIndex === undefined}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 ml-2" />
                      החלף
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};