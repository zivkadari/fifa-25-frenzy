import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shuffle, Check } from "lucide-react";
import { Club } from "@/types/tournament";
import { FIFA_CLUBS, getClubsOnly, getNationalTeamsByStars, getPrimeTeams } from "@/data/clubs";

interface ClubSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubToSwap: Club;
  currentPoolClubIds: string[];
  otherPoolClubIds: string[];
  usedClubIdsThisEvening: string[];
  onSwap: (newClub: Club) => void;
  clubsWithOverrides: Club[];
}

export const ClubSwapDialog = ({
  open,
  onOpenChange,
  clubToSwap,
  currentPoolClubIds,
  otherPoolClubIds,
  usedClubIdsThisEvening,
  onSwap,
}: ClubSwapDialogProps) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  // Get available clubs for swap
  const availableClubs = useMemo(() => {
    const excludeIds = new Set([
      ...currentPoolClubIds,
      ...otherPoolClubIds,
      ...usedClubIdsThisEvening,
    ]);
    
    // Get all clubs that match the star rating of the club being swapped
    const preferredStars = clubToSwap.stars;
    const isPrime = clubToSwap.isPrime;
    
    let candidates: Club[] = [];
    
    if (isPrime) {
      // For Prime clubs, only show other Prime clubs
      candidates = getPrimeTeams().filter(c => !excludeIds.has(c.id));
    } else {
      // For regular clubs, show clubs with same star rating first
      const sameStars = [
        ...getClubsOnly(preferredStars),
        ...getNationalTeamsByStars(preferredStars)
      ].filter(c => !excludeIds.has(c.id) && !c.isPrime);
      
      // Then clubs with different star ratings
      const otherStars = FIFA_CLUBS
        .filter(c => !excludeIds.has(c.id) && !c.isPrime && c.stars !== preferredStars && c.stars >= 4);
      
      candidates = [...sameStars, ...otherStars];
    }
    
    // Sort by stars descending, then by name
    return candidates.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
  }, [clubToSwap, currentPoolClubIds, otherPoolClubIds, usedClubIdsThisEvening]);

  // Random selection from same star category
  const handleRandomSwap = () => {
    const sameStarClubs = availableClubs.filter(c => c.stars === clubToSwap.stars);
    const pool = sameStarClubs.length > 0 ? sameStarClubs : availableClubs;
    
    if (pool.length > 0) {
      const randomClub = pool[Math.floor(Math.random() * pool.length)];
      onSwap(randomClub);
      onOpenChange(false);
    }
  };

  const handleConfirmSwap = () => {
    if (selectedClub) {
      onSwap(selectedClub);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            החלף קבוצה
          </DialogTitle>
          <DialogDescription>
            במקום: <strong>{clubToSwap.name}</strong> {clubToSwap.isPrime ? '(Prime)' : `${clubToSwap.stars}★`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Random Button */}
          <Button 
            variant="gaming" 
            onClick={handleRandomSwap}
            className="w-full"
            disabled={availableClubs.length === 0}
          >
            <Shuffle className="h-4 w-4 mr-2" />
            הגרל קבוצה רנדומלית ({clubToSwap.stars}★)
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">או בחר ידנית</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Club List */}
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-1">
              {availableClubs.map((club) => (
                <Button
                  key={club.id}
                  variant={selectedClub?.id === club.id ? "default" : "ghost"}
                  onClick={() => setSelectedClub(club)}
                  className="w-full justify-between h-auto py-2 px-3"
                >
                  <span className="font-medium truncate">{club.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {club.isPrime ? 'Prime' : `${club.stars}★`}
                    </Badge>
                    {club.isNational && (
                      <Badge variant="outline" className="text-xs">נבחרת</Badge>
                    )}
                    {selectedClub?.id === club.id && (
                      <Check className="h-4 w-4 text-neon-green" />
                    )}
                  </div>
                </Button>
              ))}
              {availableClubs.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  אין קבוצות זמינות להחלפה
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Confirm Button */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button 
              variant="gaming"
              onClick={handleConfirmSwap}
              disabled={!selectedClub}
              className="flex-1"
            >
              אישור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
