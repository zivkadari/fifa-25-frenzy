import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  stars: number;
  size?: "xs" | "sm" | "md";
  /** Use neon-green color scheme instead of yellow */
  neonGreen?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
  md: "h-4 w-4",
};

/**
 * Unified star-rating display.
 * - 5   → ★★★★★
 * - 4.5 → ★★★★½  (half-filled fifth star)
 * - 4   → ★★★★
 */
export const StarRating = ({ stars, size = "sm", neonGreen = false, className }: StarRatingProps) => {
  const fullCount = Math.floor(stars);
  const hasHalf = stars % 1 !== 0;
  const sizeClass = sizeClasses[size];

  const fillClass = neonGreen ? "fill-neon-green text-neon-green" : "fill-yellow-400 text-yellow-400";
  const emptyClass = neonGreen ? "text-neon-green" : "text-yellow-400";

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: fullCount }).map((_, i) => (
        <Star key={i} className={cn(sizeClass, fillClass)} />
      ))}
      {hasHalf && (
        <span className={cn("relative inline-block", sizeClass)}>
          {/* Empty star background */}
          <Star className={cn(sizeClass, emptyClass, "absolute inset-0")} />
          {/* Filled left half */}
          <Star
            className={cn(sizeClass, fillClass, "absolute inset-0")}
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        </span>
      )}
    </span>
  );
};

/**
 * Text-based star string for contexts where icons aren't used (copy-to-clipboard, etc.)
 */
export const starText = (stars: number): string => {
  const full = Math.floor(stars);
  const half = stars % 1 !== 0;
  return "★".repeat(full) + (half ? "½" : "");
};
