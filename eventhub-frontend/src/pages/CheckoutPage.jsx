import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { CountdownTimer } from '../components/CountdownTimer';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Layers,
  Radio,
  Zap,
  Mail,
  RefreshCw,
} from 'lucide-react';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(window.Razorpay);
    return;
  }

  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.Razorpay));
    existingScript.addEventListener('error', reject);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(window.Razorpay);
  script.onerror = reject;
  document.body.appendChild(script);
});

export const CheckoutPage = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast, notifyEmailCheck } = useToast();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [event, setEvent] = useState(location.state?.event || null);
  const [seats, setSeats] = useState(location.state?.seats || []);
  const [isLoading, setIsLoading] = useState(!booking);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [isLockExpired, setIsLockExpired] = useState(false);

  useEffect(() => {
    if (!booking) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setIsLoading(true);
    try {
      const data = await api.bookings.getById(bookingId);
      setBooking(data);
      if (data.eventId) {
        const ev = await api.events.getById(data.eventId);
        setEvent(ev);
      }
    } catch (err) {
      console.error('Error loading booking:', err);
      addToast({
        title: 'Unable to load booking',
        message: err.response?.data?.message || err.message || 'Please try again.',
        type: 'info',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpire = () => {
    setIsLockExpired(true);
    addToast({
      title: 'Reservation expired',
      message: 'Your seat hold has expired. Please return to the event and choose your seats again.',
      type: 'warning',
      duration: 8000,
    });
  };

  const handlePayment = async () => {
    if (!booking) return;
    setIsProcessing(true);
    setPaymentResult(null);
    const currentBookingId = Number(bookingId);

    try {
      if (!RAZORPAY_KEY_ID) throw new Error('VITE_RAZORPAY_KEY_ID is not configured.');

      const payment = await api.payments.getByBooking(currentBookingId);
      const Razorpay = await loadRazorpay();
      if (!Razorpay) throw new Error('Razorpay checkout could not be loaded.');

      const razorpay = new Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: Math.round(Number(payment.amount) * 100),
        currency: 'INR',
        name: 'EventHub',
        description: `Booking #${currentBookingId}`,
        order_id: payment.razorpayOrderId,
        handler: async (response) => {
          try {
            const verifiedPayment = await api.payments.verify(
              currentBookingId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setPaymentResult(verifiedPayment);
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#6366f1', '#10b981', '#38bdf8', '#a855f7'],
            });
            addToast({
              title: 'Payment Completed',
              message: `Transaction ${response.razorpay_payment_id} confirmed.`,
              type: 'success',
            });
            notifyEmailCheck();
            setTimeout(() => navigate(`/tickets/${currentBookingId}`), 2200);
          } catch (err) {
            addToast({
              title: 'Payment Verification Failed',
              message: err.response?.data?.message || err.message || 'Could not verify payment.',
              type: 'error',
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
        theme: { color: '#4f46e5' },
      });

      razorpay.on('payment.failed', async (response) => {
        try {
          const failedPayment = await api.payments.fail(
            currentBookingId,
            booking.eventId,
            booking.items?.map((item) => item.eventSeatId) || seats.map((seat) => seat.id),
            response.error?.description || 'Razorpay payment failed'
          );
          setPaymentResult(failedPayment);
          addToast({
            title: 'Payment Failed',
            message: 'The reservation was cancelled and the seats were released.',
            type: 'error',
            duration: 8000,
          });
        } catch (err) {
          addToast({
            title: 'Payment Failure Handling Failed',
            message: err.response?.data?.message || err.message || 'Could not update payment status.',
            type: 'error',
          });
        } finally {
          setIsProcessing(false);
        }
      });

      razorpay.open();
    } catch (err) {
      console.error('Razorpay payment error:', err);
      addToast({
        title: 'Payment Error',
        message: err.response?.data?.message || err.message || 'Could not start Razorpay checkout.',
        type: 'error',
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-3 text-sm text-slate-400 font-mono">
          Loading your reservation...
        </p>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(booking?.totalAmount || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={`/events/${booking?.eventId || 1}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stadium Blueprint</span>
        </Link>

        {/* 5-minute Real-Time Reservation Timer */}
        <CountdownTimer expiresAt={booking?.expiresAt} onExpire={handleExpire} />
      </div>

      {/* Expiry Warning Banner */}
      {isLockExpired && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-950/70 border border-rose-700/80 text-rose-200 flex items-start gap-3 shadow-lg shadow-rose-950/50">
          <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold">Your reservation has expired</h4>
            <p className="mt-1 text-slate-300">
              The hold on your selected seats has ended. Please return to the event and choose your seats again.
            </p>
            <Link
              to={`/events/${booking?.eventId || 1}`}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-mono font-bold text-rose-300 hover:text-white underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
                  <span>Return to seat map</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Booking & Seat Lock Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                  Active Reservation
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Booking #{booking?.id}
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                booking?.status === 'CONFIRMED'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : booking?.status === 'CANCELLED'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
              }`}>
                STATUS: {booking?.status || 'PENDING'}
              </span>
            </div>

            {/* Event Overview */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 mb-6">
              <h3 className="font-bold text-white text-base">{event?.title || 'IPL Grand Finale 2026'}</h3>
              <p className="text-xs text-slate-400 mt-1">{event?.venue?.name}, {event?.venue?.city}</p>
              <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-2.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{event?.startTime ? new Date(event.startTime).toLocaleString() : 'Live Schedule'}</span>
                </span>
              </div>
            </div>

            {/* Locked Seats Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Selected seats
              </h4>

              <div className="space-y-2">
                {booking?.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-indigo-950 text-indigo-300 flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 font-semibold">
                        Seat ID: #{item.eventSeatId}
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-emerald-400">Held for you</span>
                    </div>

                    <span className="font-bold text-white">
                      ₹{item.price ? item.price.toLocaleString('en-IN') : '6,500.00'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Row */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm font-mono text-slate-400">Total to pay</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formattedAmount}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Razorpay Payment */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold mb-2">
              <Layers className="w-4 h-4" />
              <span>Razorpay Payment</span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Complete Payment
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pay securely to receive your digital event passes.
            </p>

            {/* Payment Status Display */}
            {paymentResult && (
              <div className={`mt-5 p-4 rounded-2xl border ${
                paymentResult.status === 'COMPLETED'
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-100'
                  : 'bg-rose-950/60 border-rose-700 text-rose-100'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {paymentResult.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span>Status: {paymentResult.status}</span>
                </div>

                <div className="mt-2 text-xs font-mono space-y-1 text-slate-300">
                  <div>Payment ID: <span className="text-white font-bold">{paymentResult.razorpayPaymentId || 'Pending'}</span></div>
                  <div>Amount: ₹{paymentResult.amount?.toLocaleString('en-IN')}</div>
                  <div>Time: {new Date(paymentResult.createdAt).toLocaleTimeString()}</div>
                </div>

                {paymentResult.status === 'COMPLETED' && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-800/80 text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    <span>Email receipt and QR code tickets dispatched!</span>
                  </div>
                )}
              </div>
            )}

            {/* Razorpay Checkout */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePayment}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Razorpay...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay with Razorpay</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center font-mono">
                Your payment details are securely processed.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
