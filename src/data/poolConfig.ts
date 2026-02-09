import { supabase } from "@/integrations/supabase/client";

export interface PoolDistributionEntry {
  stars: number;
  count: number;
  include_national: boolean;
}

export interface PoolConfig {
  id: string;
  wins_to_complete: number;
  distribution: PoolDistributionEntry[];
  include_prime: boolean;
  prime_count: number;
}

// Default configs matching current hardcoded values
const DEFAULT_CONFIGS: PoolConfig[] = [
  {
    id: "default-4",
    wins_to_complete: 4,
    distribution: [
      { stars: 5, count: 2, include_national: true },
      { stars: 4.5, count: 3, include_national: true },
      { stars: 4, count: 2, include_national: false },
    ],
    include_prime: false,
    prime_count: 0,
  },
  {
    id: "default-5",
    wins_to_complete: 5,
    distribution: [
      { stars: 5, count: 3, include_national: true },
      { stars: 4.5, count: 3, include_national: true },
      { stars: 4, count: 2, include_national: false },
    ],
    include_prime: true,
    prime_count: 1,
  },
  {
    id: "default-6",
    wins_to_complete: 6,
    distribution: [
      { stars: 5, count: 3, include_national: true },
      { stars: 4.5, count: 4, include_national: true },
      { stars: 4, count: 4, include_national: false },
    ],
    include_prime: false,
    prime_count: 0,
  },
];

let cachedConfigs: PoolConfig[] | null = null;

export async function fetchPoolConfigs(): Promise<PoolConfig[]> {
  if (cachedConfigs) return cachedConfigs;

  if (!supabase) {
    console.warn("Supabase not connected, using default pool configs");
    return DEFAULT_CONFIGS;
  }

  try {
    const { data, error } = await supabase
      .from("pairs_pool_config")
      .select("*")
      .order("wins_to_complete");

    if (error || !data || data.length === 0) {
      console.warn("Failed to fetch pool configs, using defaults:", error?.message);
      return DEFAULT_CONFIGS;
    }

    cachedConfigs = data.map((row) => ({
      id: row.id,
      wins_to_complete: row.wins_to_complete,
      distribution: row.distribution as unknown as PoolDistributionEntry[],
      include_prime: row.include_prime,
      prime_count: row.prime_count,
    }));

    return cachedConfigs;
  } catch (e) {
    console.error("Error fetching pool configs:", e);
    return DEFAULT_CONFIGS;
  }
}

export function invalidatePoolConfigCache() {
  cachedConfigs = null;
}

export function getPoolConfigForWins(configs: PoolConfig[], wins: number): PoolConfig | undefined {
  return configs.find((c) => c.wins_to_complete === wins);
}
