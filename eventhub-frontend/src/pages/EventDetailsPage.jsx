import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { SeatBadge } from '../components/SeatBadge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Lock,
  Check,
  Armchair,
  ShieldAlert,
  Sparkles,
  Loader2,
  ChevronRight,
  Info,
  Layers,
} from 'lucide-react';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocking, setIsLocking] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    fetchEventAndSeats();
  }, [id]);

  const fetchEventAndSeats = async () => {
    setIsLoading(true);
    try {
      const [eventData, seatsData] = await Promise.all([
        api.events.getById(id),
        api.events.getSeats(id),
      ]);
      setEvent(eventData);
      setSeats(seatsData);
      if (eventData?.message || seatsData?.message) {
        addToast({
          title: 'Event updated',
          message: eventData?.message || seatsData?.message,
          type: 'info',
        });
      }
    } catch (err) {
      console.error('Error loading event and seats:', err);
      addToast({
        title: 'Unable to load event',
        message: err.response?.data?.message || err.message || 'Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSeatSelection = (seat) => {
    const status = String(seat.status || 'AVAILABLE').toUpperCase();
    if (status === 'CONFIRMED' || status === 'BOOKED' || status === 'LOCKED') return;

    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        // Enforce reasonable limit e.g. 6 seats per transaction
        if (prev.length >= 6) {
          addToast({
            title: 'Selection Limit',
            message: 'You can select up to 6 seats per booking reservation.',
            type: 'warning',
          });
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) return;

    if (!isAuthenticated) {
      addToast({
        title: 'Authentication Required',
        message: 'Please sign in to continue with your seat selection.',
        type: 'warning',
      });
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (!user?.email?.trim()) {
      addToast({
        title: 'Email Required',
        message: 'Your session does not contain an email address. Please sign in again.',
        type: 'warning',
      });
      return;
    }

    setIsLocking(true);

    try {
      const seatIds = selectedSeats.map((s) => s.id);
      const booking = await api.bookings.reserveSeats(id, seatIds, user.email.trim());

      addToast({
        title: 'Seats held',
        message: booking?.message || `Booking #${booking.id} is ready for checkout.`,
        type: 'success',
      });

      // Navigate directly to Checkout page with booking context
      navigate(`/checkout/${booking.id}`, { state: { booking, event, seats: selectedSeats } });
    } catch (err) {
      console.error('Seat reservation error:', err);
      const status = err.response?.status;
      let msg = 'One or more selected seats are currently locked by another customer. Please try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      }

      addToast({
        title: status === 409 ? '409 Conflict: Seats Locked' : 'Reservation Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsLocking(false);
    }
  };

  const totalPrice = selectedSeats.reduce((acc, s) => acc + (s.price || 0), 0);

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalPrice);

  // Group seats by Section
  const vipSeats = seats.filter(
    (s) => s.venueSectionId === 1 || (s.fullSeatCode && s.fullSeatCode.startsWith('VIP'))
  );
  const premiumSeats = seats.filter(
    (s) => s.venueSectionId === 2 || (s.fullSeatCode && s.fullSeatCode.startsWith('Grandstand'))
  );
  const generalSeats = seats.filter(
    (s) => s.venueSectionId === 3 || (s.fullSeatCode && s.fullSeatCode.startsWith('Bleachers'))
  );

  // Helper to group by rows within section
  const groupByRow = (seatList) => {
    const groupedRows = seatList.reduce((acc, seat) => {
      const row = seat.rowLabel || 'Row';
      if (!acc[row]) acc[row] = [];
      acc[row].push(seat);
      return acc;
    }, {});

    Object.values(groupedRows).forEach((rowSeats) => {
      rowSeats.sort((firstSeat, secondSeat) => (
        Number(firstSeat.seatNumber) - Number(secondSeat.seatNumber)
      ));
    });

    return groupedRows;
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-sm text-slate-400">Loading event details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* Back Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events Catalog</span>
        </Link>

      </div>

      {/* Event Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event #{event?.id}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {event?.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">{event?.description}</p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{new Date(event?.startTime).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{new Date(event?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{event?.venue?.name}, {event?.venue?.city}</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 shrink-0 flex flex-col items-center justify-center min-w-[200px]">
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Starting Price</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
              ₹{event?.startingPrice?.toLocaleString('en-IN') || '1,500'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Per Reserved Seat</span>
          </div>
        </div>
      </div>

      {/* Stadium Visualizer & Seat Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative">
        {/* Visual Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Armchair className="w-5 h-5 text-indigo-400" />
              <span>Interactive Stadium Blueprint</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your seats below. Held seats will be reserved for checkout.
            </p>
          </div>

          {/* Differentiated Forms Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            {/* Available */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <div className="w-5 h-5 rounded-lg border-2 border-emerald-500/60 bg-emerald-950/30 flex items-center justify-center text-[10px] text-emerald-300 font-bold">
                A
              </div>
              <span className="text-slate-300">Available</span>
            </div>

            {/* Form: Selected */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/60 shadow-glow">
              <div className="w-5 h-5 rounded-lg bg-indigo-600 border border-cyan-300 flex items-center justify-center text-[10px] text-white">
                <Check className="w-3 h-3 text-cyan-200 stroke-[3]" />
              </div>
              <span className="text-indigo-300 font-bold">Selected</span>
            </div>

            {/* Confirmed */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-rose-950/80">
              <div className="w-5 h-5 rounded-md bg-rose-950 border border-rose-700/60 flex items-center justify-center">
                <ShieldAlert className="w-3 h-3 text-rose-300" />
              </div>
              <span className="text-slate-300">Confirmed</span>
            </div>

            {/* Locked */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-700/40">
              <div className="w-5 h-5 rounded-md reserved-hatch-pattern border border-amber-700/60 flex items-center justify-center">
                <Lock className="w-3 h-3 text-amber-300" />
              </div>
              <span className="text-slate-300">Locked</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CURVED STADIUM STAGE / PITCH INDICATOR */}
        {/* ========================================================================= */}
        <div className="relative mb-14 text-center">
          <div className="relative mx-auto max-w-2xl">
            {/* Curved Stage Glowing Bar */}
            <div className="h-14 sm:h-16 rounded-t-full bg-gradient-to-b from-indigo-500/30 via-violet-600/20 to-transparent border-t-2 border-x-2 border-indigo-400/80 stadium-stage-glow flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent animate-pulse"></div>
              <div className="flex items-center gap-2 text-indigo-200 font-mono text-xs sm:text-sm font-black tracking-widest uppercase">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
                <span>STAGE / PITCH - DIRECT VIEW</span>
                <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
              </div>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-sans">
                Acoustic Frontline & Presentation Area
              </span>
            </div>

            {/* Acoustic Arc Lines */}
            <div className="w-full h-4 border-b border-indigo-500/20 rounded-[100%] mx-auto -mt-2"></div>
            <div className="w-5/6 h-4 border-b border-indigo-500/10 rounded-[100%] mx-auto -mt-2"></div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEATING SECTIONS */}
        {/* ========================================================================= */}
        <div className="space-y-12 max-w-5xl mx-auto">
          {/* 1. VIP PAVILION */}
          <div className="p-6 rounded-2xl vip-gradient border border-purple-500/30 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-950 border border-purple-500/50 text-purple-300 font-mono text-xs font-bold">
                  TIER 1
                </span>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  VIP Pavilion (Frontline Rows)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300">
                ₹6,500 / seat
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(groupByRow(vipSeats)).map(([row, seatRow]) => (
                <div key={row} className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="w-6 text-xs font-mono font-bold text-purple-400 text-right">
                    {row}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {seatRow.map((seat) => (
                      <SeatBadge
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeats.some((s) => s.id === seat.id)}
                        onToggle={toggleSeatSelection}
                        disabled={isLocking}
                      />
                    ))}
                  </div>
                  <span className="w-6 text-xs font-mono font-bold text-purple-400 text-left">
                    {row}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Central Stadium Aisle */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t border-dashed border-slate-800"></div>
            <span className="absolute px-4 bg-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Stadium Aisle & Access Stairwell
            </span>
          </div>

          {/* 2. PREMIUM GRANDSTAND */}
          <div className="p-6 rounded-2xl premium-gradient border border-sky-500/30 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-sky-950 border border-sky-500/50 text-sky-300 font-mono text-xs font-bold">
                  TIER 2
                </span>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Premium Grandstand (Mid Tier)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-sky-300">
                ₹3,500 / seat
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(groupByRow(premiumSeats)).map(([row, seatRow]) => (
                <div key={row} className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="w-6 text-xs font-mono font-bold text-sky-400 text-right">
                    {row}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {seatRow.map((seat) => (
                      <SeatBadge
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeats.some((s) => s.id === seat.id)}
                        onToggle={toggleSeatSelection}
                        disabled={isLocking}
                      />
                    ))}
                  </div>
                  <span className="w-6 text-xs font-mono font-bold text-sky-400 text-left">
                    {row}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. GENERAL BLEACHERS */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs font-bold">
                  TIER 3
                </span>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  General Bleachers (Panoramic Upper Deck)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ₹1,500 / seat
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(groupByRow(generalSeats)).map(([row, seatRow]) => (
                <div key={row} className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="w-6 text-xs font-mono font-bold text-slate-500 text-right">
                    {row}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {seatRow.map((seat) => (
                      <SeatBadge
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeats.some((s) => s.id === seat.id)}
                        onToggle={toggleSeatSelection}
                        disabled={isLocking}
                      />
                    ))}
                  </div>
                  <span className="w-6 text-xs font-mono font-bold text-slate-500 text-left">
                    {row}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM RESERVATION DRAWER */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-2xl px-4 sm:px-8 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Selected Seats Preview */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-mono font-bold text-lg shadow-glow shrink-0">
              {selectedSeats.length}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase">
                  {selectedSeats.length === 1 ? '1 Seat Selected' : `${selectedSeats.length} Seats Selected`}
                </span>
                {selectedSeats.length > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Ready to Lock
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-1 max-h-12 overflow-y-auto">
                {selectedSeats.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Click available seats in the stadium blueprint above
                  </span>
                ) : (
                  selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-950 text-indigo-200 border border-indigo-700"
                    >
                      {s.fullSeatCode}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Price & Lock CTA */}
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-mono block">Subtotal</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {formattedTotal}
              </span>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length === 0 || isLocking}
              onClick={handleReserveSeats}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/40 flex items-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Holding your seats...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Continue to checkout</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
