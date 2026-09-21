import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ShieldCheck, Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginSession } = useAuth();
  const { addToast, notifyEmailCheck } = useToast();

  const queryEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(queryEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    // Notify on arrival to verify email check reminder
    notifyEmailCheck();
    // Focus first input box
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [notifyEmailCheck]);

  const handleDigitChange = (index, value) => {
    // Only accept numbers
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // Handle multi-character input (e.g. paste or autofill)
      const pastedChars = cleanVal.slice(0, 6).split('');
      pastedChars.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(5, pastedChars.length);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);
    const targetIdx = Math.min(5, pastedData.length);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const authResponse = await api.auth.verifyOtp(email, fullOtp);

      loginSession(authResponse);
      await api.users.register({
        userId: authResponse.userId,
        email: authResponse.email,
        role: authResponse.role,
      });

      addToast({
        title: 'Authentication Verified',
        message: `Welcome ${authResponse.email}! JWT Token signed & session established.`,
        type: 'success',
      });

      navigate('/events');
    } catch (err) {
      console.error('OTP Verification error:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code.';
      setErrorMsg(msg);
      addToast({
        title: 'Verification Failed',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center gap-1.5">
            <span>1</span>
            <span>Registration</span>
          </span>
          <div className="w-8 h-0.5 bg-indigo-600"></div>
          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-semibold flex items-center gap-1.5 shadow-glow">
            <span>2</span>
            <span>OTP Verification</span>
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-glow">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Enter 6-Digit OTP</h1>
            <p className="mt-1 text-sm text-slate-400">
              Dispatched to <span className="text-indigo-300 font-mono">{email}</span>
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6 Auto-Focus Digits */}
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono bg-slate-950 border-2 border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <span>Verify code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link to="/login" className="text-slate-400 hover:text-white">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
