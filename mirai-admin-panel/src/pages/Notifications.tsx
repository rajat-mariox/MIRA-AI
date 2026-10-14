import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Send,
  Target,
  Calendar,
  Plus,
  Search,
  Mail,
  MessageSquare,
  Smartphone,
  Star,
  Eye,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';

import { adminService } from '../services/admin.service';
import { userService, type User } from '../services/user.service';
import { getErrorMessage, getErrorStatus } from '../lib/errors';

type Category = 'Horoscope' | 'Prediction' | 'Event' | 'Promo';

interface NotificationBatch {
  id: string;
  title: string;
  type: Category | 'Reminder';
  channels: string[];
  /** Saved = in the app inbox, but no push was delivered (push not configured / no devices / FCM error) */
  status: 'Sent' | 'Partial' | 'Saved' | 'Failed';
  sentAt: string;
  target: string;
  detail: string;
  stats: {
    /** device tokens targeted */
    sent: number;
    /** devices FCM accepted */
    delivered: number;
  };
}

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'Horoscope', label: 'Daily Horoscope' },
  { value: 'Prediction', label: 'Personal Prediction' },
  { value: 'Event', label: 'Astrological Event' },
  { value: 'Promo', label: 'Promo / Offer' },
];

/** App screens a tapped notification can open (sent as data.screen). */
const SCREENS: Array<{ value: string; label: string }> = [
  { value: 'Home', label: 'Home' },
  { value: 'Horoscope', label: 'Horoscope' },
  { value: 'Panchang', label: 'Panchang' },
  { value: 'Kundli', label: 'Kundli' },
  { value: 'Wallet', label: 'Wallet' },
  { value: 'Plans', label: 'Plans' },
  { value: 'Notification', label: 'Notifications' },
];

/** True when the backend saved the notification in the app inbox even though the push failed. */
function wasSaved(err: unknown): boolean {
  const e = err as { response?: { data?: { data?: { saved?: unknown } } } };
  return e?.response?.data?.data?.saved === true;
}

/**
 * "Specific user" -> POST /admin/users/test-notification, "All users" -> POST
 * /admin/users/broadcast-notification. The backend saves every notification in the app's in-app
 * inbox first, then pushes it via FCM (503 while Firebase is not configured on the server).
 * There is no history endpoint, so the table lists what was sent from this browser tab only.
 */
