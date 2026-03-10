'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface WatermarkOverlayProps {
  studentName: string;
  studentPhone: string;
  intervalSeconds?: number;
}

const POSITIONS = [
  'top-4 start-4',
  'top-4 end-4',
  'bottom-4 start-4',
  'bottom-4 end-4',
  'top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2',
];

export function WatermarkOverlay({
  studentName,
  studentPhone,
  intervalSeconds = 8,
}: WatermarkOverlayProps) {
  const [positionIndex, setPositionIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPositionIndex((prev) => (prev + 1) % POSITIONS.length);
    }, Math.max(3, intervalSeconds) * 1000);

    return () => window.clearInterval(timer);
  }, [intervalSeconds]);

  const text = useMemo(() => `${studentName} • ${studentPhone}`, [studentName, studentPhone]);

  return (
    <div
      className={`pointer-events-none absolute ${POSITIONS[positionIndex]} z-20 transition-all duration-500`}
      aria-hidden="true"
    >
      <div className="rounded-md bg-black/50 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {text}
      </div>
    </div>
  );
}
