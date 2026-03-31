import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SOFIFA_BASE = "https://sofifa.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    if (!teamId) {
      return new Response(
        JSON.stringify({ error: "Missing teamId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try SoFIFA API first
    const apiUrl = `https://api.sofifa.net/team/${teamId}`;
    console.log(`Trying SoFIFA API: ${apiUrl}`);

    try {
      const apiRes = await fetch(apiUrl, {
        headers: { "Accept": "application/json", "User-Agent": "FIFANight/1.0" },
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        const squad = transformApiResponse(data, teamId);
        if (squad.players.length >= 11) {
          return new Response(JSON.stringify(squad), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch (e) {
      console.log("SoFIFA API failed, trying HTML scrape:", e);
    }

    // Fallback: try scraping the team page HTML
    const teamUrl = `${SOFIFA_BASE}/team/${teamId}`;
    console.log(`Trying SoFIFA page scrape: ${teamUrl}`);

    const pageRes = await fetch(teamUrl, {
      headers: {
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!pageRes.ok) {
      return new Response(
        JSON.stringify({ error: "SOFIFA_UNAVAILABLE", message: "שירות SoFIFA לא זמין כרגע. הגישה חסומה." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = await pageRes.text();

    if (html.includes("Just a moment") || html.includes("challenge-platform")) {
      return new Response(
        JSON.stringify({ error: "SOFIFA_BLOCKED", message: "SoFIFA חסום כרגע ע\"י Cloudflare. נסו שוב מאוחר יותר." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const squad = parseHtmlSquad(html, teamId);

    if (squad.players.length < 11) {
      return new Response(
        JSON.stringify({ error: "PARSE_ERROR", message: "לא הצלחנו לחלץ מספיק שחקנים מדף הקבוצה" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(squad), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("fetch-team-squad error:", msg);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ── Transform SoFIFA JSON API response ──
function transformApiResponse(data: any, teamId: string) {
  const t = data?.data ?? data;
  const players = (t?.players ?? t?.squad ?? []).map((p: any) => {
    const pos = p.positions ?? [];
    return {
      id: p.id,
      name: p.commonName || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
      shortName: p.commonName || p.lastName || `Player ${p.id}`,
      overallRating: p.overallRating ?? 70,
      position: pos[0] ?? "CM",
      altPositions: pos.slice(1),
      age: p.age ?? 25,
      pace: p.pace ?? 65, shooting: p.shooting ?? 55, passing: p.passing ?? 60,
      dribbling: p.dribbling ?? 60, defending: p.defending ?? 50, physical: p.physical ?? 60,
    };
  });
  return { teamId: parseInt(teamId), teamName: t?.name ?? `Team ${teamId}`, players, fetchedAt: Date.now() };
}

// ── Parse SoFIFA HTML squad table ──
function parseHtmlSquad(html: string, teamId: string) {
  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const teamName = nameMatch ? nameMatch[1].trim() : `Team ${teamId}`;

  const main = html.split(/On loan/i)[0] || html;
  const rows = main.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const players: any[] = [];

  for (const row of rows) {
    if (row.includes("<th")) continue;
    const link = row.match(/\/player\/(\d+)\/[^/"]*\/[^/"]*\/"?\s*(?:title="([^"]*)")?[^>]*>([^<]+)<\/a>/);
    if (!link) continue;

    const positions = (row.match(/\?pn=\d+[^>]*>([A-Z]{1,3})<\/a>/g) || [])
      .map(m => m.match(/>([A-Z]{1,3})<\/a>/)?.[1]).filter(Boolean) as string[];
    if (!positions.length) continue;

    const nums = [...row.matchAll(/<em>(\d+)<\/em>|_(\d+)_/g)].map(m => parseInt(m[1] || m[2]));
    const ovr = nums[1] || 70;
    const total = nums.length > 3 ? nums[nums.length - 1] : ovr * 12;
    const attrs = estimateAttrs(positions[0], ovr, total);

    players.push({
      id: parseInt(link[1]), name: link[2] || link[3], shortName: link[3].replace(/^[_C ]+/, "").trim(),
      overallRating: ovr, position: positions[0], altPositions: positions.slice(1),
      age: nums[0] || 25, ...attrs,
    });
  }

  return { teamId: parseInt(teamId), teamName, players, fetchedAt: Date.now() };
}

function estimateAttrs(pos: string, ovr: number, total: number) {
  const w: Record<string, number[]> = {
    GK: [.08,.04,.12,.04,.08,.10], CB: [.14,.08,.14,.10,.30,.24],
    RB: [.20,.10,.16,.14,.22,.18], LB: [.20,.10,.16,.14,.22,.18],
    CDM: [.14,.10,.20,.14,.24,.18], CM: [.16,.14,.22,.18,.16,.14],
    CAM: [.16,.18,.22,.22,.08,.14], RM: [.20,.14,.18,.20,.14,.14],
    LM: [.20,.14,.18,.20,.14,.14], RW: [.22,.18,.16,.22,.06,.16],
    LW: [.22,.18,.16,.22,.06,.16], ST: [.20,.24,.12,.18,.06,.20],
    CF: [.18,.22,.18,.20,.06,.16],
  };
  const d = w[pos] || w.CM;
  const s = d.reduce((a, b) => a + b, 0);
  const t = Math.round(total / 3.7);
  const f = ovr / 80;
  const c = (v: number) => Math.max(40, Math.min(99, v));
  return {
    pace: c(Math.round(d[0]/s*t*f/1.6)), shooting: c(Math.round(d[1]/s*t*f/1.6)),
    passing: c(Math.round(d[2]/s*t*f/1.6)), dribbling: c(Math.round(d[3]/s*t*f/1.6)),
    defending: c(Math.round(d[4]/s*t*f/1.6)), physical: c(Math.round(d[5]/s*t*f/1.6)),
  };
}
