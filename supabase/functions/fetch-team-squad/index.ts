import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SOFIFA_API_BASE = "https://api.sofifa.net";

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

    // Fetch from SoFIFA API
    const sofifaUrl = `${SOFIFA_API_BASE}/team/${teamId}`;
    console.log(`Fetching from SoFIFA: ${sofifaUrl}`);

    const response = await fetch(sofifaUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FIFANight/1.0",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`SoFIFA API error [${response.status}]: ${text.substring(0, 500)}`);

      // Check if it's a Cloudflare block
      if (text.includes("Cloudflare") || text.includes("challenge") || response.status === 403) {
        return new Response(
          JSON.stringify({
            error: "SOFIFA_BLOCKED",
            message: "SoFIFA API is currently unavailable (Cloudflare protection). Try again later.",
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "SOFIFA_ERROR", message: `SoFIFA returned status ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Transform the SoFIFA response into our standard format
    const squad = transformSofifaResponse(data, teamId);

    return new Response(
      JSON.stringify(squad),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error fetching team squad:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface SofifaPlayer {
  id: number;
  firstName?: string;
  lastName?: string;
  commonName?: string;
  overallRating?: number;
  positions?: string[];
  age?: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  // GK
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  speed?: number;
  positioning?: number;
}

function transformSofifaResponse(data: any, teamId: string) {
  const teamData = data?.data ?? data;
  const teamName = teamData?.name ?? `Team ${teamId}`;
  const players = teamData?.players ?? teamData?.squad ?? [];

  const transformedPlayers = players.map((p: SofifaPlayer) => {
    const name = p.commonName || `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || `Player ${p.id}`;
    const positions = p.positions ?? [];
    return {
      id: p.id,
      name: name,
      shortName: p.commonName || p.lastName || name,
      overallRating: p.overallRating ?? 70,
      position: positions[0] ?? 'CM',
      altPositions: positions.slice(1),
      age: p.age ?? 25,
      pace: p.pace ?? 65,
      shooting: p.shooting ?? 55,
      passing: p.passing ?? 60,
      dribbling: p.dribbling ?? 60,
      defending: p.defending ?? 50,
      physical: p.physical ?? 60,
      diving: p.diving,
      handling: p.handling,
      kicking: p.kicking,
      reflexes: p.reflexes,
      speed: p.speed,
      positioning: p.positioning,
    };
  });

  return {
    teamId: parseInt(teamId),
    teamName,
    players: transformedPlayers,
    fetchedAt: Date.now(),
  };
}
