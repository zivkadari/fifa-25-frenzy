import { Club, Pair } from '@/types/tournament';
import { getClubsByStars, getNationalTeams, getRandomClub, FIFA_CLUBS } from '@/data/clubs';

export class TeamSelector {
  generateTeamPools(pairs: Pair[], excludeClubIds: string[] = [], clubsPerPair: number = 5): Club[][] {
    const pools: Club[][] = [];
    const usedClubs = new Set<string>(excludeClubIds); // Include previously used clubs
    
    console.log('Generating team pools, excluding clubs:', excludeClubIds);
    
    pairs.forEach((pair, pairIndex) => {
      const pool: Club[] = [];
      
      // Slot 1: Exactly one 5-star club
      const fiveStarClubs = getClubsByStars(5).filter(club => !usedClubs.has(club.id));
      if (fiveStarClubs.length > 0) {
        const selectedClub = fiveStarClubs[Math.floor(Math.random() * fiveStarClubs.length)];
        pool.push(selectedClub);
        usedClubs.add(selectedClub.id);
      }
      
      // Slots 2-3: Exactly two 4.5-star clubs
      const fourHalfStarClubs = getClubsByStars(4.5).filter(club => !usedClubs.has(club.id));
      for (let i = 0; i < 2 && fourHalfStarClubs.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * fourHalfStarClubs.length);
        const selectedClub = fourHalfStarClubs.splice(randomIndex, 1)[0];
        pool.push(selectedClub);
        usedClubs.add(selectedClub.id);
      }
      
      // Slot 4: One National Team (4-5 stars)
      const nationalTeams = getNationalTeams().filter(club => !usedClubs.has(club.id));
      if (nationalTeams.length > 0) {
        const selectedTeam = nationalTeams[Math.floor(Math.random() * nationalTeams.length)];
        pool.push(selectedTeam);
        usedClubs.add(selectedTeam.id);
      }
      
      // Additional slots: Random clubs with balance rule
      while (pool.length < clubsPerPair) {
        // For the second pair, apply balance rule if this is a random slot
        if (pairIndex === 1 && pools[0] && pools[0].length > pool.length) {
          const otherPairClub = pools[0][pool.length];
          const targetStars = otherPairClub.stars;
          const minStars = Math.max(1, targetStars - 1);
          const maxStars = Math.min(5, targetStars + 1);
          
          try {
            const balancedClub = getRandomClub(
              Array.from(usedClubs), 
              minStars, 
              maxStars
            );
            pool.push(balancedClub);
            usedClubs.add(balancedClub.id);
          } catch {
            // Fallback: any available club
            const fallbackClub = getRandomClub(Array.from(usedClubs));
            pool.push(fallbackClub);
            usedClubs.add(fallbackClub.id);
          }
        } else {
          const randomClub = getRandomClub(Array.from(usedClubs));
          pool.push(randomClub);
          usedClubs.add(randomClub.id);
        }
      }
      
      pools.push(pool);
    });
    
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
