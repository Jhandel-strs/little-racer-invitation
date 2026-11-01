import React, { useState } from 'react';
import { Lock, User, Flag, ArrowLeft, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../../utils/api';

interface Props {
  onLoginSuccess: () => void;
  onBackToPublic: () => void;
  notice?: string | null;
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBackToPublic, notice }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await loginAdmin(username, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Invalid administrator credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center px-4 pt-20 pb-10 sm:py-12 text-white relative">
      {/* Background Checkered Flag Accents */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-checkered-sm opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-checkered-sm opacity-60" />

      {/* Back to Public Link */}
      <button
        onClick={onBackToPublic}
        className="absolute top-[max(1.5rem,env(safe-area-inset-top))] left-4 sm:left-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Invitation</span>
      </button>

      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-sky-400">
            HOST ACCESS CONTROL
          </span>
          <h1 className="text-3xl font-black font-display tracking-tight text-white uppercase mt-1">
            Admin Pit Stop
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your invitation details, photos, venue, and guest RSVPs.
          </p>
        </div>

        {/* Login Form Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {notice && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                ADMIN USERNAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-white placeholder-slate-500 text-sm outline-none"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-white placeholder-slate-500 text-sm outline-none"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>CHECKING PIT PASS...</span>
              ) : (
                <>
                  <span>ENTER ADMIN DASHBOARD</span>
                  <Flag className="w-4 h-4 fill-white" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
