import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FIFA_CLUBS, invalidateClubOverridesCache } from "@/data/clubs";
import { Club } from "@/types/tournament";
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_EMAIL = "zivkad12@gmail.com";

const STAR_OPTIONS = [
  { value: "0.5", label: "0.5" },
  { value: "1", label: "1" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2" },
  { value: "2.5", label: "2.5" },
  { value: "3", label: "3" },
  { value: "3.5", label: "3.5" },
  { value: "4", label: "4" },
  { value: "4.5", label: "4.5" },
  { value: "5", label: "5" },
];

// League order for display
const LEAGUE_ORDER = [
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Portugal",
  "Netherlands",
  "Turkey",
  "Saudi Arabia",
  "Argentina",
  "Czech Republic",
  "Greece",
  "International",
  "Prime",
];

const LEAGUE_FLAGS: Record<string, string> = {
  "Premier League": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "La Liga": "🇪🇸",
  "Bundesliga": "🇩🇪",
  "Serie A": "🇮🇹",
  "Ligue 1": "🇫🇷",
  "Portugal": "🇵🇹",
  "Netherlands": "🇳🇱",
  "Turkey": "🇹🇷",
  "Saudi Arabia": "🇸🇦",
  "Argentina": "🇦🇷",
  "Czech Republic": "🇨🇿",
  "Greece": "🇬🇷",
  "International": "🌍",
  "Prime": "🏆",
};

type ClubOverride = {
  club_id: string;
  stars: number;
};

export default function AdminClubs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [localChanges, setLocalChanges] = useState<Record<string, number>>({});

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        navigate("/");
        return;
      }
      setIsAuthorized(true);
      loadOverrides();
    };
    checkAuth();
  }, [navigate]);

  const loadOverrides = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("club_overrides")
        .select("club_id, stars");
      
      if (error) {
        console.error("Error loading overrides:", error);
        toast({
          title: "שגיאה בטעינת הנתונים",
          variant: "destructive",
        });
        return;
      }
      
      const map: Record<string, number> = {};
      (data || []).forEach((row: ClubOverride) => {
        map[row.club_id] = row.stars;
      });
      setOverrides(map);
    } finally {
      setIsLoading(false);
    }
  };

  const getStarsForClub = (club: Club): number => {
    // Local changes take priority, then saved overrides, then default
    if (localChanges[club.id] !== undefined) return localChanges[club.id];
    if (overrides[club.id] !== undefined) return overrides[club.id];
    return club.stars;
  };

  const handleStarsChange = (clubId: string, value: string) => {
    setLocalChanges((prev) => ({
      ...prev,
      [clubId]: parseFloat(value),
    }));
  };

  const hasChanges = Object.keys(localChanges).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert all changes
      const upserts = Object.entries(localChanges).map(([club_id, stars]) => ({
        club_id,
        stars,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("club_overrides")
        .upsert(upserts, { onConflict: "club_id" });

      if (error) {
        throw error;
      }

      // Merge local changes into saved overrides
      setOverrides((prev) => ({ ...prev, ...localChanges }));
      setLocalChanges({});
      
      // Invalidate cache so other parts of app get fresh data
      invalidateClubOverridesCache();
      
      toast({
        title: "נשמר בהצלחה!",
        description: `עודכנו ${upserts.length} קבוצות`,
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "שגיאה בשמירה",
        description: error.message || "נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Group clubs by league
  const clubsByLeague = FIFA_CLUBS.reduce((acc, club) => {
    const league = club.league || "Other";
    if (!acc[league]) acc[league] = [];
    acc[league].push(club);
    return acc;
  }, {} as Record<string, Club[]>);

  // Sort leagues by order, unknown leagues at end
  const sortedLeagues = Object.keys(clubsByLeague).sort((a, b) => {
    const aIdx = LEAGUE_ORDER.indexOf(a);
    const bIdx = LEAGUE_ORDER.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  if (!isAuthorized) {
    return null;
  }

  const renderStars = (count: number) => {
    const fullStars = Math.floor(count);
    const hasHalf = count % 1 !== 0;
    return (
      <span className="text-yellow-400 text-xs">
        {"★".repeat(fullStars)}
        {hasHalf && "½"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            ניהול קבוצות
          </h1>
          <Button
            variant="gaming"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            שמור
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          sortedLeagues.map((league) => (
            <div
              key={league}
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <h2 className="font-semibold flex items-center gap-2">
                  <span>{LEAGUE_FLAGS[league] || "⚽"}</span>
                  {league === "International" ? "נבחרות (International)" : league}
                </h2>
              </div>
              <div className="divide-y divide-border">
                {clubsByLeague[league].map((club) => {
                  const currentStars = getStarsForClub(club);
                  const isModified =
                    localChanges[club.id] !== undefined ||
                    (overrides[club.id] !== undefined && overrides[club.id] !== club.stars);

                  return (
                    <div
                      key={club.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{club.name}</span>
                        {isModified && (
                          <span className="text-xs text-muted-foreground">
                            (מקורי: {renderStars(club.stars)})
                          </span>
                        )}
                      </div>
                      <Select
                        value={currentStars.toString()}
                        onValueChange={(val) => handleStarsChange(club.id, val)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue>
                            {renderStars(currentStars)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STAR_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {renderStars(parseFloat(opt.value))} ({opt.label})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Bottom save button for mobile */}
        {hasChanges && (
          <div className="sticky bottom-4 flex justify-center">
            <Button
              variant="gaming"
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 shadow-lg"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              שמור {Object.keys(localChanges).length} שינויים
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
