import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Public edge function to fetch all completed 5-player doubles evenings
 * for the same owner as a given share code evening.
 * Returns only completed FP evenings (excluding the current one).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shareCode = url.searchParams.get("code");

    if (!shareCode || shareCode.length === 0 || shareCode.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleaned = shareCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]+$/.test(cleaned)) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // First, find the current evening to get its owner_id
    const { data: current, error: currentError } = await supabase
      .from("evenings")
      .select("id, owner_id, data")
      .eq("share_code", cleaned)
      .maybeSingle();

    if (currentError || !current) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all evenings from same owner
    const { data: allEvenings, error: allError } = await supabase
      .from("evenings")
      .select("id, data")
      .eq("owner_id", current.owner_id)
      .neq("id", current.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (allError) {
      return new Response(JSON.stringify({ error: "Query error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to only completed 5-player doubles evenings
    const fpHistory = (allEvenings || [])
      .filter((e) => {
        const d = e.data as Record<string, unknown>;
        return (
          d &&
          d.mode === "five-player-doubles" &&
          d.completed === true
        );
      })
      .map((e) => e.data);

    return new Response(JSON.stringify({ history: fpHistory }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
