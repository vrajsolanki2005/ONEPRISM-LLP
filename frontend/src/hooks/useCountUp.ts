import { useEffect, useRef, useState } from "react";

/** Smoothly animate a number from its previous value to the latest target. */
export function useCountUp(target: number, durationMs = 800): number {
  const [display, setDisplay] = useState(0);
  const previousRef = useRef(0);

  useEffect(() => {
    const from = previousRef.current;
    const to = Number.isFinite(target) ? target : 0;
    if (from === to) {
      setDisplay(to);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        previousRef.current = to;
      }
    };

    raf = requestAnimationFrame(step);
    return () => {
      previousRef.current = to;
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return display;
}
