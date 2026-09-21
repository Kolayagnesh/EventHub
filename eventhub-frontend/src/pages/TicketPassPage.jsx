import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import {
  Ticket,
  QrCode,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ScanLine,
  Download,
  Share2,
  Sparkles,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Building,
  User,
} from 'lucide-react';

export const TicketPassPage = () => {
  const { bookingId } = useParams();
  const { addToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [event, setEvent] = useState(null);
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validatingCode, setValidatingCode] = useState(null);

  useEffect(() => {
    fetchTicketsAndDetails();
  }, [bookingId]);

  const fetchTicketsAndDetails = async () => {
    setIsLoading(true);
    try {
      const [ticketData, bookingData] = await Promise.all([
        api.tickets.getByBooking(bookingId),
        api.bookings.getById(bookingId),
      ]);
      setTickets(ticketData);
      setBooking(bookingData);

      if (bookingData?.eventId) {
        const ev = await api.events.getById(bookingData.eventId);
        setEvent(ev);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      addToast({
        title: 'Unable to load passes',
        message: err.response?.data?.message || err.message || 'Please try again.',
        type: 'info',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidatePass = async (ticketCode) => {
    setValidatingCode(ticketCode);
    try {
      const updatedTicket = await api.tickets.validate(ticketCode);

      // Update state locally
      setTickets((prev) =>
        prev.map((t) => (t.ticketCode === ticketCode ? { ...t, status: 'USED' } : t))
      );

      addToast({
        title: 'Turnstile Scan Successful',
        message: updatedTicket?.message || `Pass ${ticketCode} was validated successfully.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Validation error:', err);
      addToast({
        title: 'Validation Failed',
        message: err.message || 'Pass validation error.',
        type: 'error',
      });
    } finally {
      setValidatingCode(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-sm text-slate-400 font-mono">
          Loading your event passes...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header controls */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Save / Print Passes</span>
          </button>
        </div>
      </div>

      {/* Hero Pass Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-semibold mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Payment Confirmed & Verified</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Digital Event Passes
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Present your QR code pass at venue turnstiles for instant laser scan entry.
        </p>
      </div>

      {/* Tickets List */}
      <div className="space-y-8">
        {tickets.map((ticket, idx) => {
          const isValid = ticket.status === 'VALID';

          return (
            <div
              key={ticket.id || idx}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative"
            >
              {/* Ticket Top Strip */}
              <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/60 p-4 px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <Ticket className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300 font-bold">PASS #{idx + 1} OF {tickets.length}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-indigo-300">Booking #{booking?.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold border ${
                      isValid
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700/80 shadow-glow-emerald'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    STATUS: {ticket.status}
                  </span>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Left: Event & Venue Info */}
                <div className="space-y-5 flex-1 text-center md:text-left">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                      Event Pass Voucher
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                      {event?.title || 'IPL Grand Finale 2026'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{event?.description}</p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Date & Time</span>
                      </span>
                      <p className="font-bold text-white font-mono">
                        {event?.startTime ? new Date(event.startTime).toLocaleString() : '2026-05-30 19:30'}
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Venue Location</span>
                      </span>
                      <p className="font-bold text-white">
                        {event?.venue?.name || 'Narendra Modi Stadium'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {event?.venue?.address || 'Motera, Ahmedabad'}
                      </p>
                    </div>
                  </div>

                  {/* Allocated Seat Badge */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950 border border-indigo-700/80 font-mono text-xs text-indigo-200">
                      <span>Seat Node: </span>
                      <strong className="text-white">Seat #{ticket.seatId}</strong>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
                      <span>Candidate UID: </span>
                      <strong className="text-white">{ticket.userId || 1}</strong>
                    </div>
                  </div>
                </div>

                {/* Right: Digital QR Code Card */}
                <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner min-w-[240px]">
                  <div className="relative group">
                    {/* Base64 / SVG QR Code Image */}
                    <img
                      src={ticket.qrCodeData}
                      alt={`QR Pass for ${ticket.ticketCode}`}
                      className={`w-40 h-40 rounded-xl bg-slate-900 p-2 border transition-all ${
                        isValid
                          ? 'border-indigo-500/50 shadow-glow'
                          : 'border-slate-800 opacity-40 grayscale'
                      }`}
                    />
                    {isValid && (
                      <div className="absolute inset-0 border-2 border-dashed border-cyan-400/40 rounded-xl pointer-events-none animate-pulse"></div>
                    )}
                  </div>

                  <span className="mt-3 font-mono text-xs font-bold tracking-widest text-slate-300">
                    {ticket.ticketCode}
                  </span>

                  <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                    Digital event pass
                  </span>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 w-full text-center">
                    {isValid ? (
                      <button
                        type="button"
                        disabled={validatingCode === ticket.ticketCode}
                        onClick={() => handleValidatePass(ticket.ticketCode)}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {validatingCode === ticket.ticketCode ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ScanLine className="w-3.5 h-3.5" />
                        )}
                        <span>Scan at Turnstile</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-slate-500 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Validated & Used</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
