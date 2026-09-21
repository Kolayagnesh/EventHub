import React, { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

export const SeatBadge = ({ seat, isSelected, onToggle, disabled }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const status = String(seat.status || 'AVAILABLE').toUpperCase();
  const isConfirmed = status === 'CONFIRMED' || status === 'BOOKED';
  const isLocked = status === 'LOCKED';
  const isUnavailable = isConfirmed || isLocked;
  const statusLabel = isConfirmed ? 'Confirmed' : isLocked ? 'Locked' : 'Available';
  const statusNotation = isSelected ? 'S' : isConfirmed ? 'C' : isLocked ? 'L' : 'A';

  // Section Color Themes
  const getSectionBadgeColor = () => {
    if (seat.venueSectionId === 1 || (seat.fullSeatCode && seat.fullSeatCode.startsWith('VIP'))) {
      return 'border-purple-500/40 text-purple-300 hover:border-purple-400 hover:bg-purple-950/30';
    }
    if (seat.venueSectionId === 2 || (seat.fullSeatCode && seat.fullSeatCode.startsWith('Grandstand'))) {
      return 'border-sky-500/40 text-sky-300 hover:border-sky-400 hover:bg-sky-950/30';
    }
    return 'border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/30';
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(seat.price || 0);

  if (isUnavailable) {
    return (
      <div
        className="relative group inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          type="button"
          disabled
          aria-label={`Seat ${seat.rowLabel}${seat.seatNumber} is ${statusLabel.toLowerCase()}`}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md border flex flex-col items-center justify-center cursor-not-allowed shadow-inner transition-all select-none ${
            isConfirmed
              ? 'bg-rose-950/80 border-rose-700/70 text-rose-200'
              : 'reserved-hatch-pattern border-amber-700/70 text-amber-200'
          }`}
        >
          {isConfirmed ? <ShieldAlert className="w-3.5 h-3.5 mb-0.5" /> : <Lock className="w-3.5 h-3.5 mb-0.5" />}
          <span className="text-[9px] font-bold leading-none">
            {statusNotation}
          </span>
          <span className="text-[8px] leading-none opacity-75">{seat.seatNumber}</span>
        </button>

        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md z-30 pointer-events-none text-left animate-fadeIn">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isConfirmed ? 'text-rose-300' : 'text-amber-300'}`}>
              {isConfirmed ? <ShieldAlert className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{statusLabel}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">{seat.fullSeatCode}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">This seat is unavailable for selection.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative group inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(seat)}
        aria-label={`Select seat ${seat.rowLabel}${seat.seatNumber} for ${formattedPrice}`}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-200 select-none font-mono ${
          isSelected
            ? 'bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border-2 border-cyan-300 scale-110 -translate-y-1 shadow-glow ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 z-10'
            : `bg-slate-900/90 border-2 hover:scale-105 active:scale-95 ${getSectionBadgeColor()}`
        }`}
      >
        {isSelected ? (
          <>
            <span className="text-[9px] font-bold tracking-tight text-cyan-100 leading-none">S</span>
            <span className="text-[8px] font-bold tracking-tight text-white leading-none">{seat.seatNumber}</span>
          </>
        ) : (
          <>
            <span className="text-[9px] font-bold leading-none">A</span>
            <span className="text-[8px] leading-none">{seat.seatNumber}</span>
          </>
        )}
      </button>

      {/* Rich Interactive Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-900/95 border border-indigo-500/40 rounded-xl shadow-2xl backdrop-blur-md z-30 pointer-events-none text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{seat.fullSeatCode}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isSelected ? 'bg-indigo-500 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {isSelected ? 'SELECTED' : 'AVAILABLE'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between border-t border-slate-800 pt-1.5">
            <span className="text-[11px] text-slate-400">Price / Seat:</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{formattedPrice}</span>
          </div>

          {seat.perks && (
            <p className="mt-1 text-[10px] text-indigo-300/90 italic line-clamp-2">
              {seat.perks}
            </p>
          )}

          <div className="mt-1.5 text-[9px] text-slate-400 text-center font-sans">
            {isSelected ? 'Click to unselect' : 'Click to add to reservation'}
          </div>
        </div>
      )}
    </div>
  );
};
