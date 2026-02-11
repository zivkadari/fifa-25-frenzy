import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PoolConfig, PoolDistributionEntry, fetchPoolConfigs, invalidatePoolConfigCache } from "@/data/poolConfig";

const STAR_LABELS: Record<number, string> = { 5: "⭐5", 4.5: "⭐4.5", 4: "⭐4" };
const MAX_MATCHES: Record<number, number> = { 4: 7, 5: 9, 6: 11 };

const AdminPoolConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<PoolConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    invalidatePoolConfigCache();
    fetchPoolConfigs().then((data) => {
      setConfigs(data);
      setLoading(false);
    });
  }, []);

  const updateDistribution = (winsIdx: number, starIdx: number, field: keyof PoolDistributionEntry, value: any) => {
    setConfigs((prev) => {
      const updated = [...prev];
      const config = { ...updated[winsIdx] };
      const dist = [...config.distribution];
      dist[starIdx] = { ...dist[starIdx], [field]: value };
      config.distribution = dist;
      updated[winsIdx] = config;
      return updated;
    });
  };

  const updateConfig = (winsIdx: number, field: string, value: any) => {
    setConfigs((prev) => {
      const updated = [...prev];
      updated[winsIdx] = { ...updated[winsIdx], [field]: value };
      return updated;
    });
  };

  const getTotal = (config: PoolConfig) => {
    const distTotal = config.distribution.reduce((sum, d) => sum + d.count, 0);
    return distTotal + config.prime_count;
  };

  const handleSave = async () => {
    if (!supabase) return;

    // Validate totals
    for (const config of configs) {
      const total = getTotal(config);
      const max = MAX_MATCHES[config.wins_to_complete];
      if (total !== max) {
        toast({
          title: "שגיאת ולידציה",
          description: `${config.wins_to_complete} ניצחונות: סה"כ ${total} במקום ${max}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      for (const config of configs) {
        const { error } = await supabase
          .from("pairs_pool_config")
          .update({
            distribution: config.distribution as any,
            include_prime: config.include_prime,
            prime_count: config.prime_count,
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id);

        if (error) throw error;
      }

      invalidatePoolConfigCache();
      toast({ title: "נשמר בהצלחה!" });
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gaming-bg flex items-center justify-center text-foreground">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gaming-bg p-4 pb-8" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">הגדרת הרכב קבוצות</h1>
        </div>

        {configs.map((config, winsIdx) => {
          const total = getTotal(config);
          const max = MAX_MATCHES[config.wins_to_complete];
          const isValid = total === max;

          return (
            <Card key={config.id} className="border-neon-green/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{config.wins_to_complete} ניצחונות ({max} משחקים)</span>
                  <span className={`text-sm ${isValid ? "text-neon-green" : "text-destructive"}`}>
                    {total}/{max}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.distribution.map((entry, starIdx) => (
                  <div key={entry.stars} className="flex items-center gap-3">
                    <span className="w-16 text-sm font-medium">{STAR_LABELS[entry.stars]}</span>
                    <Input
                      type="number"
                      min={0}
                      max={max}
                      value={entry.count}
                      onChange={(e) => updateDistribution(winsIdx, starIdx, "count", parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={entry.include_national}
                        onCheckedChange={(v) => updateDistribution(winsIdx, starIdx, "include_national", v)}
                      />
                      <Label className="text-xs">נבחרות</Label>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={config.include_prime}
                      onCheckedChange={(v) => {
                        updateConfig(winsIdx, "include_prime", v);
                        if (!v) updateConfig(winsIdx, "prime_count", 0);
                      }}
                    />
                    <Label className="text-xs">Prime</Label>
                  </div>
                  {config.include_prime && (
                    <Input
                      type="number"
                      min={0}
                      max={max}
                      value={config.prime_count}
                      onChange={(e) => updateConfig(winsIdx, "prime_count", parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button onClick={handleSave} disabled={saving} className="w-full mb-8" variant="gaming" size="lg">
          <Save className="h-5 w-5" />
          {saving ? "שומר..." : "שמור הכל"}
        </Button>
      </div>
    </div>
  );
};

export default AdminPoolConfig;
