import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';
import { UserPlus, Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { addToast, notifyEmailCheck } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_CUSTOMER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const responseMessage = await api.auth.register(email, password, role);

      // Trigger standard and email notification toasts
      addToast({
        title: 'Registration Initiated',
        message: responseMessage || 'Registration successful. Please enter the OTP sent to your email.',
        type: 'success',
      });

      // Special notification as specified in prompt
      notifyEmailCheck();

      // Navigate to Screen 2: OTP Verification
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please verify your connection.';
      setErrorMsg(msg);
      addToast({
        title: 'Registration Error',
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
          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-semibold flex items-center gap-1.5 shadow-glow">
            <span>1</span>
            <span>Registration</span>
          </span>
          <div className="w-8 h-0.5 bg-slate-800"></div>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center gap-1.5">
            <span>2</span>
            <span>OTP Verification</span>
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-glow">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create EventHub Account</h1>
            <p className="mt-1 text-sm text-slate-400">
              Create your account to start booking events
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_CUSTOMER')}
                  className={`py-2 px-3 text-xs font-mono font-medium rounded-lg border transition-colors ${
                    role === 'ROLE_CUSTOMER'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ROLE_ADMIN')}
                  className={`py-2 px-3 text-xs font-mono font-medium rounded-lg border transition-colors ${
                    role === 'ROLE_ADMIN'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Organizer
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Submit & Request OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link to="/login" className="text-slate-400 hover:text-white">
              Already registered? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
