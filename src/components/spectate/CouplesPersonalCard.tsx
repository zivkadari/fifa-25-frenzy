import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CouplesPersonalStats } from "@/services/spectatorCouplesStats";
import { User, Zap, Trophy, Users, Swords } from "lucide-react";

interface Props {
  personal: CouplesPersonalStats;
  onSwitchPlayer: () => void;
  isCompleted: boolean;
}

export default function CouplesPersonalCard({ personal, onSwitchPlayer, isCompleted }: Props) {
  const { player, standing, rank, currentPartner, currentOpponents, currentPairScore, winsToComplete, currentStreak, winRate, bestPartner, toughestOpponent, currentMyClub, currentOppClub } = personal;

  const streakLabel = currentStreak.type === 'W'
    ? `🔥 ${currentStreak.count} ניצחונות ברצף`
    : currentStreak.type === 'L'
    ? `${currentStreak.count} הפסדים ברצף`
    : currentStreak.type === 'D'
    ? `${currentStreak.count} תיקו ברצף`
    : null;

  return (
    <Card className="bg-gradient-card border-neon-green/30 p-4 shadow-card space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-neon-green/15 border border-neon-green/40 flex items-center justify-center">
            {isCompleted && rank === 1 ? <Trophy className="h-4 w-4 text-neon-green" /> : <User className="h-4 w-4 text-neon-green" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight">{player.name}</h2>
            <p className="text-[11px] text-muted-foreground">
              מקום {rank} · {standing.matchesPlayed} משחקים
            </p>
          </div>
        </div>
        <button
          onClick={onSwitchPlayer}
          className="text-[10px] text-muted-foreground hover:text-foreground border border-border/50 rounded-md px-2 py-1 transition-colors"
        >
          החלף שחקן
        </button>
      </div>

      {/* Live status */}
      {!isCompleted && currentPartner && (
        <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-[11px]">
          <Zap className="h-3 w-3 ml-1" />
          משחק עכשיו עם {currentPartner.name}
        </Badge>
      )}

      {isCompleted && (
        <Badge variant="outline" className="border-neon-green/30 text-neon-green text-[11px]">
          <Trophy className="h-3 w-3 ml-1" />
          סיכום סופי · מקום {rank}
        </Badge>
      )}

      {/* Current round score */}
      {!isCompleted && currentPairScore && (
        <div className="bg-gaming-surface/60 rounded-lg px-3 py-2 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">סיבוב {personal.currentRoundNumber} · ראשון ל-{winsToComplete}</div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="text-lg font-bold text-neon-green">{currentPairScore.mine}</span>
            <span className="text-xs text-muted-foreground">-</span>
            <span className="text-lg font-bold text-foreground">{currentPairScore.theirs}</span>
          </div>
          {currentOpponents && (
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              נגד {currentOpponents[0].name} & {currentOpponents[1].name}
            </p>
          )}
          {(currentMyClub || currentOppClub) && (
            <div className="flex items-center justify-center gap-2 mt-1">
              {currentMyClub && <Badge variant="outline" className="text-[10px] border-neon-green/30 text-neon-green">{currentMyClub.name}</Badge>}
              {currentMyClub && currentOppClub && <span className="text-[10px] text-muted-foreground">vs</span>}
              {currentOppClub && <Badge variant="outline" className="text-[10px] border-border/50 text-foreground">{currentOppClub.name}</Badge>}
            </div>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="נקודות" value={standing.points} highlight />
        <StatBox label="ניצחונות" value={standing.matchWins} />
        <StatBox label="תיקו" value={standing.matchDraws} />
        <StatBox label="הפסדים" value={standing.matchLosses} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="הפ. שערים" value={`${standing.goalDiff > 0 ? '+' : ''}${standing.goalDiff}`} />
        <StatBox label="% ניצחון" value={`${winRate}%`} />
        <StatBox label="שערים" value={`${standing.goalsFor}:${standing.goalsAgainst}`} />
      </div>

      {/* Streak */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {standing.roundWins > 0 ? `${standing.roundWins} סיבובים נוצחו` : `${standing.matchesPlayed} משחקים`}
        </span>
        {streakLabel && standing.matchesPlayed >= 2 && (
          <span className={`font-medium ${currentStreak.type === 'W' ? 'text-neon-green' : currentStreak.type === 'L' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {streakLabel}
          </span>
        )}
      </div>

      {/* Best partner & toughest opponent */}
      {(bestPartner || toughestOpponent) && (
        <div className="grid grid-cols-2 gap-2">
          {bestPartner && bestPartner.matchesPlayed >= 1 && (
            <div className="bg-gaming-surface/60 rounded-lg px-2.5 py-1.5 border border-border/30">
              <p className="text-[9px] text-muted-foreground flex items-center gap-1"><Users className="h-2.5 w-2.5" />שותף מוביל</p>
              <p className="text-xs font-bold text-foreground leading-tight mt-0.5">{bestPartner.partner.name}</p>
              <p className="text-[9px] text-muted-foreground">{bestPartner.matchWins}נ {bestPartner.matchDraws}ת {bestPartner.matchLosses}ה</p>
            </div>
          )}
          {toughestOpponent && toughestOpponent.matchesPlayed >= 1 && (
            <div className="bg-gaming-surface/60 rounded-lg px-2.5 py-1.5 border border-border/30">
              <p className="text-[9px] text-muted-foreground flex items-center gap-1"><Swords className="h-2.5 w-2.5" />יריב קשה</p>
              <p className="text-xs font-bold text-foreground leading-tight mt-0.5">{toughestOpponent.opponent.name}</p>
              <p className="text-[9px] text-muted-foreground">{toughestOpponent.matchWins}נ {toughestOpponent.matchDraws}ת {toughestOpponent.matchLosses}ה</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-gaming-surface/60 rounded-lg px-2 py-1.5 text-center border border-border/30">
      <p className={`text-sm font-bold leading-tight ${highlight ? 'text-neon-green' : 'text-foreground'}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</p>
    </div>
  );
}
