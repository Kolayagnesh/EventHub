import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Mail, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      title: toast.title || 'Notification',
      message: toast.message,
      type: toast.type || 'info', // 'success' | 'error' | 'warning' | 'mail' | 'info'
      duration: toast.duration || 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notifyEmailCheck = useCallback(() => {
    addToast({
      title: 'Email Dispatch Triggered',
      message: 'Check your registered email inbox for verification codes and booking passes!',
      type: 'mail',
      duration: 6500,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, notifyEmailCheck }}>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-up ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100 shadow-emerald-900/20'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-100 shadow-rose-900/20'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-800 text-amber-100 shadow-amber-900/20'
                : toast.type === 'mail'
                ? 'bg-indigo-950/90 border-indigo-700 text-indigo-100 shadow-indigo-900/30 ring-1 ring-indigo-500/40'
                : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-slate-900/40'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'mail' && <Mail className="w-5 h-5 text-indigo-400 animate-bounce" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 text-sm">
              <h4 className="font-semibold">{toast.title}</h4>
              <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
