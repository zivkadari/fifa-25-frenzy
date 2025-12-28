import { Club, Pair } from '@/types/tournament';
import { getClubsByStars, getNationalTeams, getRandomClub, FIFA_CLUBS, getPrimeTeams, getClubsOnly, getNationalTeamsByStars } from '@/data/clubs';

/**
 * Result from team pool generation including recycled club info
 */
export interface TeamPoolResult {
  pools: Club[][];
  recycledClubIds: Set<string>;
}

/**
 * Smart club picker that ensures each club appears only once per evening.
 * Falls back to allowing reuse ONLY when all clubs of the required star rating are exhausted.
 * 
 * @param sourceClubs - Array of clubs to pick from (already filtered by star/type)
 * @param banned - Set of club IDs that have been used this evening
 * @param usedClubsMap - Map of club ID to Club for potential reuse fallback
 * @param preferredStars - The star rating we prefer (for fallback matching)
 * @returns Object with the club and whether it was recycled
 */
function pickClubWithFallback(
  sourceClubs: Club[],
  banned: Set<string>,
  usedClubsMap: Map<string, Club>,
  preferredStars?: number
): { club: Club | null; isRecycled: boolean } {
  // First: try to find an unused club
  const available = sourceClubs.filter(c => !banned.has(c.id));
  if (available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    return { club: available[idx], isRecycled: false };
  }
  
  // Fallback: all clubs of this category are exhausted
  // Allow reuse of clubs with the SAME star rating that were already used
  if (preferredStars !== undefined) {
    // CRITICAL: Also check !banned.has(c.id) to prevent duplicates within the same round
    const usedWithSameStars = Array.from(usedClubsMap.values())
      .filter(c => c.stars === preferredStars && !banned.has(c.id));
    if (usedWithSameStars.length > 0) {
      const idx = Math.floor(Math.random() * usedWithSameStars.length);
      return { club: usedWithSameStars[idx], isRecycled: true };
    }
  }
  
  return { club: null, isRecycled: false };
}

export class TeamSelector {
  /**
   * Generate 7 clubs per pair for 4-round evening:
   * - 1 Prime team
   * - 2 clubs with 5 stars (not national, not prime)
   * - 1 national team with 5 stars
   * - 2 clubs/national teams with 4.5 stars
   * - 1 club with 4 stars
   * Total: 7 teams per pair, no repeats between pairs
   * 
   * Each club appears ONLY ONCE per evening, unless all clubs of that star rating are exhausted.
   */
  generateTeamPoolsFor4Rounds(pairs: Pair[], excludeClubIds: string[] = []): TeamPoolResult {
    const pools: Club[][] = [];
    const banned = new Set<string>(excludeClubIds);
    const usedClubsMap = new Map<string, Club>();
    const recycledClubIds = new Set<string>();
    
    // Track used clubs from excludeClubIds for fallback
    excludeClubIds.forEach(id => {
      const club = FIFA_CLUBS.find(c => c.id === id);
      if (club) usedClubsMap.set(id, club);
    });

    const pickAndBan = (pool: Club[], sourceClubs: Club[], stars?: number): Club | null => {
      const result = pickClubWithFallback(sourceClubs, banned, usedClubsMap, stars);
      if (result.club) {
        // SAFETY CHECK: Prevent duplicate clubs in the same pool
        if (pool.some(c => c.id === result.club!.id)) {
          console.warn('Duplicate club prevented in pool:', result.club.name);
          return null;
        }
        banned.add(result.club.id);
        usedClubsMap.set(result.club.id, result.club);
        if (result.isRecycled) {
          recycledClubIds.add(result.club.id);
        }
      }
      return result.club;
    };

    pairs.forEach(() => {
      const pool: Club[] = [];

      // 1 Prime team (5 stars)
      const prime = pickAndBan(pool, getPrimeTeams(), 5);
      if (prime) pool.push(prime);

      // 2 clubs with 5 stars (not national, not prime)
      for (let i = 0; i < 2; i++) {
        const club5 = pickAndBan(pool, getClubsOnly(5), 5);
        if (club5) pool.push(club5);
      }

      // 1 national team with 5 stars
      const national5 = pickAndBan(pool, getNationalTeamsByStars(5), 5);
      if (national5) pool.push(national5);

      // 2 clubs/national teams with 4.5 stars
      const available45 = [...getClubsOnly(4.5), ...getNationalTeamsByStars(4.5)];
      for (let i = 0; i < 2; i++) {
        const team45 = pickAndBan(pool, available45, 4.5);
        if (team45) pool.push(team45);
      }

      // 1 club with 4 stars
      const club4 = pickAndBan(pool, getClubsOnly(4), 4);
      if (club4) pool.push(club4);

      pools.push(pool);
    });

    return { pools, recycledClubIds };
  }

