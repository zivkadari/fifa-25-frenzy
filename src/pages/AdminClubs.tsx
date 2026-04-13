import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FIFA_CLUBS, invalidateClubOverridesCache } from "@/data/clubs";
import { Club } from "@/types/tournament";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Save, Star, Loader2, Search, SlidersHorizontal, X, ArrowUpDown,
  Trash2, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Belgium": "🇧🇪",
  "International": "🌍",
  "Prime": "🏆",
};

type SortOption = "alpha-asc" | "alpha-desc" | "stars-asc" | "stars-desc" | "league";

const SORT_LABELS: Record<SortOption, string> = {
  "alpha-asc": "A → Z",
  "alpha-desc": "Z → A",
  "stars-asc": "כוכבים ↑",
  "stars-desc": "כוכבים ↓",
  "league": "לפי ליגה",
};

type ClubOverride = { club_id: string; stars: number; deleted?: boolean };
type ViewMode = "active" | "deleted";

export default function AdminClubs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [localChanges, setLocalChanges] = useState<Record<string, number>>({});

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("active");

  // Filter/sort state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("league");
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [filterLeague, setFilterLeague] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "club" | "national">("all");
  const [filterModified, setFilterModified] = useState(false);
  const [filterDefaultAdded, setFilterDefaultAdded] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }
      const { data: isAdmin } = await supabase.rpc("is_clubs_admin", { user_id: user.id });
      if (!isAdmin) { navigate("/"); return; }
      setIsAuthorized(true);
      loadOverrides();
    };
    checkAuth();
  }, [navigate]);

  const loadOverrides = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("club_overrides").select("club_id, stars, deleted");
      if (error) {
        toast({ title: "שגיאה בטעינת הנתונים", variant: "destructive" });
        return;
      }
      const map: Record<string, number> = {};
      const deleted = new Set<string>();
      (data || []).forEach((row: ClubOverride) => {
        map[row.club_id] = row.stars;
        if (row.deleted) deleted.add(row.club_id);
      });
      setOverrides(map);
      setDeletedIds(deleted);
    } finally {
      setIsLoading(false);
    }
  };

  const getStarsForClub = (club: Club): number => {
    if (localChanges[club.id] !== undefined) return localChanges[club.id];
    if (overrides[club.id] !== undefined) return overrides[club.id];
    return club.stars;
  };

  const isModifiedClub = (club: Club): boolean =>
    localChanges[club.id] !== undefined ||
    (overrides[club.id] !== undefined && overrides[club.id] !== club.stars);

  const handleStarsChange = (clubId: string, value: string) => {
    setLocalChanges((prev) => ({ ...prev, [clubId]: parseFloat(value) }));
  };

  const hasChanges = Object.keys(localChanges).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const upserts = Object.entries(localChanges).map(([club_id, stars]) => ({
        club_id, stars, updated_by: user.id, updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("club_overrides").upsert(upserts, { onConflict: "club_id" });
      if (error) throw error;
      setOverrides((prev) => ({ ...prev, ...localChanges }));
      setLocalChanges({});
      invalidateClubOverridesCache();
      toast({ title: "נשמר בהצלחה!", description: `עודכנו ${upserts.length} קבוצות` });
    } catch (error: any) {
      toast({ title: "שגיאה בשמירה", description: error.message || "נסה שוב", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSoftDelete = async (club: Club) => {
    if (!window.confirm(`האם למחוק את ${club.name} מהרשימה הפעילה?`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const currentStars = getStarsForClub(club);
      const { error } = await supabase.from("club_overrides").upsert({
        club_id: club.id, stars: currentStars, deleted: true,
        updated_by: user.id, updated_at: new Date().toISOString(),
      }, { onConflict: "club_id" });
      if (error) throw error;
      setDeletedIds((prev) => new Set(prev).add(club.id));
      invalidateClubOverridesCache();
      toast({ title: "קבוצה הוסרה", description: `${club.name} הועברה לרשימת הקבוצות המוסרות` });
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    }
  };

  const handleRestore = async (club: Club) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("club_overrides").upsert({
        club_id: club.id, stars: getStarsForClub(club), deleted: false,
        updated_by: user.id, updated_at: new Date().toISOString(),
      }, { onConflict: "club_id" });
      if (error) throw error;
      setDeletedIds((prev) => { const n = new Set(prev); n.delete(club.id); return n; });
      invalidateClubOverridesCache();
      toast({ title: "קבוצה שוחזרה", description: `${club.name} חזרה לרשימה הפעילה` });
    } catch (error: any) {
      toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    }
  };

  // Derived data
  const allLeagues = useMemo(() => {
    const set = new Set<string>();
    FIFA_CLUBS.forEach((c) => { if (c.league) set.add(c.league); });
    return Array.from(set).sort();
  }, []);

  const allStarValues = useMemo(() => {
    const set = new Set<number>();
    FIFA_CLUBS.forEach((c) => set.add(c.stars));
    return Array.from(set).sort((a, b) => b - a);
  }, []);

  const filteredAndSorted = useMemo(() => {
    // Split by view mode
    let clubs = FIFA_CLUBS.filter((c) =>
      viewMode === "deleted" ? deletedIds.has(c.id) : !deletedIds.has(c.id)
    );

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      clubs = clubs.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.league || "").toLowerCase().includes(q)
      );
    }

    // Filter by stars
    if (filterStars !== null) {
      clubs = clubs.filter((c) => getStarsForClub(c) === filterStars);
    }

    // Filter by league
    if (filterLeague) {
      clubs = clubs.filter((c) => c.league === filterLeague);
    }

    // Filter by type
    if (filterType === "national") {
      clubs = clubs.filter((c) => c.league === "International");
    } else if (filterType === "club") {
      clubs = clubs.filter((c) => c.league !== "International");
    }

    // Filter modified only
    if (filterModified) {
      clubs = clubs.filter((c) => isModifiedClub(c));
    }

    // Filter default-added only
    if (filterDefaultAdded) {
      clubs = clubs.filter((c) => c.defaultAdded);
    }

    // Sort
    switch (sortBy) {
      case "alpha-asc":
        clubs.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "alpha-desc":
        clubs.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "stars-asc":
        clubs.sort((a, b) => getStarsForClub(a) - getStarsForClub(b) || a.name.localeCompare(b.name));
        break;
      case "stars-desc":
        clubs.sort((a, b) => getStarsForClub(b) - getStarsForClub(a) || a.name.localeCompare(b.name));
        break;
      case "league":
        clubs.sort((a, b) => {
          const leagueCompare = (a.league || "").localeCompare(b.league || "");
          if (leagueCompare !== 0) return leagueCompare;
          const starsCompare = getStarsForClub(b) - getStarsForClub(a);
          if (starsCompare !== 0) return starsCompare;
          return a.name.localeCompare(b.name);
        });
        break;
    }

    return clubs;
  }, [search, filterStars, filterLeague, filterType, filterModified, filterDefaultAdded, sortBy, overrides, localChanges, viewMode, deletedIds]);

  const activeFilterCount = [
    filterStars !== null,
    filterLeague !== null,
    filterType !== "all",
    filterModified,
    filterDefaultAdded,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterStars(null);
    setFilterLeague(null);
    setFilterType("all");
    setFilterModified(false);
    setFilterDefaultAdded(false);
    setSearch("");
  };

  const renderStars = (count: number) => <StarRating stars={count} size="sm" />;

  const deletedCount = deletedIds.size;

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            ניהול קבוצות
          </h1>
          <Button variant="gaming" size="sm" onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            שמור
          </Button>
        </div>

        {/* Active / Deleted tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); clearAllFilters(); }}>
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1 gap-1">
                פעילות
                <Badge variant="secondary" className="h-5 min-w-[1.25rem] px-1 text-[10px]">
                  {FIFA_CLUBS.length - deletedCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="deleted" className="flex-1 gap-1">
                <Trash2 className="h-3.5 w-3.5" />
                מוסרות
                {deletedCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[1.25rem] px-1 text-[10px]">
                    {deletedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search + Filter/Sort bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="חפש קבוצה או ליגה..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 h-9"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-auto h-9 gap-1 px-3">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter button (active view only) */}
            {viewMode === "active" && (
              <Button
                variant={activeFilterCount > 0 ? "default" : "outline"}
                size="sm"
                className="h-9 gap-1 px-3"
                onClick={() => setFilterSheetOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                סינון
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && viewMode === "active" && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {filterStars !== null && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterStars(null)}>
                  {renderStars(filterStars)} {filterStars}★
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {filterLeague && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterLeague(null)}>
                  {LEAGUE_FLAGS[filterLeague] || "⚽"} {filterLeague}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {filterType !== "all" && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterType("all")}>
                  {filterType === "national" ? "🌍 נבחרות" : "🏟️ מועדונים"}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {filterModified && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterModified(false)}>
                  ✏️ שונו
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {filterDefaultAdded && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilterDefaultAdded(false)}>
                  🆕 נוספו אוטומטית
                  <X className="h-3 w-3" />
                </Badge>
              )}
              <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                נקה הכל
              </button>
            </div>
          )}

          {/* Results count */}
          <div className="text-xs text-muted-foreground">
            {filteredAndSorted.length} קבוצות
            {viewMode === "active" && filteredAndSorted.length !== (FIFA_CLUBS.length - deletedCount) && ` מתוך ${FIFA_CLUBS.length - deletedCount}`}
          </div>
        </div>
      </div>

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle>סינון קבוצות</SheetTitle>
            <SheetDescription>בחר פילטרים כדי לצמצם את הרשימה</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 mt-4">
            {/* Stars filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">כוכבים</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStars === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStars(null)}
                >
                  הכל
                </Button>
                {allStarValues.map((s) => (
                  <Button
                    key={s}
                    variant={filterStars === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStars(filterStars === s ? null : s)}
                  >
                    {s}★
                  </Button>
                ))}
              </div>
            </div>

            {/* League filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">ליגה</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterLeague === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterLeague(null)}
                >
                  הכל
                </Button>
                {allLeagues.map((league) => (
                  <Button
                    key={league}
                    variant={filterLeague === league ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterLeague(filterLeague === league ? null : league)}
                    className="gap-1"
                  >
                    {LEAGUE_FLAGS[league] || "⚽"} {league}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">סוג</h3>
              <div className="flex flex-wrap gap-2">
                {([["all", "הכל"], ["club", "🏟️ מועדונים"], ["national", "🌍 נבחרות"]] as const).map(([val, label]) => (
                  <Button
                    key={val}
                    variant={filterType === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(val)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Modified filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">מצב</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!filterModified ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterModified(false)}
                >
                  הכל
                </Button>
                <Button
                  variant={filterModified ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterModified(!filterModified)}
                >
                  ✏️ שונו בלבד
                </Button>
                <Button
                  variant={filterDefaultAdded ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDefaultAdded(!filterDefaultAdded)}
                >
                  🆕 נוספו אוטומטית
                </Button>
              </div>
            </div>

            {/* Quick filters */}
            <div>
              <h3 className="text-sm font-medium mb-2">מהיר</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setFilterStars(null); setFilterLeague(null); setFilterType("all"); setFilterModified(false); setFilterSheetOpen(false); setSortBy("stars-desc"); setFilterStars(4); }}
                >
                  4★+ (כשירות לטורניר)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { clearAllFilters(); setFilterStars(3.5); setFilterSheetOpen(false); }}
                >
                  3.5★ (ברירת מחדל חדשות)
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { clearAllFilters(); setFilterSheetOpen(false); }}>
                נקה הכל
              </Button>
              <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>
                סגור
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">
              {viewMode === "deleted" ? "אין קבוצות מוסרות" : "לא נמצאו קבוצות"}
            </p>
            {viewMode === "active" && activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>נקה פילטרים</Button>
            )}
          </div>
        ) : (
          filteredAndSorted.map((club) => {
            const currentStars = getStarsForClub(club);
            const modified = isModifiedClub(club);
            const isDeleted = deletedIds.has(club.id);
            return (
              <div
                key={club.id}
                className={`flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/30 transition-colors gap-2 ${isDeleted ? "opacity-70" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs shrink-0">{LEAGUE_FLAGS[club.league || ""] || "⚽"}</span>
                  <span className="text-sm break-words">{club.name}</span>
                  {club.defaultAdded && !modified && !isDeleted && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0 border-blue-500/40 text-blue-400">חדש</Badge>
                  )}
                  {modified && !isDeleted && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      (מקורי: {renderStars(club.stars)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isDeleted ? (
                    <>
                      <span className="text-xs text-muted-foreground">{renderStars(currentStars)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-emerald-500 hover:text-emerald-400 border-emerald-500/30"
                        onClick={() => handleRestore(club)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        שחזר
                      </Button>
                    </>
                  ) : (
                    <>
                      <Select
                        value={currentStars.toString()}
                        onValueChange={(val) => handleStarsChange(club.id, val)}
                      >
                        <SelectTrigger className="w-[7.5rem] h-8 px-2">
                          <SelectValue>{renderStars(currentStars)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STAR_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {renderStars(parseFloat(opt.value))} ({opt.label})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleSoftDelete(club)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}

        {hasChanges && (
          <div className="sticky bottom-4 flex justify-center pt-4">
            <Button variant="gaming" size="lg" onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              שמור {Object.keys(localChanges).length} שינויים
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
