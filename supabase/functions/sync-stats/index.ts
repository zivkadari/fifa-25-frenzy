import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Player {
  id: string;
  name: string;
}

interface Pair {
  id: string;
  players: [Player, Player];
}

interface Match {
  pairs: [Pair, Pair];
  score?: [number, number];
  winner?: string;
  completed: boolean;
}

interface Round {
  matches: Match[];
  completed: boolean;
}

interface SinglesGame {
  players: [Player, Player];
  score?: [number, number];
  winner?: string;
  completed: boolean;
}

interface Evening {
  id: string;
  players: Player[];
  rounds?: Round[];
  completed: boolean;
  rankings?: {
    alpha: Player[];
    beta: Player[];
    gamma: Player[];
    delta?: Player[];
  };
  type?: "pairs" | "singles";
  gameSequence?: SinglesGame[];
}

interface PlayerStats {
  player: Player;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  alphaCount: number;
  betaCount: number;
  gammaCount: number;
  deltaCount: number;
}

function calculatePlayerStats(evening: Evening): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();

  // Initialize stats for all players
  evening.players.forEach((player) => {
    statsMap.set(player.id, {
      player,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      alphaCount: 0,
      betaCount: 0,
      gammaCount: 0,
      deltaCount: 0,
    });
  });

  if (evening.type === "singles" && evening.gameSequence) {
    // Process singles games
    evening.gameSequence.forEach((game) => {
      if (game.completed && game.score) {
        const [score1, score2] = game.score;
        const [player1, player2] = game.players;

        const stats1 = statsMap.get(player1.id);
        const stats2 = statsMap.get(player2.id);

        if (stats1 && stats2) {
          stats1.goalsFor += score1;
          stats1.goalsAgainst += score2;
          stats2.goalsFor += score2;
          stats2.goalsAgainst += score1;

          if (score1 > score2) {
            stats1.wins++;
            stats2.losses++;
          } else if (score2 > score1) {
            stats2.wins++;
            stats1.losses++;
          } else {
            stats1.draws++;
            stats2.draws++;
          }
        }
      }
    });
  } else if (evening.rounds) {
    // Process pairs matches
    evening.rounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (match.completed && match.score) {
          const [score1, score2] = match.score;
          const [pair1, pair2] = match.pairs;

          // Update goals for/against
          pair1.players.forEach((player) => {
            const stats = statsMap.get(player.id);
            if (stats) {
              stats.goalsFor += score1;
              stats.goalsAgainst += score2;
            }
          });

          pair2.players.forEach((player) => {
            const stats = statsMap.get(player.id);
            if (stats) {
              stats.goalsFor += score2;
              stats.goalsAgainst += score1;
            }
          });

          // Update wins/losses/draws
          if (score1 > score2) {
            pair1.players.forEach((player) => {
              const stats = statsMap.get(player.id);
              if (stats) stats.wins++;
            });
            pair2.players.forEach((player) => {
              const stats = statsMap.get(player.id);
              if (stats) stats.losses++;
            });
          } else if (score2 > score1) {
            pair2.players.forEach((player) => {
              const stats = statsMap.get(player.id);
              if (stats) stats.wins++;
            });
            pair1.players.forEach((player) => {
              const stats = statsMap.get(player.id);
              if (stats) stats.losses++;
            });
          } else {
            [...pair1.players, ...pair2.players].forEach((player) => {
              const stats = statsMap.get(player.id);
              if (stats) stats.draws++;
            });
          }
        }
      });
    });
  }

  // Add ranking counts if evening is completed
  if (evening.completed && evening.rankings) {
    evening.rankings.alpha?.forEach((player) => {
      const stats = statsMap.get(player.id);
      if (stats) stats.alphaCount++;
    });
    evening.rankings.beta?.forEach((player) => {
      const stats = statsMap.get(player.id);
      if (stats) stats.betaCount++;
    });
    evening.rankings.gamma?.forEach((player) => {
      const stats = statsMap.get(player.id);
      if (stats) stats.gammaCount++;
    });
    evening.rankings.delta?.forEach((player) => {
      const stats = statsMap.get(player.id);
      if (stats) stats.deltaCount++;
    });
  }

  return Array.from(statsMap.values());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Use service role for data operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { evening_id, backfill_all } = body;

    console.log("sync-stats called with:", { evening_id, backfill_all, userId });

    // Restrict backfill_all to admin users only
    if (backfill_all) {
      const { data: isAdmin } = await supabase.rpc("is_clubs_admin", { user_id: userId });
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Admin access required for backfill" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let evenings: { id: string; data: Evening; team_id: string | null }[] = [];

    if (backfill_all) {
      // Fetch all evenings
      const { data, error } = await supabase
        .from("evenings")
        .select("id, data, team_id");

      if (error) throw error;
      evenings = data || [];
      console.log(`Backfilling ${evenings.length} evenings`);
    } else if (evening_id) {
      // Fetch single evening
      const { data, error } = await supabase
        .from("evenings")
        .select("id, data, team_id")
        .eq("id", evening_id)
        .single();

      if (error) throw error;
      if (data) evenings = [data];
    } else {
      return new Response(
        JSON.stringify({ error: "evening_id or backfill_all required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate stats across all evenings per player per team
    const byTeamStats = new Map<string, Map<string, PlayerStats>>();
    const globalStats = new Map<string, PlayerStats>();

    for (const row of evenings) {
      const evening = row.data as Evening;
      const teamId = row.team_id;

      if (!evening || !evening.players) {
        console.log(`Skipping evening ${row.id}: no valid data`);
        continue;
      }

      const stats = calculatePlayerStats(evening);

      for (const stat of stats) {
        const playerId = stat.player.id;

        // Update team-specific stats
        if (teamId) {
          if (!byTeamStats.has(teamId)) {
            byTeamStats.set(teamId, new Map());
          }
          const teamMap = byTeamStats.get(teamId)!;

          if (!teamMap.has(playerId)) {
            teamMap.set(playerId, {
              player: stat.player,
              wins: 0,
              losses: 0,
              draws: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              alphaCount: 0,
              betaCount: 0,
              gammaCount: 0,
              deltaCount: 0,
            });
          }

          const existing = teamMap.get(playerId)!;
          existing.wins += stat.wins;
          existing.losses += stat.losses;
          existing.draws += stat.draws;
          existing.goalsFor += stat.goalsFor;
          existing.goalsAgainst += stat.goalsAgainst;
          existing.alphaCount += stat.alphaCount;
          existing.betaCount += stat.betaCount;
          existing.gammaCount += stat.gammaCount;
          existing.deltaCount += stat.deltaCount;
        }

        // Update global stats
        if (!globalStats.has(playerId)) {
          globalStats.set(playerId, {
            player: stat.player,
            wins: 0,
            losses: 0,
            draws: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            alphaCount: 0,
            betaCount: 0,
            gammaCount: 0,
            deltaCount: 0,
          });
        }

        const existing = globalStats.get(playerId)!;
        existing.wins += stat.wins;
        existing.losses += stat.losses;
        existing.draws += stat.draws;
        existing.goalsFor += stat.goalsFor;
        existing.goalsAgainst += stat.goalsAgainst;
        existing.alphaCount += stat.alphaCount;
        existing.betaCount += stat.betaCount;
        existing.gammaCount += stat.gammaCount;
        existing.deltaCount += stat.deltaCount;
      }
    }

    // For single evening sync, we need to recalculate from scratch
    // Delete existing and reinsert to ensure idempotency
    if (backfill_all) {
      // Clear all existing stats and repopulate
      console.log("Clearing existing stats for full backfill");

      await supabase.from("player_stats_by_team").delete().neq("player_id", "");
      await supabase.from("player_stats_global").delete().neq("player_id", "");
    }

    // Upsert team stats
    const teamUpserts: {
      team_id: string;
      player_id: string;
      games_played: number;
      games_won: number;
      games_lost: number;
      games_drawn: number;
      goals_for: number;
      goals_against: number;
      alpha_count: number;
      beta_count: number;
      gamma_count: number;
      delta_count: number;
    }[] = [];

    for (const [teamId, playerMap] of byTeamStats) {
      for (const [playerId, stats] of playerMap) {
        teamUpserts.push({
          team_id: teamId,
          player_id: playerId,
          games_played: stats.wins + stats.losses + stats.draws,
          games_won: stats.wins,
          games_lost: stats.losses,
          games_drawn: stats.draws,
          goals_for: stats.goalsFor,
          goals_against: stats.goalsAgainst,
          alpha_count: stats.alphaCount,
          beta_count: stats.betaCount,
          gamma_count: stats.gammaCount,
          delta_count: stats.deltaCount,
        });
      }
    }

    if (teamUpserts.length > 0) {
      const { error } = await supabase
        .from("player_stats_by_team")
        .upsert(teamUpserts, { onConflict: "team_id,player_id" });

      if (error) {
        console.error("Error upserting team stats:", error);
        throw error;
      }
      console.log(`Upserted ${teamUpserts.length} team stats records`);
    }

    // Upsert global stats
    const globalUpserts: {
      player_id: string;
      games_played: number;
      games_won: number;
      games_lost: number;
      games_drawn: number;
      goals_for: number;
      goals_against: number;
      alpha_count: number;
      beta_count: number;
      gamma_count: number;
      delta_count: number;
    }[] = [];

    for (const [playerId, stats] of globalStats) {
      globalUpserts.push({
        player_id: playerId,
        games_played: stats.wins + stats.losses + stats.draws,
        games_won: stats.wins,
        games_lost: stats.losses,
        games_drawn: stats.draws,
        goals_for: stats.goalsFor,
        goals_against: stats.goalsAgainst,
        alpha_count: stats.alphaCount,
        beta_count: stats.betaCount,
        gamma_count: stats.gammaCount,
        delta_count: stats.deltaCount,
      });
    }

    if (globalUpserts.length > 0) {
      const { error } = await supabase
        .from("player_stats_global")
        .upsert(globalUpserts, { onConflict: "player_id" });

      if (error) {
        console.error("Error upserting global stats:", error);
        throw error;
      }
      console.log(`Upserted ${globalUpserts.length} global stats records`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        team_stats_count: teamUpserts.length,
        global_stats_count: globalUpserts.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sync-stats error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
