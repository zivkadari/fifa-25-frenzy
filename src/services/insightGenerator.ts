/**
 * Insight generator for 5-player doubles spectator view.
 * Generates interesting, personalized facts from all-time data.
 */
import { AllTimePlayerStats } from '@/services/allTimeStatsService';

export interface Insight {
  id: string;
  icon: string;
  text: string;
  category: 'personal' | 'pair' | 'comparison' | 'milestone';
  /** Data for cross-player comparison when expanded */
  comparisonData?: ComparisonRow[];
  comparisonTitle?: string;
}

export interface ComparisonRow {
  playerName: string;
  playerId: string;
  value: string | number;
  isSelected: boolean;
}

/**
 * Generate all possible insights for a selected player.
 * The caller picks 1-2 at a time and rotates.
 */
export function generateInsights(
  selectedStats: AllTimePlayerStats,
  allStats: Map<string, AllTimePlayerStats>
): Insight[] {
  const insights: Insight[] = [];
  const p = selectedStats;

  // Only generate insights if there's meaningful historical data
  if (p.eveningsPlayed < 1) return insights;

  const hasHistory = p.eveningsPlayed > 1;

  // ── Personal insights ──

  // Tonight's contribution
  if (p.tonightPoints > 0 && hasHistory) {
    const historicalTotal = p.totalPoints - p.tonightPoints;
    insights.push({
      id: 'tonight-points',
      icon: '📈',
      text: `הטורניר הזה הוסיף +${p.tonightPoints} נקודות לסה״כ הכל-זמני שלך (${historicalTotal} → ${p.totalPoints})`,
      category: 'personal',
      comparisonTitle: 'נקודות שנוספו בטורניר הזה',
      comparisonData: buildComparison(allStats, p.player.id, s => `+${s.tonightPoints}`),
    });
  }

  // Total points
  if (hasHistory) {
    insights.push({
      id: 'total-points',
      icon: '🏆',
      text: `צברת סה״כ ${p.totalPoints} נקודות ב-${p.eveningsPlayed} ערבים`,
      category: 'personal',
      comparisonTitle: 'סה״כ נקודות כל הזמנים',
      comparisonData: buildComparison(allStats, p.player.id, s => s.totalPoints),
    });
  }

  // Win rate
  if (p.totalPlayed >= 10) {
    insights.push({
      id: 'win-rate',
      icon: '🎯',
      text: `אחוז הניצחון הכל-זמני שלך: ${p.totalWinRate}% (${p.totalWins} מתוך ${p.totalPlayed} משחקים)`,
      category: 'personal',
      comparisonTitle: '% ניצחון כל הזמנים',
      comparisonData: buildComparison(allStats, p.player.id, s => `${s.totalWinRate}% (${s.totalWins}/${s.totalPlayed})`),
    });
  }

  // Best partner ever
  if (p.bestPartnerEver && p.bestPartnerEver.played >= 2) {
    const bp = p.bestPartnerEver;
    insights.push({
      id: 'best-partner',
      icon: '🤝',
      text: `השותף הטוב ביותר שלך אי-פעם: ${bp.partner.name} (${bp.wins} ניצחונות, ${bp.points} נק׳)`,
      category: 'pair',
      comparisonTitle: 'שותף מוביל כל הזמנים',
      comparisonData: buildComparison(allStats, p.player.id, s =>
        s.bestPartnerEver ? `${s.bestPartnerEver.partner.name} (${s.bestPartnerEver.points} נק׳)` : '–'
      ),
    });
  }

  // Toughest opponent
  if (p.toughestOpponentEver && p.toughestOpponentEver.losses >= 2) {
    const to = p.toughestOpponentEver;
    insights.push({
      id: 'toughest-opponent',
      icon: '⚔️',
      text: `היריב הקשה ביותר שלך: ${to.opponent.name} (${to.losses} הפסדים מתוך ${to.played} מפגשים)`,
      category: 'personal',
      comparisonTitle: 'יריב קשה ביותר',
      comparisonData: buildComparison(allStats, p.player.id, s =>
        s.toughestOpponentEver ? `${s.toughestOpponentEver.opponent.name} (${s.toughestOpponentEver.losses} הפס׳)` : '–'
      ),
    });
  }

  // Best club
  if (p.bestClubEver && p.bestClubEver.wins >= 2) {
    const bc = p.bestClubEver;
    insights.push({
      id: 'best-club',
      icon: '⚽',
      text: `הקבוצה הכי מוצלחת שלך: ${bc.clubName} (${bc.wins} ניצחונות מתוך ${bc.played} משחקים)`,
      category: 'personal',
      comparisonTitle: `ניצחונות עם ${bc.clubName}`,
      comparisonData: buildComparison(allStats, p.player.id, s => {
        const club = s.clubRecords.find(c => c.clubName === bc.clubName);
        return club ? `${club.wins}/${club.played}` : '0';
      }),
    });
  }

  // Best star tier
  if (p.bestTierEver && p.bestTierEver.played >= 3) {
    const bt = p.bestTierEver;
    insights.push({
      id: 'best-tier',
      icon: '⭐',
      text: `אחוז הניצחון הגבוה ביותר שלך הוא עם קבוצות ${bt.label} — ${bt.winRate}% (${bt.wins} מתוך ${bt.played} משחקים)`,
      category: 'personal',
      comparisonTitle: `% ניצחון עם ${bt.label}`,
      comparisonData: buildComparison(allStats, p.player.id, s => {
        const tier = s.tierRecords.find(t => t.stars === bt.stars);
        return tier ? `${tier.winRate}% (${tier.wins}/${tier.played})` : '–';
      }),
    });
  }

  // Tournament performance comparisons
  if (hasHistory && p.eveningBreakdowns.length >= 2) {
    const sorted = [...p.eveningBreakdowns].sort((a, b) => b.points - a.points);
    const currentBreakdown = p.eveningBreakdowns.find(e => e.eveningId === p.eveningBreakdowns[p.eveningBreakdowns.length - 1].eveningId);
    
    if (currentBreakdown && currentBreakdown.points > 0) {
      const rank = sorted.findIndex(e => e.eveningId === currentBreakdown.eveningId) + 1;
      if (rank <= 2 && rank > 0 && sorted.length >= 2) {
        insights.push({
          id: 'best-evening',
          icon: '🔥',
          text: rank === 1
            ? `זה הטורניר הטוב ביותר שלך אי-פעם! (${currentBreakdown.points} נק׳)`
            : `זו ההתחלה השנייה הטובה ביותר שלך אי-פעם בטורניר 5 שחקנים!`,
          category: 'milestone',
        });
      }

      // Average points comparison
      const historicalBreakdowns = p.eveningBreakdowns.slice(0, -1);
      if (historicalBreakdowns.length >= 2) {
        const avgPoints = Math.round(historicalBreakdowns.reduce((s, e) => s + e.points, 0) / historicalBreakdowns.length);
        if (currentBreakdown.points > avgPoints) {
          insights.push({
            id: 'above-average',
            icon: '📊',
            text: `כבר עברת את הממוצע שלך (${avgPoints} נק׳ בדרך כלל, ${currentBreakdown.points} בטורניר הזה)`,
            category: 'milestone',
          });
        }
      }
    }

    // Best ever points record
    const bestEver = sorted[0];
    if (currentBreakdown && bestEver && currentBreakdown.eveningId !== bestEver.eveningId) {
      const diff = bestEver.points - currentBreakdown.points;
      if (diff <= 3 && diff > 0 && currentBreakdown.points > 0) {
        insights.push({
          id: 'close-to-record',
          icon: '🎖️',
          text: `עוד ${diff === 1 ? 'ניצחון אחד' : `${diff} נקודות`} ותשבור את השיא האישי שלך (${bestEver.points} נק׳)`,
          category: 'milestone',
        });
      }
    }
  }

  // Partner-specific pair insight  
  if (p.partnerRecords.length >= 2) {
    const topPartner = p.partnerRecords[0];
    if (topPartner.played >= 3 && topPartner.winRate >= 60) {
      insights.push({
        id: 'strong-pair',
        icon: '💪',
        text: `${p.player.name} ו${topPartner.partner.name} מנצחים ב-${topPartner.winRate}% מהמשחקים ביחד (${topPartner.wins} מתוך ${topPartner.played} משחקים)`,
        category: 'pair',
        comparisonTitle: 'שותפות מנצחת',
        comparisonData: buildComparison(allStats, p.player.id, s => {
          const pr = s.partnerRecords.find(r => r.partner.id === topPartner.partner.id);
          return pr ? `${pr.winRate}% (${pr.wins}/${pr.played})` : '–';
        }),
      });
    }
  }

  return insights;
}

function buildComparison(
  allStats: Map<string, AllTimePlayerStats>,
  selectedId: string,
  getValue: (s: AllTimePlayerStats) => string | number
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  for (const [id, stats] of allStats.entries()) {
    rows.push({
      playerName: stats.player.name,
      playerId: id,
      value: getValue(stats),
      isSelected: id === selectedId,
    });
  }
  return rows;
}
