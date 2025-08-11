import { Evening } from "@/types/tournament";
import { supabase } from "@/integrations/supabase/client";

const TABLE = "evenings";

type EveningRow = {
  id: string;
  owner_id: string;
  data: Evening;
  updated_at?: string;
  created_at?: string;
};

export class RemoteStorageService {
  static isEnabled() {
    return Boolean(supabase);
  }

  static async saveEvening(evening: Evening): Promise<void> {
    if (!supabase) return;
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return; // Not authenticated; skip remote save

    const row = { id: evening.id, owner_id: user.id, data: evening } as any;
    const { error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: "id" });
    if (error) console.error("Supabase saveEvening error:", error.message);
  }

  static async upsertEveningLive(evening: Evening): Promise<void> {
    return this.saveEvening(evening);
  }

  static async loadEvenings(): Promise<Evening[]> {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select("data")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Supabase loadEvenings error:", error.message);
      return [];
    }
    return (data || []).map((r: any) => r.data as Evening);
  }

  static async deleteEvening(eveningId: string): Promise<void> {
    if (!this.isEnabled() || !supabase) return;
    const { error } = await supabase
      .from(TABLE)
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
        { event: "UPDATE", schema: "public", table: TABLE, filter: `id=eq.${eveningId}` },
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
      .from(TABLE)
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
}
