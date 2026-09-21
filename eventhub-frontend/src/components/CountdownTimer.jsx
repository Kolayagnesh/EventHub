import React, { useState, useEffect } from 'react';
import { Timer, AlertTriangle, Flame } from 'lucide-react';

export const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeftMs(0);
        if (onExpire) onExpire();
      } else {
        setTimeLeftMs(difference);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Thresholds:
  // Under 30s: Flashing Rose
  // Under 2m (120s): Amber warning
  // Normal: Indigo/Emerald
  const isDanger = totalSeconds <= 30 && totalSeconds > 0;
  const isWarning = totalSeconds <= 120 && totalSeconds > 30;
  const isExpired = totalSeconds === 0;

  return (
    <div
      className={`relative inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300 font-mono ${
        isExpired
          ? 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-lg shadow-rose-950/50'
          : isDanger
          ? 'bg-rose-950/60 border-rose-500 text-rose-200 animate-pulse shadow-glow-rose ring-2 ring-rose-500/50'
          : isWarning
          ? 'bg-amber-950/50 border-amber-500 text-amber-200 shadow-lg shadow-amber-950/40'
          : 'bg-slate-900 border-indigo-500/40 text-indigo-200 shadow-lg shadow-indigo-950/30'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {isDanger ? (
          <Flame className="w-5 h-5 text-rose-400 animate-bounce" />
        ) : isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
        ) : (
          <Timer className="w-5 h-5 text-indigo-400" />
        )}

        <span className="text-xs uppercase font-sans font-semibold tracking-wider text-slate-400">
          {isExpired ? 'Reservation expired' : 'Time remaining:'}
        </span>
      </div>

      <span className="text-lg font-bold tracking-widest font-mono">
        {formattedTime}
      </span>

      {!isExpired && (
        <span className="hidden sm:inline text-[11px] text-slate-400 font-sans">
          (reservation hold)
        </span>
      )}
    </div>
  );
};
