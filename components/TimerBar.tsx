"use client";

import React, { useEffect, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { sound } from "@/lib/sound";

interface TimerBarProps {
  remainingSeconds: number;
  totalSeconds: number;
  isPaused?: boolean;
  enableSound?: boolean;
}

export function TimerBar({ remainingSeconds, totalSeconds, isPaused, enableSound = true }: TimerBarProps) {
  const percentage = Math.max(0, Math.min(100, (remainingSeconds / (totalSeconds || 1)) * 100));
  const prevSecRef = useRef(remainingSeconds);

  // Play tick sound in the final 5 seconds
  useEffect(() => {
    if (enableSound && !isPaused && remainingSeconds <= 5 && remainingSeconds > 0 && remainingSeconds !== prevSecRef.current) {
      sound.playTick();
    }
    prevSecRef.current = remainingSeconds;
  }, [remainingSeconds, isPaused, enableSound]);

  const isCritical = remainingSeconds <= 5 && !isPaused;
  const isWarning = remainingSeconds <= Math.ceil(totalSeconds / 2) && !isCritical;

  let barBg = "bg-emerald-500";
  let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-300";
  let textColor = "text-emerald-700";

  if (isCritical) {
    barBg = "bg-rose-500";
    badgeColor = "bg-rose-100 text-rose-700 border-rose-400";
    textColor = "text-rose-600";
  } else if (isWarning) {
    barBg = "bg-amber-500";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
    textColor = "text-amber-700";
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-black font-heading ${badgeColor} ${
              isCritical ? "animate-pulse" : ""
            }`}
          >
            {isCritical ? (
              <AlertTriangle className="w-3.5 h-3.5 stroke-[3] text-rose-600 animate-bounce" />
            ) : (
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{isPaused ? "WAKTU DIJEDA" : isCritical ? "WAKTU HAMPIR HABIS!" : "SISA WAKTU"}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span
            className={`font-mono font-black text-2xl sm:text-3xl tabular-nums tracking-tight ${textColor} ${
              isCritical ? "scale-110 transition-transform animate-pulse" : ""
            }`}
          >
            {remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
          </span>
          <span className="text-xs font-black text-slate-400 font-mono">/{totalSeconds}s</span>
        </div>
      </div>

      {/* Chunky Progress Track */}
      <div className="relative w-full h-4 bg-slate-200 rounded-full p-0.5 border-2 border-slate-300 shadow-inner overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear shadow-sm ${barBg} ${
            isCritical ? "animate-pulse" : ""
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
