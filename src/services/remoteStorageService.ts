import { Evening, Player } from "@/types/tournament";
import { supabase } from "@/integrations/supabase/client";

const EVENINGS_TABLE = "evenings";
const TEAMS_TABLE = "teams";
const TEAM_PLAYERS_TABLE = "team_players";
const PLAYERS_TABLE = "players";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\u0590-\u05FF]+/g, "-").replace(/^-+|-+$/g, "");
}

type EveningRow = {
  id: string;
  owner_id: string;
  data: Evening;
  updated_at?: string;
  created_at?: string;
  team_id?: string | null;
};

export class RemoteStorageService {
  static isEnabled() {
    return Boolean(supabase);
  }

  // ========== Evenings ==========
  static async saveEvening(evening: Evening): Promise<void> {
    // Backward-compatible: saves without team relation
    return this.saveEveningWithTeam(evening, null);
  }

  static async saveEveningWithTeam(evening: Evening, teamId: string | null): Promise<void> {
    if (!supabase) return;
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return; // Not authenticated; skip remote save

    const row = { id: evening.id, owner_id: user.id, data: evening, team_id: teamId } as any;
    const { error } = await supabase
      .from(EVENINGS_TABLE)
      .upsert(row, { onConflict: "id" });
    if (error) console.error("Supabase saveEvening error:", error.message);
  }

  static async upsertEveningLive(evening: Evening): Promise<void> {
    return this.saveEveningWithTeam(evening, null);
  }

  static async upsertEveningLiveWithTeam(evening: Evening, teamId: string | null): Promise<void> {
    return this.saveEveningWithTeam(evening, teamId);
  }

