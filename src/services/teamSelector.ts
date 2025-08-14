import { Club, Pair } from '@/types/tournament';
import { getClubsByStars, getNationalTeams, getRandomClub, FIFA_CLUBS } from '@/data/clubs';

export class TeamSelector {
  generateTeamPools(pairs: Pair[], excludeClubIds: string[] = [], clubsPerPair: number = 5): Club[][] {
    const pools: Club[][] = [];
    const banned = new Set<string>(excludeClubIds); // Clubs that already reached max usage (>=2)

    console.log('Generating team pools (max usage=2), excluding clubs:', excludeClubIds);

    // Build both pools together to keep total stars within diff <= 1
    const poolsSums = [0, 0];

    // Step 1: Ensure each pair gets exactly two 5-star options
    const fiveStarAvailable = getClubsByStars(5).filter(c => !banned.has(c.id));

    pairs.forEach((pair, pairIndex) => {
      const pool: Club[] = [];

      for (let i = 0; i < 2; i++) {
        if (fiveStarAvailable.length > 0) {
          const idx = Math.floor(Math.random() * fiveStarAvailable.length);
          const selected = fiveStarAvailable.splice(idx, 1)[0];
          pool.push(selected);
          poolsSums[pairIndex] += selected.stars;
          banned.add(selected.id); // keep uniqueness within the generated pools
        } else {
          // Fallback: try 4.5-star if we run out of 5-star teams
          const fourHalf = getClubsByStars(4.5).filter(c => !banned.has(c.id));
          if (fourHalf.length > 0) {
            const idx2 = Math.floor(Math.random() * fourHalf.length);
            const backup = fourHalf.splice(idx2, 1)[0];
            pool.push(backup);
            poolsSums[pairIndex] += backup.stars;
            banned.add(backup.id);
          } else {
            // Last resort: any random club not banned
            try {
              const rnd = getRandomClub(Array.from(banned));
              pool.push(rnd);
              poolsSums[pairIndex] += rnd.stars;
              banned.add(rnd.id);
            } catch {}
          }
        }
      }

      pools.push(pool);
    });

    // Step 2: Fill remaining slots by drawing pairs of random clubs and assigning the higher-star one
    // to the currently lower-total pair to keep totals balanced (diff <= 1). Prefer 4+ star clubs.
    while (pools[0].length < clubsPerPair || pools[1].length < clubsPerPair) {
      // If one pool is already full, just fill the other
      if (pools[0].length >= clubsPerPair && pools[1].length >= clubsPerPair) break;
      
      // First try to get clubs with 4+ stars, then fallback to all available
      let available = FIFA_CLUBS.filter(c => !banned.has(c.id) && c.stars >= 4);
      if (available.length === 0) {
        available = FIFA_CLUBS.filter(c => !banned.has(c.id));
      }
      if (available.length === 0) break;

      // Draw first random club
      const idx1 = Math.floor(Math.random() * available.length);
      const first = available.splice(idx1, 1)[0];

      // If one pool is full, assign directly to the other
      if (pools[0].length >= clubsPerPair) {
        pools[1].push(first);
        poolsSums[1] += first.stars;
        banned.add(first.id);
        continue;
      }
      if (pools[1].length >= clubsPerPair) {
        pools[0].push(first);
        poolsSums[0] += first.stars;
        banned.add(first.id);
        continue;
      }

      // Try to draw a second random club
      let second: Club | null = null;
      if (available.length > 0) {
        const idx2 = Math.floor(Math.random() * available.length);
        second = available.splice(idx2, 1)[0];
      }

      const lowerIdx = poolsSums[0] <= poolsSums[1] ? 0 : 1;
      const higherIdx = lowerIdx === 0 ? 1 : 0;

      if (second) {
        const higherClub = first.stars >= second.stars ? first : second;
        const lowerClub = first.stars >= second.stars ? second : first;

        pools[lowerIdx].push(higherClub);
        poolsSums[lowerIdx] += higherClub.stars;
        banned.add(higherClub.id);

        pools[higherIdx].push(lowerClub);
        poolsSums[higherIdx] += lowerClub!.stars;
        banned.add(lowerClub!.id);
      } else {
        // Only one club drawn; give it to the lower-total pool
        pools[lowerIdx].push(first);
        poolsSums[lowerIdx] += first.stars;
        banned.add(first.id);
      }
    }

    return pools;
  }
  
  generateClubsForMatch(pair1: Pair, pair2: Pair, excludeClubIds: string[] = [], clubsPerPair: number = 5): [Club[], Club[]] {
    const pools = this.generateTeamPools([pair1, pair2], excludeClubIds, clubsPerPair);
    return [pools[0], pools[1]];
  }

  // Generate two balanced teams for a decider: stars >= minStars and star difference <= maxStarDiff
  generateBalancedDeciderTeams(
    excludeClubIds: string[] = [],
    minStars = 4,
    maxStarDiff = 1
  ): [Club, Club] {
    const used = new Set<string>(excludeClubIds);
    const available = FIFA_CLUBS.filter(c => !used.has(c.id) && c.stars >= minStars);

    // Fallback if not enough clubs available
    if (available.length < 2) {
      const backup = FIFA_CLUBS.filter(c => c.stars >= minStars);
      const first = backup[0];
      const second = backup.find(c => c.id !== first.id) || backup[0];
      return [first, second];
    }

    const first = available[Math.floor(Math.random() * available.length)];
    const candidatesStrict = available.filter(c => c.id !== first.id && Math.abs(c.stars - first.stars) <= maxStarDiff);

    let second: Club | undefined = candidatesStrict[Math.floor(Math.random() * Math.max(1, candidatesStrict.length))];

    if (!second) {
      // pick closest by stars as a soft fallback
      const sortedByDiff = available
        .filter(c => c.id !== first.id)
        .sort((a, b) => Math.abs(a.stars - first.stars) - Math.abs(b.stars - first.stars));
      second = sortedByDiff[0];
    }

    return [first, second!];
  }
}
