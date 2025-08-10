import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface FitToScreenProps {
  children: React.ReactNode;
  maxScale?: number; // Upper limit to avoid upscaling
  minScale?: number; // Safety lower limit (optional)
}

/**
 * FitToScreen
 * Scales its children down so the full content fits within the current viewport
 * (both width and height), preventing the need for vertical/horizontal scrolling.
 *
 * Notes:
 * - Uses CSS transform scale for crisp, predictable shrinking.
 * - Recalculates on window resize/orientation change and when content size changes.
 */
export const FitToScreen: React.FC<FitToScreenProps> = ({ children, maxScale = 1, minScale = 0.5 }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    // Temporarily reset scale to measure intrinsic size
    el.style.transform = "scale(1)";
    el.style.transformOrigin = "top center";

    // Use scrollWidth/scrollHeight to capture full content size
    const contentWidth = el.scrollWidth || el.clientWidth;
    const contentHeight = el.scrollHeight || el.clientHeight;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaleX = vw / contentWidth;
    const scaleY = vh / contentHeight;

    const next = Math.min(maxScale, Math.max(minScale, Math.min(scaleX, scaleY)));
    setScale(next);
  }, [maxScale, minScale]);

  useLayoutEffect(() => {
    updateScale();
  }, [updateScale]);

  useEffect(() => {
    const handle = () => updateScale();
    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handle);

    let ro: ResizeObserver | null = null;
    if (contentRef.current && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => updateScale());
      ro.observe(contentRef.current);
    }
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
      if (ro) ro.disconnect();
    };
  }, [updateScale]);

  return (
    <div className="w-screen h-screen overflow-hidden flex items-start justify-center">
      <div
        ref={contentRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          // Ensure the outer container knows the effective height to keep content fully visible
          // We don't set explicit height to allow intrinsic sizing, transform handles visual fit
          willChange: "transform",
        }}
        className="pointer-events-auto"
      >
        {children}
      </div>
    </div>
  );
};

export default FitToScreen;
