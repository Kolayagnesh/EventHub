import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { SeatBadge } from '../components/SeatBadge';
import { useAuth } from '../context/AuthContext';

export const SeatSelectionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSeats = async () => {
    try {
      const data = await api.events.getSeats(eventId);
      setSeats(data);
      setSelectedSeatIds((selectedIds) => (
        selectedIds.filter((id) => data.some((seat) => seat.id === id && seat.status === 'AVAILABLE'))
      ));
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to load the seat layout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  const toggleSeat = (seat) => {
    if (seat.status !== 'AVAILABLE') return;

    setSelectedSeatIds((selectedIds) => (
      selectedIds.includes(seat.id)
        ? selectedIds.filter((id) => id !== seat.id)
        : [...selectedIds, seat.id]
    ));
  };

  const handleCreateBooking = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login', { state: { from: { pathname: `/events/${eventId}/seats` } } });
      return;
    }

    setIsBooking(true);
    setErrorMessage('');

    try {
      const booking = await api.bookings.reserveSeats(eventId, selectedSeatIds, user.email);
      navigate(`/checkout/${booking.id}`, { state: { booking, seats: selectedSeats } });
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
        'One or more seats are currently locked or booked. Please choose other seats.'
      );
      fetchSeats();
    } finally {
      setIsBooking(false);
    }
  };

  const selectedSeats = seats.filter((seat) => selectedSeatIds.includes(seat.id));
  const totalPrice = selectedSeats.reduce((total, seat) => total + Number(seat.price || 0), 0);
  const seatsByRow = seats.reduce((rows, seat) => {
    const row = seat.rowLabel || 'Row';
    rows[row] = rows[row] || [];
    rows[row].push(seat);
    return rows;
  }, {});

  Object.values(seatsByRow).forEach((rowSeats) => {
    rowSeats.sort((firstSeat, secondSeat) => (
      Number(firstSeat.seatNumber) - Number(secondSeat.seatNumber)
    ));
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="mt-3 text-sm">Loading seat layout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-36">
      <div className="mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-indigo-400">Event seating</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Select your seats</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-6">
        <Legend color="bg-emerald-500/20 border-emerald-500/40" label="Available" />
        <Legend color="bg-indigo-600 border-indigo-500" label="Selected" />
        <Legend color="bg-amber-500/20 border-amber-500/40" label="In checkout" />
        <Legend color="bg-slate-800 border-slate-700" label="Booked" />
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="text-center py-3 text-xs font-semibold tracking-widest text-slate-400 uppercase rounded-t-xl border border-slate-700 bg-slate-800/60">
        Stage / Field
      </div>
      <div className="bg-slate-900 border border-slate-800 border-t-0 p-5 sm:p-8 rounded-b-xl overflow-x-auto">
        <div className="space-y-3 min-w-[520px]">
          {Object.entries(seatsByRow).map(([row, rowSeats]) => (
            <div key={row} className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="w-6 text-right text-xs font-mono font-bold text-slate-500">{row}</span>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {rowSeats.map((seat) => (
                  <SeatBadge
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeatIds.includes(seat.id)}
                    onToggle={toggleSeat}
                    disabled={isBooking}
                  />
                ))}
              </div>
              <span className="w-6 text-xs font-mono font-bold text-slate-500">{row}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-950/95 border-t border-slate-800 px-4 sm:px-8 py-4 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs text-slate-400 block">Selected: {selectedSeatIds.length} seats</span>
            <span className="text-2xl font-black text-white">₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>
          <button
            type="button"
            onClick={handleCreateBooking}
            disabled={selectedSeatIds.length === 0 || isBooking}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? 'Securing seats...' : 'Lock seats & proceed'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Legend = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <span className={`w-3 h-3 rounded-sm border ${color}`} />
    <span>{label}</span>
  </div>
);