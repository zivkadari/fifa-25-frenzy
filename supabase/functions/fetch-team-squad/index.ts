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

    // Fetch the SoFIFA team page HTML
    const teamUrl = `${SOFIFA_BASE}/team/${teamId}`;
    console.log(`Fetching SoFIFA team page: ${teamUrl}`);

    const response = await fetch(teamUrl, {
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(`SoFIFA page error [${response.status}]`);
      return new Response(
        JSON.stringify({ error: "SOFIFA_ERROR", message: `SoFIFA returned status ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    // Check for Cloudflare challenge
    if (html.includes("Just a moment") || html.includes("challenge-platform") || html.includes("cf-browser-verification")) {
      console.error("Cloudflare challenge detected");
      return new Response(
        JSON.stringify({ error: "SOFIFA_BLOCKED", message: "SoFIFA is currently protected by Cloudflare. Try again later." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse team name from HTML
    const teamNameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const teamName = teamNameMatch ? teamNameMatch[1].trim() : `Team ${teamId}`;

    // Parse the squad table
    const players = parseSquadFromHtml(html);

    if (players.length === 0) {
      return new Response(
        JSON.stringify({ error: "PARSE_ERROR", message: "Could not parse squad data from SoFIFA page" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const squad = {
      teamId: parseInt(teamId),
      teamName,
      players,
      fetchedAt: Date.now(),
    };

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

interface ParsedPlayer {
  id: number;
  name: string;
  shortName: string;
  overallRating: number;
  position: string;
  altPositions: string[];
  age: number;
  totalStats: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

function parseSquadFromHtml(html: string): ParsedPlayer[] {
  const players: ParsedPlayer[] = [];

  // The squad table rows have player data in this format:
  // Each row contains: player link (with ID), positions, age, overall rating, total stats
  // Pattern: /player/{id}/{slug}/{roster}/
  // Positions appear as text links like [CB](url), [RB](url), etc.
  
  // Find the squad section (before "On loan")
  const squadSection = html.split(/On loan/i)[0] || html;
  
  // Match player rows from the squad table
  // Each table row has: player link, positions, age, OVR, potential, contract info, value, wage, total stats
  const playerRegex = /\/player\/(\d+)\/[^"]*?"[^>]*>([^<]+)<\/a>.*?<\/td>/gs;
  
  // More robust: parse the squad table rows
  // Look for table body rows after "Squad" heading
  const tableRows = squadSection.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const row of tableRows) {
    // Skip header rows
    if (row.includes('<th')) continue;

    // Extract player ID and name from link
    const playerLinkMatch = row.match(/\/player\/(\d+)\/[^/"]*\/[^/"]*\/"?\s*(?:title="([^"]*)")?[^>]*>([^<]+)<\/a>/);
    if (!playerLinkMatch) continue;

    const playerId = parseInt(playerLinkMatch[1]);
    const fullName = playerLinkMatch[2] || playerLinkMatch[3];
    const shortName = playerLinkMatch[3].trim();

    // Extract positions - they appear as linked text like [GK], [CB], [RB], etc.
    const positionMatches = row.match(/\?pn=\d+[^>]*>([A-Z]{1,3})<\/a>/g) || [];
    const positions = positionMatches.map(m => {
      const posMatch = m.match(/>([A-Z]{1,3})<\/a>/);
      return posMatch ? posMatch[1] : '';
    }).filter(Boolean);

    // Extract numeric values: age, OVR, potential, total stats
    // These appear as italic text: <em>value</em> or _value_ in table cells
    const numericValues = [...row.matchAll(/<em>(\d+)<\/em>|_(\d+)_/g)].map(m => parseInt(m[1] || m[2]));

    // In the table format: age (0), OVR (1), potential (2), total stats (last)
    const age = numericValues[0] || 25;
    const ovr = numericValues[1] || 70;
    const totalStats = numericValues.length > 3 ? numericValues[numericValues.length - 1] : ovr * 12;

    if (positions.length === 0) continue;

    // Estimate individual attributes from total stats, OVR, and position
    const attrs = estimateAttributes(positions[0], ovr, totalStats);

    players.push({
      id: playerId,
      name: fullName || shortName,
      shortName: shortName.replace(/^[_C ]+/, '').trim(), // Remove captain marker
      overallRating: ovr,
      position: positions[0],
      altPositions: positions.slice(1),
      age,
      totalStats,
      ...attrs,
    });
  }

  return players;
}

/**
 * Estimate player face card attributes from total stats and primary position.
 * This is an approximation since the team page doesn't show individual attributes.
 */
function estimateAttributes(position: string, ovr: number, totalStats: number): {
  pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number;
} {
  // Total face card stats ≈ totalStats / 4.5 (rough ratio based on real data)
  // The sum of 6 face stats is roughly totalStats / 3.7
  const targetSum = Math.round(totalStats / 3.7);
  
  // Position-based attribute distribution weights
  const distributions: Record<string, number[]> = {
    // [pace, shooting, passing, dribbling, defending, physical]
    'GK':  [0.08, 0.04, 0.12, 0.04, 0.08, 0.10],
    'CB':  [0.14, 0.08, 0.14, 0.10, 0.30, 0.24],
    'RB':  [0.20, 0.10, 0.16, 0.14, 0.22, 0.18],
    'LB':  [0.20, 0.10, 0.16, 0.14, 0.22, 0.18],
    'RWB': [0.20, 0.10, 0.16, 0.14, 0.22, 0.18],
    'LWB': [0.20, 0.10, 0.16, 0.14, 0.22, 0.18],
    'CDM': [0.14, 0.10, 0.20, 0.14, 0.24, 0.18],
    'CM':  [0.16, 0.14, 0.22, 0.18, 0.16, 0.14],
    'CAM': [0.16, 0.18, 0.22, 0.22, 0.08, 0.14],
    'RM':  [0.20, 0.14, 0.18, 0.20, 0.14, 0.14],
    'LM':  [0.20, 0.14, 0.18, 0.20, 0.14, 0.14],
    'RW':  [0.22, 0.18, 0.16, 0.22, 0.06, 0.16],
    'LW':  [0.22, 0.18, 0.16, 0.22, 0.06, 0.16],
    'CF':  [0.18, 0.22, 0.18, 0.20, 0.06, 0.16],
    'ST':  [0.20, 0.24, 0.12, 0.18, 0.06, 0.20],
    'RF':  [0.20, 0.22, 0.16, 0.20, 0.06, 0.16],
    'LF':  [0.20, 0.22, 0.16, 0.20, 0.06, 0.16],
  };

  const weights = distributions[position] || distributions['CM'];
  const baseSum = weights.reduce((a, b) => a + b, 0);

  // Scale to match OVR as a rough guide
  const scale = ovr / 80; // normalize around OVR 80

  return {
    pace: clamp(Math.round(weights[0] / baseSum * targetSum * scale / 1.6)),
    shooting: clamp(Math.round(weights[1] / baseSum * targetSum * scale / 1.6)),
    passing: clamp(Math.round(weights[2] / baseSum * targetSum * scale / 1.6)),
    dribbling: clamp(Math.round(weights[3] / baseSum * targetSum * scale / 1.6)),
    defending: clamp(Math.round(weights[4] / baseSum * targetSum * scale / 1.6)),
    physical: clamp(Math.round(weights[5] / baseSum * targetSum * scale / 1.6)),
  };
}

function clamp(v: number, min = 40, max = 99): number {
  return Math.max(min, Math.min(max, v));
}