  static async loadEvenings(): Promise<Evening[]> {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from(EVENINGS_TABLE)
      .select("data")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Supabase loadEvenings error:", error.message);
      return [];
    }
    return (data || []).map((r: any) => r.data as Evening);
  }

  static async loadEveningsByTeam(teamId: string): Promise<Evening[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(EVENINGS_TABLE)
      .select("data")
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Supabase loadEveningsByTeam error:", error.message);
      return [];
    }
    return (data || []).map((r: any) => r.data as Evening);
  }

  static async deleteEvening(eveningId: string): Promise<void> {
    if (!this.isEnabled() || !supabase) return;
    const { error } = await supabase
      .from(EVENINGS_TABLE)
      .delete()
      .eq("id", eveningId);
    if (error) console.error("Supabase deleteEvening error:", error.message);
  }

  // Subscribe to realtime changes for a specific evening id
  static subscribeToEvening(eveningId: string, onChange: (evening: Evening) => void) {
    if (!this.isEnabled() || !supabase) return () => {};

    const channel = supabase
      .channel(`evening:${eveningId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: EVENINGS_TABLE, filter: `id=eq.${eveningId}` },
        (payload: any) => {
          const newRow = (payload?.new as EveningRow) || null;
          if (newRow?.data) onChange(newRow.data);
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }

  static async getShareCode(eveningId: string): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(EVENINGS_TABLE)
      .select("share_code")
      .eq("id", eveningId)
      .maybeSingle();
    if (error) return null;
    return data?.share_code || null;
  }

  static async joinEveningByCode(code: string): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("join_evening_by_code", { _code: code });
    if (error) {
      console.error("joinEveningByCode error:", error.message);
      return null;
    }
    // data could be an array of rows returned
    const eid = Array.isArray(data) && data.length > 0 ? (data[0] as any).evening_id : null;
    return eid || null;
  }

  // ========== Teams ==========
  static async listTeams(): Promise<Array<{ id: string; name: string }>> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TEAMS_TABLE)
      .select("id, name")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("listTeams error:", error.message);
      return [];
    }
    return data as Array<{ id: string; name: string }>;
  }

  static async createTeam(name: string): Promise<{ id: string; name: string } | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from(TEAMS_TABLE)
      .insert({ name, owner_id: user.id })
      .select("id, name")
      .maybeSingle();
    if (error) {
      console.error("createTeam error:", error.message);
      return null;
    }
    return data as { id: string; name: string };
  }

  static async renameTeam(teamId: string, name: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from(TEAMS_TABLE)
      .update({ name })
      .eq("id", teamId);
    if (error) {
      console.error("renameTeam error:", error.message);
      return false;
    }
    return true;
  }

  static async deleteTeam(teamId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from(TEAMS_TABLE)
      .delete()
      .eq("id", teamId);
    if (error) {
      console.error("deleteTeam error:", error.message);
      return false;
    }
    return true;
  }

  // ========== Team Players ==========
  static async listTeamPlayers(teamId: string): Promise<Array<{ id: string; name: string }>> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TEAM_PLAYERS_TABLE)
      .select("player_id")
      .eq("team_id", teamId);
    if (error || !data?.length) return [];
    const ids = data.map((l: any) => l.player_id);
    const { data: players, error: pErr } = await supabase
      .from(PLAYERS_TABLE)
      .select("id, display_name")
      .in("id", ids);
    if (pErr) return [];
    return (players || []).map((p: any) => ({ id: p.id as string, name: p.display_name as string }));
  }

  static async addPlayerToTeamByName(teamId: string, name: string): Promise<boolean> {
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const playerId = `player-${slugify(name)}`;
    // Upsert player row
    const { error: upErr } = await supabase
      .from(PLAYERS_TABLE)
      .upsert({ id: playerId, display_name: name, created_by: user.id }, { onConflict: "id" });
    if (upErr) {
      console.error("addPlayerToTeamByName/insert player error:", upErr.message);
      return false;
    }

    const { error: linkInsertErr } = await supabase
      .from(TEAM_PLAYERS_TABLE)
      .insert({ team_id: teamId, player_id: playerId });
    if (linkInsertErr) {
      console.error("addPlayerToTeamByName/link error:", linkInsertErr.message);
      return false;
    }
    return true;
  }

  static async removePlayerFromTeam(teamId: string, playerId: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from(TEAM_PLAYERS_TABLE)
      .delete()
      .eq("team_id", teamId)
      .eq("player_id", playerId);
    if (error) {
      console.error("removePlayerFromTeam error:", error.message);
      return false;
    }
    return true;
  }

  // Ensure a reusable team exists for the given 4 players; return team_id
  static async ensureTeamForPlayers(players: Player[]): Promise<string | null> {
    if (!supabase || players.length !== 4) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Upsert players by deterministic id based on name
    const playerIds: string[] = [];
    for (const p of players) {
      const pid = `player-${slugify(p.name)}`;
      playerIds.push(pid);
      const { error: upErr } = await supabase
        .from(PLAYERS_TABLE)
        .upsert({ id: pid, display_name: p.name, created_by: user.id }, { onConflict: "id" });
      if (upErr) {
        console.error("ensureTeamForPlayers upsert player error:", upErr.message);
      }
    }

    // Try to find existing team owned by user with exactly these 4 players
    // 1) fetch teams of user
    const { data: teams, error: tErr } = await supabase
      .from(TEAMS_TABLE)
      .select("id, name")
      .eq("owner_id", user.id);
    if (tErr) {
      console.error("ensureTeamForPlayers teams fetch error:", tErr.message);
      return null;
    }
    if (teams && teams.length) {
      for (const t of teams as any[]) {
        const { data: links } = await supabase
          .from(TEAM_PLAYERS_TABLE)
          .select("player_id")
          .eq("team_id", t.id);
        const set = new Set((links || []).map((l: any) => l.player_id));
        const allMatch = playerIds.every((id) => set.has(id)) && set.size === 4;
        if (allMatch) return t.id as string;
      }
    }

    // Create new team with next number
    const nextNumber = (teams?.length || 0) + 1;
    const teamName = `קבוצה ${nextNumber}`;
    const { data: created, error: cErr } = await supabase
      .from(TEAMS_TABLE)
      .insert({ name: teamName, owner_id: user.id })
      .select("id")
      .maybeSingle();
    if (cErr || !created?.id) {
      console.error("ensureTeamForPlayers create team error:", cErr?.message);
      return null;
    }
    const teamId = created.id as string;

    const inserts = playerIds.map((pid) => ({ team_id: teamId, player_id: pid }));
    const { error: linkErr } = await supabase
      .from(TEAM_PLAYERS_TABLE)
      .insert(inserts);
    if (linkErr) {
      console.error("ensureTeamForPlayers link insert error:", linkErr.message);
    }

    return teamId;
  }
}

