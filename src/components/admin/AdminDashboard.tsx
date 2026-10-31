import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  Cake,
  Flag,
  Save,
  Globe,
  Upload,
  Calendar,
  MapPin,
  Users,
  Camera,
  Trash2,
  Plus,
  Copy,
  Check,
  Eye,
  LogOut,
  Clock,
  Sparkles,
  Trophy,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import type { InvitationData, RSVPResponse, ScheduleItem, GalleryItem, FaqItem } from '../../types/invitation';
import {
  fetchAdminInvitation,
  fetchAdminWishes,
  saveDraftInvitation,
  publishInvitation,
  unpublishInvitation,
  uploadImageFile,
  fetchAdminRsvps,
  downloadAdminRsvpsCsv,
  updateAdminRsvp,
  deleteAdminRsvp,
  logoutAdmin,
} from '../../utils/api';
import { AdminLivePreviewModal } from './AdminLivePreviewModal';

interface Props {
  onLogout: () => void;
  onViewPublic: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onLogout, onViewPublic }) => {
  const [draft, setDraft] = useState<InvitationData | null>(null);
  const [published, setPublished] = useState<InvitationData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [rsvpMetrics, setRsvpMetrics] = useState<any>(null);
  const [rsvpSource, setRsvpSource] = useState<'local' | 'google-sheet' | null>(null);
  const [refreshingRsvps, setRefreshingRsvps] = useState(false);
  const [activityNotice, setActivityNotice] = useState<string | null>(null);
  const seenActivityIds = useRef<Set<string> | null>(null);
  const activityNoticeTimer = useRef<number | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'content' | 'media' | 'canva' | 'faqs' | 'venue' | 'rsvps'
  >('overview');
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Uploading status indicators
  const [uploadingMainPhoto, setUploadingMainPhoto] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // RSVP filter and search
  const [rsvpSearch, setRsvpSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<'all' | 'attending' | 'declined'>('all');

  const loadData = useCallback(async (backgroundRefresh = false) => {
    try {
      const data = await fetchAdminInvitation();
      setDraft(data.draft);
      setPublished(data.published);
      setStats(data.stats);

      const [rsvpResult, wishResult] = await Promise.allSettled([
        fetchAdminRsvps(),
        fetchAdminWishes(),
      ]);
      const requestErrors: string[] = [];
      const activityRsvps = rsvpResult.status === 'fulfilled' ? rsvpResult.value.rsvps : [];
      const wishes = wishResult.status === 'fulfilled'
        ? wishResult.value.wishes
        : data.published?.wishes ?? data.draft.wishes ?? [];

      if (rsvpResult.status === 'fulfilled') {
        setRsvps(rsvpResult.value.rsvps);
        setRsvpMetrics(rsvpResult.value.metrics);
        setRsvpSource(rsvpResult.value.source);
      } else {
        requestErrors.push(rsvpResult.reason instanceof Error
          ? rsvpResult.reason.message
          : 'RSVP responses could not be loaded.');
      }

      if (wishResult.status === 'fulfilled') {
        const mergedWishes = wishResult.value.wishes;
        setDraft((current) => current ? { ...current, wishes: mergedWishes } : current);
        setPublished((current) => current ? { ...current, wishes: mergedWishes } : current);
        if (wishResult.value.warning) requestErrors.push(wishResult.value.warning);
      } else {
        requestErrors.push(wishResult.reason instanceof Error
          ? wishResult.reason.message
          : 'Birthday wishes could not be loaded.');
      }

      const previousActivityIds = seenActivityIds.current;
      const currentActivityIds = new Set(previousActivityIds ?? []);
      if (rsvpResult.status === 'fulfilled') {
        for (const id of currentActivityIds) if (id.startsWith('rsvp:')) currentActivityIds.delete(id);
        for (const rsvp of activityRsvps) currentActivityIds.add(`rsvp:${rsvp.id}`);
      }
      if (wishResult.status === 'fulfilled') {
        for (const id of currentActivityIds) if (id.startsWith('wish:')) currentActivityIds.delete(id);
        for (const wish of wishes) currentActivityIds.add(`wish:${wish.id}`);
      }

      if (backgroundRefresh && previousActivityIds) {
        const newRsvp = rsvpResult.status === 'fulfilled'
          ? activityRsvps.find((rsvp) => !previousActivityIds.has(`rsvp:${rsvp.id}`))
          : undefined;
        const newWish = wishResult.status === 'fulfilled'
          ? wishes.find((wish) => !previousActivityIds.has(`wish:${wish.id}`))
          : undefined;

        if (newRsvp || newWish) {
          const notice = newRsvp
            ? `${newRsvp.guestName} ${newRsvp.attending ? `RSVP’d for ${newRsvp.attendeeCount} ${newRsvp.attendeeCount === 1 ? 'guest' : 'guests'}` : 'can’t make it'}.`
            : `${newWish?.guestName} left a birthday wish.`;
          setActivityNotice(notice);
          if (activityNoticeTimer.current !== null) {
            window.clearTimeout(activityNoticeTimer.current);
          }
          activityNoticeTimer.current = window.setTimeout(() => {
            setActivityNotice(null);
            activityNoticeTimer.current = null;
          }, 7000);
        }
      }

      seenActivityIds.current = currentActivityIds;
      if (requestErrors.length && !backgroundRefresh) setErrorMsg(requestErrors.join(' '));
    } catch (err: any) {
      if (!backgroundRefresh) {
        setErrorMsg(err.message || 'Failed to load admin data.');
      }
    }
  }, []);

  useEffect(() => {
    void loadData();
    const refreshTimer = window.setInterval(() => {
      void loadData(true);
    }, 30_000);

    return () => {
      window.clearInterval(refreshTimer);
      if (activityNoticeTimer.current !== null) {
        window.clearTimeout(activityNoticeTimer.current);
      }
    };
  }, [loadData]);

  const handleRefreshRsvps = async () => {
    setRefreshingRsvps(true);
    setErrorMsg(null);
    try {
      await loadData();
    } finally {
      setRefreshingRsvps(false);
    }
  };

  const handleDownloadRsvps = async () => {
    try {
      await downloadAdminRsvpsCsv();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download RSVP responses.');
    }
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const res = await saveDraftInvitation(draft);
      setDraft(res.draft);
      setSaveSuccessMsg('Draft saved successfully! Unpublished edits remain private.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      if (draft) await saveDraftInvitation(draft);
      const res = await publishInvitation();
      setPublished(res.published);
      if (draft) {
        setDraft({ ...draft, status: 'published', publishedAt: res.published.publishedAt });
      }
      setSaveSuccessMsg('🏁 Boom! Invitation is officially PUBLISHED to the world!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish invitation.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (
      !confirm(
        'Are you sure you want to take this invitation offline? Guests will not be able to view it until republished.'
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await unpublishInvitation();
      setPublished(null);
      setDraft(res.draft);
      setSaveSuccessMsg('Invitation has been unpublished and returned to draft mode.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to unpublish invitation.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPublicUrl = () => {
    const slug = draft?.slug || 'little-racer-turns-one';
    const origin = window.location.origin;
    const url = `${origin}/invite/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'mainPhoto' | 'backdrop' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !draft) return;

    if (type === 'mainPhoto') setUploadingMainPhoto(true);
    if (type === 'backdrop') setUploadingBackdrop(true);
    if (type === 'gallery') setUploadingGallery(true);

    try {
      const res = await uploadImageFile(file);
      if (res.success && res.url) {
        if (type === 'mainPhoto') {
          setDraft({ ...draft, mainPhotoUrl: res.url });
        } else if (type === 'backdrop') {
          setDraft({ ...draft, backdropUrl: res.url });
        } else if (type === 'gallery') {
          const newItem: GalleryItem = {
            id: `g-${Date.now()}`,
            url: res.url,
            caption: 'Milestone Lap',
            ageMonth: 'Month 12',
          };
          setDraft({
            ...draft,
            gallery: [...(draft.gallery || []), newItem],
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed.');
    } finally {
      if (type === 'mainPhoto') setUploadingMainPhoto(false);
      if (type === 'backdrop') setUploadingBackdrop(false);
      if (type === 'gallery') setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryItem = (id: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      gallery: (draft.gallery || []).filter((g) => g.id !== id),
    });
  };

  // Schedule Management
  const handleAddScheduleItem = () => {
    if (!draft) return;
    const newItem: ScheduleItem = {
      id: `s-${Date.now()}`,
      time: '3:00 PM',
      title: 'Pit Stop Activity',
      description: 'Fun on the racetrack',
    };
    setDraft({
      ...draft,
      schedule: [...(draft.schedule || []), newItem],
    });
  };

  const handleUpdateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      schedule: (draft.schedule || []).map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const handleRemoveScheduleItem = (id: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      schedule: (draft.schedule || []).filter((s) => s.id !== id),
    });
  };

  // FAQ Management
  const handleAddFaq = () => {
    if (!draft) return;
    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      question: 'Where should pit crew members park?',
      answer: 'Designated parking is available directly adjacent to the main venue paddock.',
    };
    setDraft({
      ...draft,
      faqs: [...(draft.faqs || []), newFaq],
    });
  };

  const handleUpdateFaq = (id: string, updates: Partial<FaqItem>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      faqs: (draft.faqs || []).map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const handleRemoveFaq = (id: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      faqs: (draft.faqs || []).filter((f) => f.id !== id),
    });
  };

  // RSVP management actions
  const handleDeleteRsvp = async (id: string) => {
    if (rsvpSource === 'google-sheet') return;
    if (!confirm('Are you sure you want to delete this RSVP response?')) return;
    try {
      await deleteAdminRsvp(id);
      setRsvps((prev) => prev.filter((r) => r.id !== id));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete RSVP');
    }
  };

  const handleToggleRsvpAttendance = async (rsvp: RSVPResponse) => {
    if (rsvpSource === 'google-sheet') return;
    try {
      const updated = await updateAdminRsvp(rsvp.id, {
        attending: !rsvp.attending,
        attendeeCount: !rsvp.attending ? 1 : 0,
      });
      setRsvps((prev) => prev.map((r) => (r.id === rsvp.id ? updated : r)));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update RSVP');
    }
  };

  const filteredRsvps = rsvps.filter((r) => {
    const matchesSearch =
      r.guestName.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
      (r.email && r.email.toLowerCase().includes(rsvpSearch.toLowerCase())) ||
      (r.phone && r.phone.toLowerCase().includes(rsvpSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (rsvpFilter === 'attending') return r.attending;
    if (rsvpFilter === 'declined') return !r.attending;
    return true;
  });

  const wishes = published?.wishes ?? draft?.wishes ?? [];
  const recentRsvps = [...rsvps]
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
    .slice(0, 5);
  const recentWishes = [...wishes]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 5);
  const formatActivityTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Recently'
      : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (!draft) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
        {errorMsg ? (
          <div className="max-w-lg w-full rounded-2xl border border-rose-500/40 bg-slate-900 p-6 text-center shadow-xl">
            <h1 className="font-display text-xl font-black uppercase">Dashboard could not load</h1>
            <p role="alert" className="mt-3 text-sm leading-6 text-rose-200">{errorMsg}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => { setErrorMsg(null); void loadData(); }}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold hover:bg-rose-500"
              >
                Try again
              </button>
              <button
                onClick={onLogout}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
              >
                Back to login
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            <span>Loading Pit Stop Dashboard...</span>
          </div>
        )}
      </div>
    );
  }

  const isPublished = draft.status === 'published' && published !== null;
  const publicSlug = draft.slug || 'little-racer-turns-one';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Header Bar - Responsive on Mobile */}
      <header className="px-4 sm:px-8 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center shadow-md shrink-0">
            <Flag className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="font-display font-black text-sm uppercase tracking-wider text-white">
              LITTLE RACER ADMIN
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isPublished ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>{isPublished ? 'Live Published' : 'Draft In Progress'}</span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save</span>
          </button>

          {isPublished ? (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Update Live</span>
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5 fill-white" />
              <span>Publish</span>
            </button>
          )}

          <button
            onClick={async () => {
              await logoutAdmin();
              onLogout();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Notification Banners */}
      {saveSuccessMsg && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 sm:px-6 py-2.5 text-xs font-bold text-emerald-200 flex items-center justify-between animate-fade-in">
          <span>{saveSuccessMsg}</span>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-4 sm:px-6 py-2.5 text-xs font-bold text-rose-200 flex items-center justify-between animate-fade-in">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Container - Responsive Sidebar / Mobile Tabs */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-3 sm:p-6 md:p-8 gap-4 sm:gap-6 md:gap-8">
        {/* Navigation Tabs - Touch horizontal scrollbar on mobile/tablet, full vertical on desktop */}
        <aside className="w-full md:w-64 shrink-0 flex md:flex-col overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900 md:bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'content'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900 md:bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Invitation Wordings</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'media'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900 md:bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Images & Styling</span>
          </button>

          <button
            onClick={() => setActiveTab('canva')}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'canva'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900 md:bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Canva FX</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'faqs'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900 md:bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pit Crew FAQs</span>
          </button>

          <button
            onClick={() => setActiveTab('venue')}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'venue'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900 md:bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Venue & Map</span>
          </button>

          <button
            onClick={() => setActiveTab('rsvps')}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'rsvps'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-900 md:bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>RSVPs & Guests</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-black tabular-nums text-slate-200">
              {rsvps.length}
            </span>
          </button>

          {/* Quick Preview trigger */}
          <div className="hidden md:block pt-4">
            <button
              onClick={onViewPublic}
              className="w-full px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 bg-slate-900/60 rounded-2xl sm:rounded-3xl border border-slate-800 p-4 sm:p-6 md:p-8 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white">
                  Event Overview & Telemetry
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Track RSVPs, publish status, and share the invitation link.
                </p>
              </div>

              {/* Status & Public Link Card */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      INVITATION STATUS
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-base sm:text-lg font-black font-display uppercase ${
                          isPublished ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isPublished ? 'PUBLISHED & ACTIVE 🏁' : 'DRAFT (PRIVATE)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPublished && (
                      <button
                        onClick={handleUnpublish}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors cursor-pointer"
                      >
                        Unpublish to Draft
                      </button>
                    )}
                  </div>
                </div>

                {/* Share Link Row */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    STABLE PUBLIC LINK
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/invite/${publicSlug}`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 select-all outline-none"
                    />
                    <button
                      onClick={handleCopyPublicUrl}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RSVP Telemetry Counter Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Responses
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-white mt-1 tabular-nums">
                    {rsvpMetrics?.totalResponses ?? rsvps.length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Attending RSVPs
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400 mt-1 tabular-nums">
                    {rsvpMetrics?.attendingCount ?? rsvps.filter((r) => r.attending).length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Guests / Crew
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-amber-400 mt-1 tabular-nums">
                    {rsvpMetrics?.totalAttendees ??
                      rsvps.reduce((acc, r) => acc + (r.attending ? r.attendeeCount : 0), 0)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Declined
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-rose-400 mt-1 tabular-nums">
                    {rsvpMetrics?.declinedCount ?? rsvps.filter((r) => !r.attending).length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Birthday wishes
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-display text-sky-400 mt-1 tabular-nums">
                    {wishes.length}
                  </div>
                </div>
              </div>

              {/* Live RSVP and birthday-wish activity */}
              <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Pit board activity</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Recent replies and birthday wishes from your guests.</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 self-start sm:self-auto px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Updates every 30 seconds
                  </div>
                </div>

                {activityNotice && (
                  <div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/50 px-3 py-2.5 text-sm text-emerald-200">
                    <Bell className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="flex-1">{activityNotice}</span>
                    <button
                      type="button"
                      onClick={() => setActivityNotice(null)}
                      className="text-emerald-300 hover:text-white text-xs font-bold"
                      aria-label="Dismiss new activity notification"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-5">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                        <Users className="w-4 h-4 text-rose-400" /> RSVP replies
                      </h4>
                      <span className="text-[11px] text-slate-500">{rsvps.length} total</span>
                    </div>
                    {recentRsvps.length ? (
                      <ul className="divide-y divide-slate-900">
                        {recentRsvps.map((rsvp) => (
                          <li key={rsvp.id} className="py-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{rsvp.guestName}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {rsvp.attending
                                  ? `Attending · ${rsvp.attendeeCount} ${rsvp.attendeeCount === 1 ? 'guest' : 'guests'}`
                                  : 'Unable to attend'}
                                {rsvp.guestNames?.length ? ` · ${rsvp.guestNames.join(', ')}` : ''}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1">{formatActivityTime(rsvp.submittedAt)}</div>
                            </div>
                            <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${rsvp.attending ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                              {rsvp.attending ? 'Coming' : 'Declined'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-5 text-center text-xs text-slate-500">No RSVP replies yet.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('rsvps')}
                      className="mt-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      View all RSVPs →
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                        <Cake className="w-4 h-4 text-sky-400" /> Birthday wishes
                      </h4>
                      <span className="text-[11px] text-slate-500">{wishes.length} total</span>
                    </div>
                    {recentWishes.length ? (
                      <ul className="divide-y divide-slate-900">
                        {recentWishes.map((wish) => (
                          <li key={wish.id} className="py-3 flex items-start gap-3">
                            <span className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-base" aria-hidden="true">
                              {wish.badgeEmoji || <MessageSquare className="w-4 h-4 text-sky-400" />}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="text-sm font-semibold text-white">{wish.guestName}</span>
                                <span className="text-[11px] text-slate-500">{formatActivityTime(wish.timestamp)}</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 break-words">{wish.message}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-5 text-center text-xs text-slate-500">No birthday wishes yet.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Celebrant Quick Summary */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-rose-500 bg-slate-900 shrink-0">
                  <img
                    src={draft.mainPhotoUrl}
                    alt={draft.celebrantName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <div className="text-xs font-black uppercase tracking-widest text-rose-400">
                    FIRST BIRTHDAY CHAMPION
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-display uppercase text-white mt-1">
                    {draft.celebrantName} (Turns {draft.turningAge})
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    {draft.welcomeMessage}
                  </p>
                  <div className="mt-3 text-xs text-sky-400 font-bold flex flex-wrap items-center justify-center sm:justify-start gap-4">
                    <span>📅 {draft.eventDate}</span>
                    <span>⏰ {draft.startTime} – {draft.endTime}</span>
                    <span>📍 {draft.venueName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & SCHEDULE */}
          {activeTab === 'content' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white">
                  Invitation Wordings & Schedule
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage invitation copy, event timing, and celebrant milestones before publishing.
                </p>
              </div>

              <div className="space-y-5">
                {/* Celebrant and Title Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      CELEBRANT NAME
                    </label>
                    <input
                      type="text"
                      value={draft.celebrantName}
                      onChange={(e) => setDraft({ ...draft, celebrantName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      TURNING AGE (RACING NUMBER)
                    </label>
                    <input
                      type="number"
                      value={draft.turningAge}
                      onChange={(e) => setDraft({ ...draft, turningAge: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    MAIN BIRTHDAY HEADING (SECTION A)
                  </label>
                  <input
                    type="text"
                    value={draft.birthdayTitle}
                    onChange={(e) => setDraft({ ...draft, birthdayTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    TAGLINE
                  </label>
                  <input
                    type="text"
                    value={draft.tagline}
                    onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    PERSONALIZED WELCOME MESSAGE (SECTION B)
                  </label>
                  <textarea
                    rows={3}
                    value={draft.welcomeMessage}
                    onChange={(e) => setDraft({ ...draft, welcomeMessage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                  />
                </div>

                {/* Event Date, Start & End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      EVENT DATE
                    </label>
                    <input
                      type="date"
                      value={draft.eventDate}
                      onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      START TIME
                    </label>
                    <input
                      type="time"
                      value={draft.startTime}
                      onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      END TIME
                    </label>
                    <input
                      type="time"
                      value={draft.endTime}
                      onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Dress Code & Closing Sign-Off */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      DRESS CODE
                    </label>
                    <input
                      type="text"
                      value={draft.dressCode}
                      onChange={(e) => setDraft({ ...draft, dressCode: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      CLOSING SIGN-OFF TEXT
                    </label>
                    <input
                      type="text"
                      value={draft.closingSignOff}
                      onChange={(e) => setDraft({ ...draft, closingSignOff: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Important Reminders */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    IMPORTANT REMINDERS / PIT CREW NOTES
                  </label>
                  <textarea
                    rows={3}
                    value={draft.reminders}
                    onChange={(e) => setDraft({ ...draft, reminders: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white mb-1">
                      Closing & Envelope Wordings
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      These invitation messages are managed here in the admin dashboard.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      CLOSING MESSAGE
                    </label>
                    <textarea
                      rows={3}
                      value={draft.closingMessage}
                      onChange={(e) => setDraft({ ...draft, closingMessage: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        ENVELOPE BANNER
                      </label>
                      <input
                        type="text"
                        value={draft.theme.envelopeBannerText || ''}
                        onChange={(e) =>
                          setDraft({ ...draft, theme: { ...draft.theme, envelopeBannerText: e.target.value } })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        ENVELOPE SALUTATION
                      </label>
                      <input
                        type="text"
                        value={draft.theme.envelopeSalutation || ''}
                        onChange={(e) =>
                          setDraft({ ...draft, theme: { ...draft.theme, envelopeSalutation: e.target.value } })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      ENVELOPE ADDRESSEE
                    </label>
                    <input
                      type="text"
                      value={draft.theme.envelopeAddressee || ''}
                      onChange={(e) =>
                        setDraft({ ...draft, theme: { ...draft.theme, envelopeAddressee: e.target.value } })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Celebrant Milestones (Pit Stop Spec Sheet) */}
                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">
                    Pit Stop Milestone Spec Sheet (Year 1 Stats)
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Displayed in Section B. Customize all stats to your liking!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Favorite Fuel (Food)
                      </label>
                      <input
                        type="text"
                        value={draft.milestones?.favoriteFood || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            milestones: { ...draft.milestones, favoriteFood: e.target.value },
                          })
                        }
                        placeholder="Mashed sweet potatoes"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Number of Teeth
                      </label>
                      <input
                        type="number"
                        value={draft.milestones?.teethCount ?? 6}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            milestones: {
                              ...draft.milestones,
                              teethCount: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Favorite Ride / Toy
                      </label>
                      <input
                        type="text"
                        value={draft.milestones?.favoriteToy || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            milestones: { ...draft.milestones, favoriteToy: e.target.value },
                          })
                        }
                        placeholder="Red wooden racecar"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        What the rider likes (gift ideas)
                      </label>
                      <input
                        type="text"
                        value={draft.milestones?.giftIdeas || draft.milestones?.lovesTo || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            milestones: { ...draft.milestones, giftIdeas: e.target.value },
                          })
                        }
                        placeholder="Wooden cars, board books, music toys…"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                        Share favorite toys, books, activities, or characters to help guests choose a gift.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Racer Height
                      </label>
                      <input
                        type="text"
                        value={draft.milestones?.height || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            milestones: { ...draft.milestones, height: e.target.value },
                          })
                        }
                        placeholder="e.g. 30 inches (76 cm)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Chassis Weight
                      </label>
                      <input
                        type="text"
                        value={draft.milestones?.weight || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            milestones: { ...draft.milestones, weight: e.target.value },
                          })
                        }
                        placeholder="e.g. 22 lbs (10 kg)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Signature Superpower
                      </label>
                      <input
                        type="text"
                        value={draft.milestones?.superpower || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            milestones: { ...draft.milestones, superpower: e.target.value },
                          })
                        }
                        placeholder="Speed crawling across the living room in 3 seconds flat!"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Items Editor */}
                <div className="pt-6 border-t border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Race Day Pit Stop Schedule
                      </h3>
                      <p className="text-[11px] text-slate-400">Timeline events on the race card</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddScheduleItem}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Pit Stop</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draft.schedule?.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
                      >
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) =>
                            handleUpdateScheduleItem(item.id, { time: e.target.value })
                          }
                          placeholder="2:00 PM"
                          className="w-full sm:w-28 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400 outline-none"
                        />
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            handleUpdateScheduleItem(item.id, { title: e.target.value })
                          }
                          placeholder="Event Title"
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-white outline-none"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateScheduleItem(item.id, { description: e.target.value })
                          }
                          placeholder="Description"
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleItem(item.id)}
                          className="p-2 self-end sm:self-auto text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Visibility Toggles */}
                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3">
                    Section Visibility Controls
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(draft.visibility || {}).map(([key, val]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              visibility: { ...draft.visibility, [key]: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
                        />
                        <span className="capitalize font-semibold text-slate-300">{key} Section</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMAGES & MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white">
                  Image Uploads & Visual Styling
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload baby photos, change the background, and adjust overlay opacity.
                </p>
              </div>

              {/* Main Baby Portrait & Backdrop upload row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Baby Photo */}
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      MAIN BABY PORTRAIT (SECTION A & B)
                    </div>
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden mx-auto mb-4 border-4 border-rose-500 bg-slate-900 shadow-xl">
                      <img
                        src={draft.mainPhotoUrl}
                        alt="Baby preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white text-center transition-colors cursor-pointer shadow-md">
                      <span>{uploadingMainPhoto ? 'Uploading...' : 'Upload Baby Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingMainPhoto}
                        onChange={(e) => handleUploadFile(e, 'mainPhoto')}
                      />
                    </label>
                    <div className="text-[10px] text-slate-500 text-center mt-2">
                      Supports JPEG, PNG, WEBP (Max 12MB)
                    </div>
                  </div>
                </div>

                {/* Backdrop Image */}
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      RACETRACK BACKGROUND (SECTION A)
                    </div>
                    <div className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden mb-4 border-2 border-slate-700 bg-slate-900">
                      <img
                        src={draft.backdropUrl}
                        alt="Backdrop preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-sky-600 hover:bg-sky-500 text-white text-center transition-colors cursor-pointer shadow-md">
                      <span>{uploadingBackdrop ? 'Uploading...' : 'Upload Background Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingBackdrop}
                        onChange={(e) => handleUploadFile(e, 'backdrop')}
                      />
                    </label>
                    <div className="text-[10px] text-slate-500 text-center mt-2">
                      High-resolution landscape 16:9 recommended
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Presets & Custom Styling */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 space-y-5">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Theme Color Presets & VIP Ticket Styling
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Choose a preset or customize colors, badge text, and fonts to your liking.
                  </p>
                </div>

                {/* 4 Clickable Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        theme: {
                          ...draft.theme,
                          stylePreset: 'classic-grand-prix',
                          primaryColor: '#E11D48',
                          secondaryColor: '#0F172A',
                          accentColor: '#38BDF8',
                          fontFamily: 'Outfit',
                        },
                      })
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      draft.theme.stylePreset === 'classic-grand-prix'
                        ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#E11D48]" />
                      <div className="w-4 h-4 rounded-full bg-[#38BDF8]" />
                      <div className="w-4 h-4 rounded-full bg-[#0F172A] border border-white/30" />
                    </div>
                    <div className="text-xs font-bold text-white">Classic Grand Prix</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Racing Red & Baby Blue</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        theme: {
                          ...draft.theme,
                          stylePreset: 'vintage-speedway',
                          primaryColor: '#DC2626',
                          secondaryColor: '#1E293B',
                          accentColor: '#0284C7',
                          fontFamily: 'Oswald',
                        },
                      })
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      draft.theme.stylePreset === 'vintage-speedway'
                        ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#DC2626]" />
                      <div className="w-4 h-4 rounded-full bg-[#0284C7]" />
                      <div className="w-4 h-4 rounded-full bg-[#FEF3C7]" />
                    </div>
                    <div className="text-xs font-bold text-white">Vintage Speedway</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Retro Bold Condensed</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        theme: {
                          ...draft.theme,
                          stylePreset: 'midnight-racer',
                          primaryColor: '#F43F5E',
                          secondaryColor: '#090D16',
                          accentColor: '#06B6D4',
                          fontFamily: 'Outfit',
                        },
                      })
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      draft.theme.stylePreset === 'midnight-racer'
                        ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#F43F5E]" />
                      <div className="w-4 h-4 rounded-full bg-[#06B6D4]" />
                      <div className="w-4 h-4 rounded-full bg-[#090D16] border border-white/30" />
                    </div>
                    <div className="text-xs font-bold text-white">Midnight Racer</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Asphalt & Electric Cyan</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        theme: {
                          ...draft.theme,
                          stylePreset: 'pastel-pitstop',
                          primaryColor: '#FB7185',
                          secondaryColor: '#1E1B4B',
                          accentColor: '#BAE6FD',
                          fontFamily: 'Plus Jakarta Sans',
                        },
                      })
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      draft.theme.stylePreset === 'pastel-pitstop'
                        ? 'bg-rose-950/60 border-rose-500 ring-1 ring-rose-500'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#FB7185]" />
                      <div className="w-4 h-4 rounded-full bg-[#BAE6FD]" />
                      <div className="w-4 h-4 rounded-full bg-[#FEF08A]" />
                    </div>
                    <div className="text-xs font-bold text-white">Pastel Pit Stop</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Soft Baby Nursery</div>
                  </button>
                </div>

                {/* VIP Pass Customization Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      TOP VIP BADGE TEXT
                    </label>
                    <input
                      type="text"
                      value={draft.theme.badgeText || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          theme: { ...draft.theme, badgeText: e.target.value },
                        })
                      }
                      placeholder="VIP PIT CREW PASS"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      TICKET NUMBER & ADMIT STAMP
                    </label>
                    <input
                      type="text"
                      value={draft.theme.ticketNumber || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          theme: { ...draft.theme, ticketNumber: e.target.value },
                        })
                      }
                      placeholder="PASS #001-LRP · ADMIT ONE"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      RACING FONT SELECTION
                    </label>
                    <select
                      value={draft.theme.fontFamily || 'Outfit'}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          theme: { ...draft.theme, fontFamily: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                    >
                      <option value="Outfit">Outfit (Bold Modern Geometric)</option>
                      <option value="Oswald">Oswald (Athletic Racing Condensed)</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans (Clean Minimal)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Overlay Opacity Slider */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Background Overlay Opacity
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {Math.round((draft.theme.overlayOpacity ?? 0.4) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.85"
                  step="0.05"
                  value={draft.theme.overlayOpacity ?? 0.4}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      theme: { ...draft.theme, overlayOpacity: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Additional Gallery Photos */}
              <div className="pt-6 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Photo Gallery Reel
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Additional photos displayed in Section E
                    </p>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingGallery ? 'Uploading...' : 'Add Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingGallery}
                      onChange={(e) => handleUploadFile(e, 'gallery')}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {draft.gallery?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-900 mb-2 relative">
                        <img
                          src={item.url}
                          alt={item.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryItem(item.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={item.ageMonth || ''}
                          placeholder="Age / Label"
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              gallery: draft.gallery.map((g) =>
                                g.id === item.id ? { ...g, ageMonth: e.target.value } : g
                              ),
                            })
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-rose-400 font-bold outline-none"
                        />
                        <input
                          type="text"
                          value={item.caption || ''}
                          placeholder="Caption..."
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              gallery: draft.gallery.map((g) =>
                                g.id === item.id ? { ...g, caption: e.target.value } : g
                              ),
                            })
                          }
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CANVA ANIMATIONS */}
          {activeTab === 'canva' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white">
                  Canva Presentation Effects
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Customize presentation animations, marquee text, and scroll checkpoint labels.
                </p>
              </div>

              {/* Canva Presentation Kinetic Text & Continuous Marquee */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Canva Presentation Kinetic Text Animation
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Smooth slide-in text motion that glides words and headings from left to right as guests scroll.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.theme.canvaAnimationEnabled ?? true}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          theme: { ...draft.theme, canvaAnimationEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
                    />
                    <span>Canva Slide FX Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    CONTINUOUS RACING MARQUEE TICKER TEXT
                  </label>
                  <input
                    type="text"
                    value={draft.theme.marqueeText || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        theme: { ...draft.theme, marqueeText: e.target.value },
                      })
                    }
                    placeholder={`🏁 ${draft.celebrantName.toUpperCase()} TURNS ONE 🏎️ GRAND PRIX CELEBRATION 🏁 FAST LANE TO FUN 🏎️ VIP PIT PASS ONLY 🏁`}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                  />
                  <div className="mt-2 p-2 rounded-xl bg-rose-950/40 border border-rose-800/40 overflow-hidden">
                    <div className="text-[10px] text-slate-400 uppercase font-mono tracking-widest mb-1">
                      Live Ticker Preview:
                    </div>
                    <div className="whitespace-nowrap text-xs font-black text-amber-300">
                      {draft.theme.marqueeText ||
                        `🏁 ${draft.celebrantName.toUpperCase()} TURNS ONE 🏎️ GRAND PRIX CELEBRATION 🏁 FAST LANE TO FUN 🏎️`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkpoint Lap Names Editor */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Scroll Checkpoint Lap Names
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Names that appear in the top center floating HUD pill as the guest scrolls through each section.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { key: 'lap1', label: 'Lap 1 (Hero/Grid)', def: 'LAP 1: STARTING GRID 🚦' },
                    { key: 'lap2', label: 'Lap 2 (Champion)', def: 'LAP 2: MEET THE CHAMPION 🏆' },
                    { key: 'lap3', label: 'Lap 3 (Clock)', def: 'LAP 3: LIVE RACE CLOCK ⏱️' },
                    { key: 'lap4', label: 'Lap 4 (Pit Stops)', def: 'LAP 4: PIT STOP SCHEDULE 🏎️' },
                    { key: 'lap5', label: 'Lap 5 (Photos)', def: 'LAP 5: PHOTO REEL 📸' },
                    { key: 'lap6', label: 'Lap 6 (Cheers)', def: 'LAP 6: GUEST CHEERS 💬' },
                    { key: 'lap7', label: 'Lap 7 (Circuit)', def: 'LAP 7: CIRCUIT LOCATION 🗺️' },
                    { key: 'finish', label: 'Finish Line (RSVP)', def: 'FINISH LINE: PIT PASS RSVP 🏁' },
                  ].map((l) => (
                    <div key={l.key}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {l.label}
                      </label>
                      <input
                        type="text"
                        value={draft.theme.lapNames?.[l.key as keyof typeof draft.theme.lapNames] || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            theme: {
                              ...draft.theme,
                              lapNames: {
                                ...draft.theme.lapNames,
                                [l.key]: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder={l.def}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PIT CREW FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white">
                  Pit Crew Logistics & FAQs
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage answers for parking, strollers, food, and toddler play.
                </p>
              </div>

              {/* FAQs Editor */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Frequently Asked Questions
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Help guests with arrival, nursery stations, and dress code.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(draft.faqs || []).map((faq) => (
                    <div
                      key={faq.id}
                      className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(faq.id)}
                        className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(faq.id, { question: e.target.value })}
                        placeholder="Question..."
                        className="w-5/6 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none focus:border-rose-500"
                      />

                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(faq.id, { answer: e.target.value })}
                        placeholder="Answer / guidelines..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none focus:border-rose-500 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: VENUE & MAP */}
          {activeTab === 'venue' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight text-white">
                  Venue & Google Maps Configuration
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure venue details, test Google Maps directions, and preview location.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    VENUE NAME
                  </label>
                  <input
                    type="text"
                    value={draft.venueName}
                    onChange={(e) => setDraft({ ...draft, venueName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    FULL STREET ADDRESS
                  </label>
                  <input
                    type="text"
                    value={draft.venueAddress}
                    onChange={(e) => setDraft({ ...draft, venueAddress: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    CUSTOM GOOGLE MAPS LINK (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={draft.googleMapsUrl || ''}
                    placeholder="https://maps.google.com/?q=..."
                    onChange={(e) => setDraft({ ...draft, googleMapsUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-rose-500 outline-none"
                  />
                </div>

                {/* Live Map Preview Frame */}
                <div className="pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    EMBEDDED MAP PREVIEW
                  </div>
                  <div className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <iframe
                      title="Admin venue map preview"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${draft.venueName}, ${draft.venueAddress}`
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: RSVPs & GUESTS */}
          {activeTab === 'rsvps' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                    Guest RSVPs
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    See who is coming and review their RSVP details.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleRefreshRsvps}
                    disabled={refreshingRsvps}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingRsvps ? 'animate-spin' : ''}`} />
                    <span>{refreshingRsvps ? 'Refreshing…' : 'Refresh'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadRsvps}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {rsvpSource === 'google-sheet' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white">Connected to your RSVP sheet</div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      New replies appear here when you refresh. Responses are stored in Google Sheets.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 self-start sm:self-auto">
                    {rsvps.length} {rsvps.length === 1 ? 'response' : 'responses'}
                  </span>
                </div>
              )}

              {/* RSVP Settings Bar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  RSVP Registration Controls
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      RSVP Deadline Date
                    </label>
                    <input
                      type="date"
                      value={draft.rsvpSettings?.deadline || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          rsvpSettings: { ...draft.rsvpSettings, deadline: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Max Guests Per Response
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={draft.rsvpSettings?.maxAttendeesPerRsvp || 5}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          rsvpSettings: {
                            ...draft.rsvpSettings,
                            maxAttendeesPerRsvp: parseInt(e.target.value) || 5,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Confirmation Message
                    </label>
                    <input
                      type="text"
                      value={draft.rsvpSettings?.customConfirmationMessage || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          rsvpSettings: {
                            ...draft.rsvpSettings,
                            customConfirmationMessage: e.target.value,
                          },
                        })
                      }
                      placeholder="You are in the VIP Pit Pass Lane!"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={rsvpSearch}
                    onChange={(e) => setRsvpSearch(e.target.value)}
                    placeholder="Search by guest name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs shrink-0 overflow-x-auto">
                  <button
                    onClick={() => setRsvpFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      rsvpFilter === 'all' ? 'bg-rose-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    All ({rsvps.length})
                  </button>
                  <button
                    onClick={() => setRsvpFilter('attending')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      rsvpFilter === 'attending' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Attending ({rsvps.filter((r) => r.attending).length})
                  </button>
                  <button
                    onClick={() => setRsvpFilter('declined')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      rsvpFilter === 'declined' ? 'bg-rose-800 text-white' : 'text-slate-400'
                    }`}
                  >
                    Declined ({rsvps.filter((r) => !r.attending).length})
                  </button>
                </div>
              </div>

              {/* Mobile Card View on small screens (< sm) */}
              <div className="block sm:hidden space-y-3">
                {filteredRsvps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                    No RSVP responses found.
                  </div>
                ) : (
                  filteredRsvps.map((rsvp) => (
                    <div
                      key={rsvp.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{rsvp.guestName}</div>
                          {rsvp.guestNames && rsvp.guestNames.length > 0 && (
                            <div className="text-[10px] text-slate-400">
                              + {rsvp.guestNames.join(', ')}
                            </div>
                          )}
                        </div>
                        {rsvpSource === 'google-sheet' ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            rsvp.attending
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {rsvp.attending ? 'Attending' : 'Declined'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleRsvpAttendance(rsvp)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              rsvp.attending
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {rsvp.attending ? 'Attending' : 'Declined'}
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 flex items-center justify-between pt-1 border-t border-slate-900">
                        <span>Guests: <strong className="text-amber-400">{rsvp.attending ? rsvp.attendeeCount : 0}</strong></span>
                        <span className="text-slate-400 text-[11px]">{rsvp.email || rsvp.phone || '—'}</span>
                      </div>

                      {rsvp.message && (
                        <div className="text-xs text-slate-300 italic">"{rsvp.message}"</div>
                      )}
                      {rsvp.dietaryNotes && (
                        <div className="text-[11px] text-amber-400 font-semibold">
                          Diet: {rsvp.dietaryNotes}
                        </div>
                      )}

                      {rsvpSource !== 'google-sheet' && (
                        <div className="text-right pt-1">
                          <button
                            onClick={() => handleDeleteRsvp(rsvp.id)}
                            className="text-xs text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Desktop / Tablet RSVPs Table on >= sm */}
              <div className="hidden sm:block rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4">Guest Name</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Attendees</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Message / Notes</th>
                        {rsvpSource !== 'google-sheet' && (
                          <th className="py-3 px-4 text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredRsvps.length === 0 ? (
                        <tr>
                          <td colSpan={rsvpSource === 'google-sheet' ? 5 : 6} className="py-8 text-center text-slate-500">
                            No RSVP responses found.
                          </td>
                        </tr>
                      ) : (
                        filteredRsvps.map((rsvp) => (
                          <tr key={rsvp.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">
                              {rsvp.guestName}
                              {rsvp.guestNames && rsvp.guestNames.length > 0 && (
                                <div className="text-[10px] text-slate-400 font-normal">
                                  + {rsvp.guestNames.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {rsvpSource === 'google-sheet' ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  rsvp.attending
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {rsvp.attending ? 'Attending' : 'Declined'}
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleToggleRsvpAttendance(rsvp)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                                    rsvp.attending
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  }`}
                                  title="Click to toggle attendance"
                                >
                                  {rsvp.attending ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Attending</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      <span>Declined</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-amber-400 tabular-nums">
                              {rsvp.attending ? rsvp.attendeeCount : 0}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">
                              <div>{rsvp.email || '—'}</div>
                              <div className="text-slate-500 text-[10px]">{rsvp.phone || ''}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                              {rsvp.message && <div>"{rsvp.message}"</div>}
                              {rsvp.dietaryNotes && (
                                <div className="text-[10px] text-amber-400 font-semibold">
                                  Diet: {rsvp.dietaryNotes}
                                </div>
                              )}
                            </td>
                            {rsvpSource !== 'google-sheet' && (
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteRsvp(rsvp.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete response"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <AdminLivePreviewModal
          draft={draft}
          published={published}
          onClose={() => setShowPreviewModal(false)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
};