  /**
   * Generate team pools for pairs tournament.
   * Each club appears ONLY ONCE per evening, unless all clubs of that star rating are exhausted.
   */
  generateTeamPools(pairs: Pair[], excludeClubIds: string[] = [], clubsPerPair: number = 5): TeamPoolResult {
    const pools: Club[][] = [];
    const banned = new Set<string>(excludeClubIds);
    const usedClubsMap = new Map<string, Club>();
    const recycledClubIds = new Set<string>();
    
    // Track used clubs from excludeClubIds for fallback
    excludeClubIds.forEach(id => {
      const club = FIFA_CLUBS.find(c => c.id === id);
      if (club) usedClubsMap.set(id, club);
    });

    console.log('Generating team pools (max usage=1), excluding clubs:', excludeClubIds);

    const poolsSums = [0, 0];

    // Helper to pick and ban
    const pickFromPool = (sourceClubs: Club[], stars: number): Club | null => {
      const result = pickClubWithFallback(sourceClubs, banned, usedClubsMap, stars);
      if (result.club) {
        banned.add(result.club.id);
        usedClubsMap.set(result.club.id, result.club);
        if (result.isRecycled) {
          recycledClubIds.add(result.club.id);
        }
      }
      return result.club;
    };

    // Get initial 5-star clubs pool
    const fiveStarClubs = getClubsByStars(5);

    pairs.forEach((pair, pairIndex) => {
      const pool: Club[] = [];

      // Try to get 2 five-star clubs for each pair
      for (let i = 0; i < 2; i++) {
        const club = pickFromPool(fiveStarClubs, 5);
        if (club) {
          pool.push(club);
          poolsSums[pairIndex] += club.stars;
        } else {
          // No more 5-star available, try 4.5
          const backup = pickFromPool(getClubsByStars(4.5), 4.5);
          if (backup) {
            pool.push(backup);
            poolsSums[pairIndex] += backup.stars;
          }
        }
      }

      pools.push(pool);
    });

    // Fill remaining slots
    while (pools[0].length < clubsPerPair || pools[1].length < clubsPerPair) {
      if (pools[0].length >= clubsPerPair && pools[1].length >= clubsPerPair) break;
      
      // Try to find unused clubs with 4+ stars
      let available = FIFA_CLUBS.filter(c => !banned.has(c.id) && c.stars >= 4);
      let isRecycledBatch = false;
      
      // If no unused 4+ star clubs, allow reuse of 4+ star clubs
      // CRITICAL: Also check !banned.has(c.id) to prevent duplicates within the same round
      if (available.length === 0) {
        const usedFourPlus = Array.from(usedClubsMap.values())
          .filter(c => c.stars >= 4 && !banned.has(c.id));
        if (usedFourPlus.length > 0) {
          available = usedFourPlus;
          isRecycledBatch = true;
        } else {
          // Last resort: any unused club
          available = FIFA_CLUBS.filter(c => !banned.has(c.id));
        }
      }
      
      if (available.length === 0) break;

      const idx1 = Math.floor(Math.random() * available.length);
      const first = available[idx1];
      banned.add(first.id);
      usedClubsMap.set(first.id, first);
      if (isRecycledBatch) {
        recycledClubIds.add(first.id);
      }

      if (pools[0].length >= clubsPerPair) {
        pools[1].push(first);
        poolsSums[1] += first.stars;
        continue;
      }
      if (pools[1].length >= clubsPerPair) {
        pools[0].push(first);
        poolsSums[0] += first.stars;
        continue;
      }

      // Get second club for balanced assignment
      const remainingAvailable = available.filter(c => c.id !== first.id && !banned.has(c.id));
      let second: Club | null = null;
      if (remainingAvailable.length > 0) {
        const idx2 = Math.floor(Math.random() * remainingAvailable.length);
        second = remainingAvailable[idx2];
        banned.add(second.id);
        usedClubsMap.set(second.id, second);
        if (isRecycledBatch) {
          recycledClubIds.add(second.id);
        }
      }

      const lowerIdx = poolsSums[0] <= poolsSums[1] ? 0 : 1;
      const higherIdx = lowerIdx === 0 ? 1 : 0;

      if (second) {
        const higherClub = first.stars >= second.stars ? first : second;
        const lowerClub = first.stars >= second.stars ? second : first;

        pools[lowerIdx].push(higherClub);
        poolsSums[lowerIdx] += higherClub.stars;

        pools[higherIdx].push(lowerClub);
        poolsSums[higherIdx] += lowerClub.stars;
      } else {
        pools[lowerIdx].push(first);
        poolsSums[lowerIdx] += first.stars;
      }
    }

    return { pools, recycledClubIds };
  }
  
