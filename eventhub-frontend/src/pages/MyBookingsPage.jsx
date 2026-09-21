import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import {
  Ticket,
  Calendar,
  Clock,
  QrCode,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.bookings.getUserBookings();
      setBookings(data);
      if (data?.message) {
        addToast({ title: 'Bookings updated', message: data.message, type: 'info' });
      }
    } catch (err) {
      console.error('Error fetching user bookings:', err);
      addToast({
        title: 'Unable to load bookings',
        message: err.response?.data?.message || err.message || 'Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/80">
            CONFIRMED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/80">
            CANCELLED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700/80 animate-pulse">
            PENDING LOCK
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-sm text-slate-400 font-mono">
          Loading your bookings...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-indigo-400" />
            <span>My Bookings & Pass History</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View your reservations and event passes in one place.
          </p>
        </div>

        <button
          onClick={fetchUserBookings}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh bookings</span>
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No active bookings found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Explore our live events catalog and reserve your prime stadium seats today.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-glow"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const formattedTotal = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 2,
            }).format(booking.totalAmount || 0);

            return (
              <div
                key={booking.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 shadow-xl backdrop-blur-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-white font-mono">
                      Booking #{booking.id}
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{new Date(booking.createdAt).toLocaleTimeString()}</span>
                    </span>
                    <span className="text-slate-300">
                      Seats Reserved:{' '}
                      <strong className="text-white">
                        {booking.items ? booking.items.length : 1}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 font-mono block">Amount</span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {formattedTotal}
                    </span>
                  </div>

                  {booking.status === 'CONFIRMED' ? (
                    <Link
                      to={`/tickets/${booking.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-glow"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View QR Passes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : booking.status === 'PENDING' ? (
                    <Link
                      to={`/checkout/${booking.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors"
                    >
                      <span>Complete Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="text-xs font-mono text-slate-500 italic">
                      Locks Compensated
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
