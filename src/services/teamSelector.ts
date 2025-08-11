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

    // Step 2: Fill remaining slots while keeping total stars balanced (diff <= 1)
    while (pools[0].length < clubsPerPair || pools[1].length < clubsPerPair) {
      for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
        if (pools[pairIndex].length >= clubsPerPair) continue;

        // Determine desired star range to improve/maintain balance
        const diff = poolsSums[0] - poolsSums[1]; // positive => pool0 heavier
        let minStars: number | undefined;
        let maxStars: number | undefined;

        if (diff > 1) {
          // pool0 heavier -> give lower stars to pool0, higher to pool1
          if (pairIndex === 0) { maxStars = 4; } else { minStars = 4; }
        } else if (diff < -1) {
          // pool1 heavier -> give higher stars to pool0, lower to pool1
          if (pairIndex === 0) { minStars = 4; } else { maxStars = 4; }
        } else {
          // Balanced enough -> choose broadly, prefer 4-5 stars
          minStars = 3.5; maxStars = 5;
        }

        try {
          const chosen = getRandomClub(Array.from(banned), minStars, maxStars);
          pools[pairIndex].push(chosen);
          poolsSums[pairIndex] += chosen.stars;
          banned.add(chosen.id);
        } catch {
          // Fallback: any available club
          try {
            const fallback = getRandomClub(Array.from(banned));
            pools[pairIndex].push(fallback);
            poolsSums[pairIndex] += fallback.stars;
            banned.add(fallback.id);
          } catch {
            // No clubs left that satisfy constraints; break to avoid infinite loop
            break;
          }
        }
      }
      // Safety: stop if we can't add more
      if ((pools[0].length >= clubsPerPair) && (pools[1].length >= clubsPerPair)) break;
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