  generateClubsForMatch(pair1: Pair, pair2: Pair, excludeClubIds: string[] = [], clubsPerPair: number = 5): [Club[], Club[]] {
    const result = this.generateTeamPools([pair1, pair2], excludeClubIds, clubsPerPair);
    return [result.pools[0], result.pools[1]];
  }

  /**
   * Generate balanced decider teams.
   * Each club appears ONLY ONCE per evening, unless all clubs of minStars are exhausted.
   */
  generateBalancedDeciderTeams(
    excludeClubIds: string[] = [],
    minStars = 4,
    maxStarDiff = 1
  ): [Club, Club] {
    const banned = new Set<string>(excludeClubIds);
    const usedClubsMap = new Map<string, Club>();
    
    // Track used clubs for fallback
    excludeClubIds.forEach(id => {
      const club = FIFA_CLUBS.find(c => c.id === id);
      if (club) usedClubsMap.set(id, club);
    });
    
    // First try: unused clubs with minStars or higher
    let available = FIFA_CLUBS.filter(c => !banned.has(c.id) && c.stars >= minStars);

    // Fallback: if less than 2 unused clubs, allow reuse of clubs with same star rating
    if (available.length < 2) {
      const usedWithMinStars = Array.from(usedClubsMap.values()).filter(c => c.stars >= minStars);
      if (usedWithMinStars.length >= 2) {
        available = usedWithMinStars;
      } else if (available.length === 1 && usedWithMinStars.length >= 1) {
        // We have 1 unused + at least 1 reusable
        available = [...available, ...usedWithMinStars.filter(c => c.id !== available[0].id)];
      } else {
        // Ultimate fallback: just get any clubs with minStars
        available = FIFA_CLUBS.filter(c => c.stars >= minStars);
      }
    }

    if (available.length < 2) {
      const backup = FIFA_CLUBS.filter(c => c.stars >= minStars);
      const first = backup[0];
      const second = backup.find(c => c.id !== first.id) || backup[0];
      return [first, second];
    }

    const first = available[Math.floor(Math.random() * available.length)];
    const candidatesStrict = available.filter(c => c.id !== first.id && Math.abs(c.stars - first.stars) <= maxStarDiff);

    let second: Club | undefined = candidatesStrict.length > 0 
      ? candidatesStrict[Math.floor(Math.random() * candidatesStrict.length)]
      : undefined;

    if (!second) {
      const sortedByDiff = available
        .filter(c => c.id !== first.id)
        .sort((a, b) => Math.abs(a.stars - first.stars) - Math.abs(b.stars - first.stars));
      second = sortedByDiff[0];
    }

    return [first, second!];
  }
}
