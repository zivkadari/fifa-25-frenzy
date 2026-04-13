import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("team_id");

    if (!teamId || teamId.length === 0 || teamId.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid team_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch team name
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .maybeSingle();

    // Fetch all evenings for this team
    const { data: evenings, error } = await supabase
      .from("evenings")
      .select("id, data, share_code, updated_at, created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return new Response(JSON.stringify({ error: "Query error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to 5-player doubles mode only
    const fpEvenings = (evenings || []).filter((e) => {
      const d = e.data as Record<string, unknown>;
      return d && d.mode === "five-player-doubles";
    });

    const active = fpEvenings
      .filter((e) => {
        const d = e.data as Record<string, unknown>;
        return d.completed !== true;
      })
      .map((e) => ({
        id: e.id,
        share_code: e.share_code,
        data: e.data,
        updated_at: e.updated_at,
      }));

    const completed = fpEvenings
      .filter((e) => {
        const d = e.data as Record<string, unknown>;
        return d.completed === true;
      })
      .map((e) => ({
        id: e.id,
        share_code: e.share_code,
        data: e.data,
        updated_at: e.updated_at,
      }))
      .sort((a, b) => {
        const dateA = (a.data as Record<string, unknown>).date as string || "";
        const dateB = (b.data as Record<string, unknown>).date as string || "";
        return dateB.localeCompare(dateA);
      });

    return new Response(
      JSON.stringify({
        team_name: team?.name || null,
        active,
        completed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
