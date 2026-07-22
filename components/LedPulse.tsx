"use client";

import { useEffect, useState } from "react";

/**
 * Renders `count` green LED dots and randomly dims one at a time,
 * mirroring the original page's setInterval-driven flicker effect.
 */
export default function LedPulse({ count = 2 }: { count?: number }) {
  const [dimmedIndex, setDimmedIndex] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const lucky = Math.floor(Math.random() * count);
      setDimmedIndex(lucky);
      const resetId = setTimeout(() => setDimmedIndex(null), 100);
      return () => clearTimeout(resetId);
    }, 3000);
    return () => clearInterval(id);
  }, [count]);

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[#10B981] led-glow-green"
          style={{ opacity: dimmedIndex === i ? 0.7 : 1 }}
        />
      ))}
    </>
  );
}
