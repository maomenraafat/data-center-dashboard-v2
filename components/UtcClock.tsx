"use client";

import { useEffect, useState } from "react";

export default function UtcClock() {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      const cairoTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());

      setTime(cairoTime);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <p className="font-code-sm text-headline-md leading-none text-primary">{time}</p>
      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-headline-md">
        Egypt Local
      </p>
    </div>
  );
}
