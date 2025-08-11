import { Evening } from "@/types/tournament";
import { supabase } from "@/integrations/supabase/client";

const EVENINGS_TABLE = "evenings";
const TEAMS_TABLE = "teams";
const TEAM_PLAYERS_TABLE = "team_players";
const PLAYERS_TABLE = "players";

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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Optionally: console.log('Subscribed to evening:', eveningId)
        }
      });

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
      .single();
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
    // First, get player ids from team_players
    const { data: links, error: linkErr } = await supabase
      .from(TEAM_PLAYERS_TABLE)
      .select("player_id")
      .eq("team_id", teamId);
    if (linkErr || !links?.length) return [];
    const ids = links.map((l: any) => l.player_id);
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

    // Try to find existing player created by this user with same name
    const { data: existing } = await supabase
      .from(PLAYERS_TABLE)
      .select("id")
      .eq("display_name", name)
      .eq("created_by", user.id)
      .maybeSingle();

    let playerId = existing?.id as string | undefined;
    if (!playerId) {
      playerId = `player_${Math.random().toString(36).slice(2, 10)}`;
      const { error: insErr } = await supabase
        .from(PLAYERS_TABLE)
        .insert({ id: playerId, display_name: name, created_by: user.id });
      if (insErr) {
        console.error("addPlayerToTeamByName/insert player error:", insErr.message);
        return false;
      }
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
}

