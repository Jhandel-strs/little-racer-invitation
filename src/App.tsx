import React, { useState, useEffect } from 'react';
import type { InvitationData } from './types/invitation';
import { fetchPublicInvitation, clearStoredToken } from './utils/api';
import { PublicInvitationView } from './components/public/PublicInvitationView';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Flag, Lock, AlertCircle, RefreshCw, Clock } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDraftUnpublished, setIsDraftUnpublished] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parse path for slug or admin route
  const getSlugFromPath = (path: string): string => {
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'invite' && parts[1]) {
      return parts[1];
    }
    return 'little-racer-turns-one';
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  // Require a fresh admin login each time the app is opened.
  useEffect(() => {
    clearStoredToken();
  }, []);

  // Sync with browser popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate helper
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load public invitation if not on admin route
  useEffect(() => {
    if (isAdminRoute) return;

    const slug = getSlugFromPath(currentPath);
    setLoading(true);
    setIsDraftUnpublished(false);
    setErrorMsg(null);

    fetchPublicInvitation(slug)
      .then((res) => {
        if (res.status === 'published' && res.invitation) {
          setInvitation(res.invitation);
        } else if (res.status === 'draft') {
          setIsDraftUnpublished(true);
        } else {
          setErrorMsg(res.error || 'Invitation not found');
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to load invitation');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPath, isAdminRoute]);

  // If on Admin route
  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={() => setIsAdminAuthenticated(true)}
          onBackToPublic={() => navigate('/')}
        />
      );
    }
    return (
      <AdminDashboard
        onLogout={() => {
          setIsAdminAuthenticated(false);
          navigate('/');
        }}
        onViewPublic={() => navigate('/')}
      />
    );
  }

  // Public loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-rose-600 border-t-transparent animate-spin" />
          <Flag className="w-6 h-6 text-rose-500 absolute inset-0 m-auto" />
        </div>
        <div className="text-xl font-black uppercase font-display tracking-wider">
          Starting Race Engines...
        </div>
        <p className="text-xs text-slate-400 mt-2">Loading Little Racer Turns ONE</p>
      </div>
    );
  }

  // Draft mode notice for visitors
  if (isDraftUnpublished) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-amber-400">
          PIT CREW NOTICE
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight text-white mt-2">
          Invitation In the Pit Lane
        </h1>
        <p className="text-sm text-slate-400 mt-3 max-w-md">
          This invitation is currently in draft mode and getting tuned up by the host. Please check back soon once the green flag drops!
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Host Login</span>
          </button>
        </div>
      </div>
    );
  }

  // Error / Not Found state
  if (errorMsg || !invitation) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/80 text-rose-500 border border-rose-500/40 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-display uppercase text-white">
          Invitation Not Found
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          {errorMsg || 'We could not locate this race invitation.'}
        </p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-6 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-colors"
        >
          Go to Admin Portal
        </button>
      </div>
    );
  }

  // Render Public Invitation
  return (
    <PublicInvitationView
      invitation={invitation}
      onOpenAdmin={() => navigate('/admin')}
    />
  );
}