const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationBatch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Horoscope');
  const [message, setMessage] = useState('');
  const [screen, setScreen] = useState('Home');
  const [targeting, setTargeting] = useState<'user' | 'all'>('user');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState<User[] | null>(null);
  const [usersError, setUsersError] = useState('');
  const [formError, setFormError] = useState('');
  const [progress, setProgress] = useState('');
  const [notice, setNotice] = useState('');
  const [isSending, setIsSending] = useState(false);

  const openModal = async () => {
    setFormError('');
    setProgress('');
    setIsModalOpen(true);
    if (users) return;
    try {
      const list = await userService.listUsers();
      setUsers(list);
      setUsersError('');
    } catch (err) {
      setUsersError(getErrorMessage(err, 'Failed to load users.'));
    }
  };

  const activeUsers = useMemo(() => (users ?? []).filter((u) => u.status === 'Active'), [users]);

  const handleSend = async () => {
    setFormError('');
    setProgress('');
    setNotice('');
    if (!title.trim() || !message.trim()) {
      setFormError('Title and message are required.');
      return;
    }
    const isAll = targeting === 'all';
    const targetUser = isAll ? undefined : activeUsers.find((u) => u._id === userId);
    if (!isAll && !targetUser) {
      setFormError('Select a user.');
      return;
    }

    setIsSending(true);
    if (isAll) setProgress('Sending broadcast...');
    const payload = {
      title: title.trim(),
      body: message.trim(),
      screen,
      data: { category: category.toLowerCase() },
    };

    let status: NotificationBatch['status'];
    let detail: string;
    let tokens = 0;
    let delivered = 0;
    try {
      const res = targetUser
        ? await adminService.sendTestNotification({ userId: targetUser._id, ...payload })
        : await adminService.sendBroadcastNotification(payload);
      tokens = res.data.tokens;
      delivered = res.data.successCount;
      status = delivered > 0 ? (res.data.failureCount ? 'Partial' : 'Sent') : tokens ? 'Failed' : 'Saved';
      detail = tokens
        ? `Saved in app · ${delivered}/${tokens} devices accepted the push`
        : 'Saved in app · no registered devices yet';
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to send notification.');
      // The backend saves the notification in the app inbox BEFORE pushing: 503 (push not configured),
      // 400 (no devices) and 502 (FCM error) still carry `data.saved = true`.
      status = wasSaved(err) ? 'Saved' : 'Failed';
      detail = msg;
      if (status === 'Saved') setNotice(msg);
      if (getErrorStatus(err) === 401 || status === 'Failed') {
        setIsSending(false);
        setProgress('');
        setFormError(msg);
        return;
      }
    }

    setIsSending(false);
    setProgress('');

    const target = isAll
      ? `All users${users ? ` (${activeUsers.length} active)` : ''}`
      : targetUser!.name || targetUser!.email || targetUser!._id;

    setNotifications((prev) => [
      {
        id: `${Date.now()}`,
        title: title.trim(),
        type: category,
        channels: ['Push'],
        status,
        sentAt: new Date().toLocaleString('en-IN'),
        target,
        detail,
        stats: { sent: tokens, delivered },
      },
      ...prev,
    ]);

    setIsModalOpen(false);
    setTitle('');
    setMessage('');
  };

  const filtered = notifications.filter((n) =>
    `${n.title} ${n.target}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white">Notification Center</h1>
          <p className="text-white/30 text-sm font-medium">Broadcast planetary shifts and personalized astrology alerts.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-brand-cyan hover:bg-brand-cyan/90 text-dark-bg font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-brand-cyan/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Broadcast
        </button>
      </div>


      {notice && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-300 flex items-start justify-between gap-4">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-amber-300/60 hover:text-amber-200" title="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Broadcaster Table */}
      <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 transition-all font-medium"
            />
          </div>
          <p className="text-xs text-white/30 font-medium">Push only · history shown for this session</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Title</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Channels</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Targeting</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Metrics</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((notif) => (
                <tr key={notif.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan/10 to-transparent flex items-center justify-center text-brand-cyan font-bold border border-brand-cyan/20">
                        {notif.type === 'Horoscope' ? <Star className="w-5 h-5" /> :
                          notif.type === 'Event' ? <Calendar className="w-5 h-5" /> :
                            notif.type === 'Promo' ? <Target className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm group-hover:text-brand-cyan transition-colors">{notif.title}</p>
                        <p className="text-[10px] text-white/30">{notif.sentAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {notif.channels.map(c => (
                        <div key={c} className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors" title={c}>
                          {c === 'Push' ? <Smartphone className="w-3.5 h-3.5" /> :
                            c === 'Email' ? <Mail className="w-3.5 h-3.5" /> :
                              c === 'SMS' ? <MessageSquare className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-white/60 font-medium px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                      {notif.target}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit
                      ${notif.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        notif.status === 'Partial' || notif.status === 'Saved' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${notif.status === 'Sent' ? 'bg-emerald-400' : notif.status === 'Partial' || notif.status === 'Saved' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      {notif.status}
                    </span>
                    <p className="text-[10px] text-white/30 mt-1 max-w-xs">{notif.detail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 w-32">
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>Delivery</span>
                        <span>{notif.stats.sent > 0 ? ((notif.stats.delivered / notif.stats.sent) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-cyan transition-all duration-1000"
                          style={{ width: `${notif.stats.sent > 0 ? (notif.stats.delivered / notif.stats.sent) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                        title="Remove from list"
                        className="p-2 hover:bg-rose-500/10 rounded-lg text-white/40 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center text-center opacity-40">
              <Bell className="w-12 h-12 mb-4" />
              <p className="font-medium italic">No broadcasts sent in this session yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Broadcast Modal */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => !isSending && setIsModalOpen(false)}
            />

            {/* Modal */}
            <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">

              {/* Header */}
              <div className="sticky top-0 z-10 p-6 border-b border-white/5 flex items-center justify-between bg-[#111827]">

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Create Astrology Broadcast
                    </h2>
                    <p className="text-xs text-white/40 italic">
                      Push notification to a user's registered devices.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSending}
                  className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
                >
                  <X className="w-6 h-6" />
                </button>

              </div>

              {/* Body */}
              <div className="p-8 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      maxLength={200}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Mercury Retrograde Alert"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} className="bg-[#111827]" value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
                    Message Content
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    maxLength={1000}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Draft your prediction or alert message..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
                    Open Screen
                  </label>
                  <select
                    value={screen}
                    onChange={(e) => setScreen(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                  >
                    {SCREENS.map((s) => (
                      <option key={s.value} className="bg-[#111827]" value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white/30 ml-1">App screen opened when the user taps the notification.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
                      Channels
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {['Push', 'Email', 'SMS', 'In-App'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          disabled={c !== 'Push'}
                          title={c === 'Push' ? 'Push notification (FCM)' : 'Not supported by the backend yet'}
                          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                            c === 'Push'
                              ? 'border-brand-cyan/50 text-brand-cyan bg-brand-cyan/10'
                              : 'border-white/10 text-white/20 cursor-not-allowed'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
                      Targeting
                    </label>
                    <select
                      value={targeting}
                      onChange={(e) => setTargeting(e.target.value as 'user' | 'all')}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                    >
                      <option className="bg-[#111827]" value="user">Specific User</option>
                      <option className="bg-[#111827]" value="all">
                        All Users{users ? ` (${activeUsers.length} active)` : ''}
                      </option>
                    </select>
                  </div>

                </div>

                {targeting === 'user' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1">
                      User
                    </label>
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
                    >
                      <option className="bg-[#111827]" value="">
                        {users ? 'Select a user...' : usersError ? 'Users unavailable' : 'Loading users...'}
                      </option>
                      {activeUsers.map((u) => (
                        <option key={u._id} className="bg-[#111827]" value={u._id}>
                          {u.name ? `${u.name} (${u.email})` : u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {usersError && <p className="text-sm text-rose-300">{usersError}</p>}
                {formError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {formError}
                  </div>
                )}
                {progress && <p className="text-sm text-white/50">{progress}</p>}

                <div className="pt-6 flex gap-4">

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSending}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="flex-1 py-4 rounded-2xl bg-brand-cyan hover:bg-brand-cyan/90 text-dark-bg shadow-xl shadow-brand-cyan/20 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isSending ? 'Sending...' : 'Broadcast Now'}
                  </button>

                </div>

              </div>

            </div>

          </div>,

          document.body
        )
      }

    </div>
  );
};

export default Notifications;
