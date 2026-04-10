import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Insight, ComparisonRow } from "@/services/insightGenerator";

interface InsightCardsProps {
  insights: Insight[];
}

export default function InsightCards({ insights }: InsightCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  // Show 1-2 insights at a time
  const visibleCount = Math.min(2, insights.length);
  const visible = useMemo(() => {
    if (insights.length === 0) return [];
    const result: Insight[] = [];
    for (let i = 0; i < visibleCount; i++) {
      result.push(insights[(currentIndex + i) % insights.length]);
    }
    return result;
  }, [insights, currentIndex, visibleCount]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + visibleCount) % Math.max(1, insights.length));
  }, [insights.length, visibleCount]);

  const expandedInsight = expandedInsightId
    ? insights.find(i => i.id === expandedInsightId)
    : null;

  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          💡 תובנות
        </p>
        {insights.length > visibleCount && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] text-muted-foreground h-6 px-2"
            onClick={handleNext}
          >
            <RefreshCw className="h-3 w-3 ml-1" />
            תובנה אחרת
          </Button>
        )}
      </div>

      {visible.map(insight => (
        <Card
          key={insight.id}
          className="bg-gradient-card border-border/40 p-3 shadow-card"
        >
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
            <p className="text-xs text-foreground leading-relaxed flex-1">{insight.text}</p>
          </div>
          {insight.comparisonData && insight.comparisonData.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[10px] text-muted-foreground h-6 mt-2"
              onClick={() => setExpandedInsightId(
                expandedInsightId === insight.id ? null : insight.id
              )}
            >
              {expandedInsightId === insight.id
                ? <ChevronUp className="h-3 w-3 ml-1" />
                : <ChevronDown className="h-3 w-3 ml-1" />}
              השווה עם שחקנים אחרים
            </Button>
          )}
        </Card>
      ))}

      {/* Comparison Drawer */}
      <Drawer open={!!expandedInsight} onOpenChange={(open) => !open && setExpandedInsightId(null)}>
        <DrawerContent className="max-h-[60vh]" dir="rtl">
          <DrawerHeader>
            <DrawerTitle className="text-foreground text-right text-sm">
              {expandedInsight?.comparisonTitle || 'השוואה'}
            </DrawerTitle>
            <DrawerDescription className="text-right text-xs">
              השוואה בין כל השחקנים
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-2">
            {expandedInsight?.comparisonData?.map(row => (
              <div
                key={row.playerId}
                className={`flex items-center justify-between rounded-lg px-3 py-2 border text-sm ${
                  row.isSelected
                    ? 'bg-neon-green/10 border-neon-green/30'
                    : 'bg-gaming-surface/40 border-border/30'
                }`}
              >
                <span className={`font-medium ${row.isSelected ? 'text-neon-green' : 'text-foreground'}`}>
                  {row.playerName}
                  {row.isSelected && <span className="text-neon-green text-[9px] mr-1">●</span>}
                </span>
                <span className="text-foreground font-bold">{row.value}</span>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
