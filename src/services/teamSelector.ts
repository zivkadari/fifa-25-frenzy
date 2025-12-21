import { Club, Pair } from '@/types/tournament';
import { getClubsByStars, getNationalTeams, getRandomClub, FIFA_CLUBS, getPrimeTeams, getClubsOnly, getNationalTeamsByStars } from '@/data/clubs';

export class TeamSelector {
  /**
   * Generate 7 clubs per pair for 4-round evening:
   * - 1 Prime team
   * - 2 clubs with 5 stars (not national, not prime)
   * - 1 national team with 5 stars
   * - 2 clubs/national teams with 4.5 stars
   * - 1 club with 4 stars
   * Total: 7 teams per pair, no repeats between pairs
   */
  generateTeamPoolsFor4Rounds(pairs: Pair[], excludeClubIds: string[] = []): Club[][] {
    const pools: Club[][] = [];
    const banned = new Set<string>(excludeClubIds);

    const pickRandom = <T extends Club>(arr: T[]): T | null => {
      const available = arr.filter(c => !banned.has(c.id));
      if (available.length === 0) return null;
      const idx = Math.floor(Math.random() * available.length);
      const selected = available[idx];
      banned.add(selected.id);
      return selected;
    };

    pairs.forEach(() => {
      const pool: Club[] = [];

      // 1 Prime team
      const prime = pickRandom(getPrimeTeams());
      if (prime) pool.push(prime);

      // 2 clubs with 5 stars (not national, not prime)
      for (let i = 0; i < 2; i++) {
        const club5 = pickRandom(getClubsOnly(5));
        if (club5) pool.push(club5);
      }

      // 1 national team with 5 stars
      const national5 = pickRandom(getNationalTeamsByStars(5));
      if (national5) pool.push(national5);

      // 2 clubs/national teams with 4.5 stars
      const available45 = [...getClubsOnly(4.5), ...getNationalTeamsByStars(4.5)];
      for (let i = 0; i < 2; i++) {
        const team45 = pickRandom(available45);
        if (team45) pool.push(team45);
      }

      // 1 club with 4 stars
      const club4 = pickRandom(getClubsOnly(4));
      if (club4) pool.push(club4);

      pools.push(pool);
    });

    return pools;
  }

  generateTeamPools(pairs: Pair[], excludeClubIds: string[] = [], clubsPerPair: number = 5): Club[][] {
    const pools: Club[][] = [];
    const banned = new Set<string>(excludeClubIds);

    console.log('Generating team pools (max usage=2), excluding clubs:', excludeClubIds);

    const poolsSums = [0, 0];

    const fiveStarAvailable = getClubsByStars(5).filter(c => !banned.has(c.id));

    pairs.forEach((pair, pairIndex) => {
      const pool: Club[] = [];

      for (let i = 0; i < 2; i++) {
        if (fiveStarAvailable.length > 0) {
          const idx = Math.floor(Math.random() * fiveStarAvailable.length);
          const selected = fiveStarAvailable.splice(idx, 1)[0];
          pool.push(selected);
          poolsSums[pairIndex] += selected.stars;
          banned.add(selected.id);
        } else {
          const fourHalf = getClubsByStars(4.5).filter(c => !banned.has(c.id));
          if (fourHalf.length > 0) {
            const idx2 = Math.floor(Math.random() * fourHalf.length);
            const backup = fourHalf.splice(idx2, 1)[0];
            pool.push(backup);
            poolsSums[pairIndex] += backup.stars;
            banned.add(backup.id);
          } else {
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

    while (pools[0].length < clubsPerPair || pools[1].length < clubsPerPair) {
      if (pools[0].length >= clubsPerPair && pools[1].length >= clubsPerPair) break;
      
      let available = FIFA_CLUBS.filter(c => !banned.has(c.id) && c.stars >= 4);
      if (available.length === 0) {
        available = FIFA_CLUBS.filter(c => !banned.has(c.id));
      }
      if (available.length === 0) break;

      const idx1 = Math.floor(Math.random() * available.length);
      const first = available.splice(idx1, 1)[0];

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

  generateBalancedDeciderTeams(
    excludeClubIds: string[] = [],
    minStars = 4,
    maxStarDiff = 1
  ): [Club, Club] {
    const used = new Set<string>(excludeClubIds);
    const available = FIFA_CLUBS.filter(c => !used.has(c.id) && c.stars >= minStars);

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
      const sortedByDiff = available
        .filter(c => c.id !== first.id)
        .sort((a, b) => Math.abs(a.stars - first.stars) - Math.abs(b.stars - first.stars));
      second = sortedByDiff[0];
    }

    return [first, second!];
  }
}
