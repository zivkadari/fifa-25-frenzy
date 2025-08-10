import { Evening } from "@/types/tournament";
import { isSupabaseEnabled, supabase } from "@/lib/supabaseClient";

// Admin email allowed to delete. Others will be restricted by RLS on the server.
const ADMIN_EMAIL = "zivkad12@gmail.com";
const TABLE = "evenings";

type EveningRow = {
  id: string;
  owner_email: string | null;
  data: Evening;
  updated_at?: string;
};

export class RemoteStorageService {
  static isEnabled() {
    return isSupabaseEnabled();
  }

  static async saveEvening(evening: Evening, ownerEmail: string = ADMIN_EMAIL): Promise<void> {
    if (!this.isEnabled() || !supabase) return;
    const row: EveningRow = { id: evening.id, owner_email: ownerEmail, data: evening };
    const { error } = await supabase
      .from(TABLE)
      .upsert(row, { onConflict: "id" });
    if (error) console.error("Supabase saveEvening error:", error.message);
  }

  static async upsertEveningLive(evening: Evening, ownerEmail: string = ADMIN_EMAIL): Promise<void> {
    return this.saveEvening(evening, ownerEmail);
  }

  static async loadEvenings(): Promise<Evening[]> {
    if (!this.isEnabled() || !supabase) return [];
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
}
