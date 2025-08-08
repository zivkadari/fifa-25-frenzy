import { useState, useRef, useEffect } from "react";
import { Trophy, Grip } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Evening, Player, Pair } from "@/types/tournament";

interface FloatingScoreTableProps {
  evening: Evening | null;
}

interface PlayerStats {
  player: Player;
  totalWins: number;
  currentRoundWins: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
}

export const FloatingScoreTable = ({ evening }: FloatingScoreTableProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const floatingRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === floatingRef.current || target.closest('.drag-handle') || target.closest('.floating-button')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = floatingRef.current!.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && floatingRef.current) {
      e.preventDefault();
      const newX = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Only show if we have an evening with rounds
  if (!evening || evening.rounds.length === 0) {
    return null;
  }

  const currentRound = evening.rounds[evening.rounds.length - 1];
  
  // Calculate player statistics
  const calculatePlayerStats = (): PlayerStats[] => {
    const statsMap = new Map<string, PlayerStats>();
    
    // Initialize stats for all players
    evening.players.forEach(player => {
      statsMap.set(player.id, {
        player,
        totalWins: 0,
        currentRoundWins: 0,
        totalGoalsFor: 0,
        totalGoalsAgainst: 0
      });
    });

    // Calculate total stats from all completed rounds
    evening.rounds.forEach((round, roundIndex) => {
      round.matches.forEach(match => {
        if (match.completed && match.score && match.winner) {
          const [score1, score2] = match.score;
          const [pair1, pair2] = match.pairs;
          
          // Add goals
          pair1.players.forEach(player => {
            const stats = statsMap.get(player.id)!;
            stats.totalGoalsFor += score1;
            stats.totalGoalsAgainst += score2;
          });
          
          pair2.players.forEach(player => {
            const stats = statsMap.get(player.id)!;
            stats.totalGoalsFor += score2;
            stats.totalGoalsAgainst += score1;
          });
          
          // Add wins
          const winningPair = match.winner === pair1.id ? pair1 : pair2;
          winningPair.players.forEach(player => {
            const stats = statsMap.get(player.id)!;
            stats.totalWins += 1;
            
            // If this is the current round, count current round wins
            if (roundIndex === evening.rounds.length - 1) {
              stats.currentRoundWins += 1;
            }
          });
        }
      });
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalWins - a.totalWins);
  };


  const playerStats = calculatePlayerStats();

  return (
    <>
      {/* Floating Button */}
      <div
        ref={floatingRef}
        className="fixed z-50 select-none floating-button"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <Card 
          className="w-16 h-16 bg-primary hover:bg-primary/90 transition-colors shadow-lg border-2 border-primary-foreground/20 cursor-move"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) setIsOpen(true);
          }}
        >
          <div className="flex flex-col items-center justify-center h-full text-primary-foreground">
            <Trophy className="w-5 h-5 mb-1" />
            <div className="text-xs font-bold">
              ס{currentRound.number}
            </div>
            <Grip className="w-3 h-3 absolute top-1 right-1 drag-handle opacity-60" />
          </div>
        </Card>
      </div>

      {/* Score Table Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              טבלת תוצאות - סיבוב <span className="ltr-numbers">{currentRound.number}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Round Matches */}
            <div>
              <h3 className="text-lg font-semibold mb-3">תוצאות סיבוב נוכחי</h3>
              <div className="grid gap-2">
                {currentRound.matches.map((match, index) => (
                  <Card key={match.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">
                          משחק <span className="ltr-numbers">{index + 1}</span>:
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {match.pairs[0].players.map(p => p.name).join(' ו-')}
                          </span>
                          {match.completed && match.score ? (
                            <>
                              <span className="font-bold text-lg">
                                {match.score[0]} - {match.score[1]}
                              </span>
                              <span className="text-sm">
                                {match.pairs[1].players.map(p => p.name).join(' & ')}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground">vs</span>
                              <span className="text-sm">
                                {match.pairs[1].players.map(p => p.name).join(' & ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.completed ? 'הושלם' : 'בתהליך'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Overall Statistics Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">סטטיסטיקות כוללות</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שחקן</TableHead>
                    <TableHead className="text-right">ניצחונות כולל</TableHead>
                    <TableHead className="text-right">ניצחונות סיבוב נוכחי</TableHead>
                    <TableHead className="text-right">שערים בעד</TableHead>
                    <TableHead className="text-right">שערים נגד</TableHead>
                    <TableHead className="text-right">יחס שערים</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerStats.map((stats, index) => (
                    <TableRow key={stats.player.id}>
                      <TableCell className="font-medium text-right">
                        {index === 0 && stats.totalWins > 0 && (
                          <Trophy className="w-4 h-4 inline ml-2 text-yellow-500" />
                        )}
                        {stats.player.name}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {stats.totalWins}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.currentRoundWins}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.totalGoalsFor}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.totalGoalsAgainst}
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.totalGoalsAgainst > 0 
                          ? (stats.totalGoalsFor / stats.totalGoalsAgainst).toFixed(2)
                          : stats.totalGoalsFor > 0 ? '∞' : '0'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Round Summary */}
            {evening.rounds.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">סיכום סיבובים קודמים</h3>
                <div className="grid gap-2">
                  {evening.rounds.slice(0, -1).map((round) => (
                    <Card key={round.id} className="p-3">
                      <div className="text-sm font-medium mb-2">
                        סיבוב {round.number} - {round.completed ? 'הושלם' : 'בתהליך'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {round.matches.length} משחקים, {round.matches.filter(m => m.completed).length} הושלמו
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsOpen(false)}>
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};