import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Mail,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Bell,
  X
} from 'lucide-react';
import { userService, type User } from '../services/user.service';
import { getErrorMessage } from '../lib/errors';
import SendPushModal from '../components/notifications/SendPushModal';

type EditForm = { _id: string; name: string; email: string; gender: '' | NonNullable<User['gender']> };

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [profileFilter, setProfileFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<EditForm | null>(null);
  const [notifyUser, setNotifyUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await userService.listUsers();
        if (!cancelled) {
          setUsers(list);
          setApiError(null);
        }
      } catch (err) {
        if (!cancelled) setApiError(getErrorMessage(err, 'Failed to load users.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Actions
  const handleDelete = async (user: User) => {
    if (!confirm(`Delete ${user.name || user.email || 'this user'}? This removes the account and its data (transactions are kept).`)) return;
    try {
      await userService.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setApiError(null);
    } catch (err) {
      setApiError(getErrorMessage(err, 'Failed to delete user.'));
    }
  };

  const handleToggleStatus = async (id: string) => {
    const current = users.find((u) => u._id === id);
    if (!current) return;
    const nextStatus = current.status === 'Active' ? 'Inactive' : 'Active';
    if (nextStatus === 'Inactive' && !confirm('Deactivate this user? They will be logged out on all devices.')) return;
    try {
      const updated = await userService.updateUser(id, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
      setApiError(null);
    } catch (err) {
      setApiError(getErrorMessage(err, 'Failed to update user.'));
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser({ _id: user._id, name: user.name ?? '', email: user.email ?? '', gender: user.gender ?? '' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const original = users.find((u) => u._id === editingUser._id);
    // Send only what changed (the backend whitelists fullName/email/gender/isActive).
    const update: Parameters<typeof userService.updateUser>[1] = {};
    if (editingUser.name.trim() !== (original?.name ?? '')) update.name = editingUser.name.trim();
    if (editingUser.email.trim() !== (original?.email ?? '')) update.email = editingUser.email.trim();
    if (editingUser.gender && editingUser.gender !== original?.gender) update.gender = editingUser.gender;
    if (Object.keys(update).length === 0) {
      setEditingUser(null);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await userService.updateUser(editingUser._id, update);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setEditingUser(null);
      setApiError(null);
    } catch (err) {
      setApiError(getErrorMessage(err, 'Failed to save user.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Logic
  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter(user => {
      const name = (user.name ?? '').toLowerCase();
      const email = (user.email ?? '').toLowerCase();
      const matchesSearch = name.includes(term) || email.includes(term);
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      const matchesProfile =
        profileFilter === 'All' ||
        (profileFilter === 'Complete' ? user.isProfileComplete : !user.isProfileComplete);
      return matchesSearch && matchesStatus && matchesProfile;
    });
  }, [users, search, statusFilter, profileFilter]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-white/30 text-sm font-medium">App user directory and access control.</p>
        </div>
      </div>

      {apiError ? (
        <div className="glass-card p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-sm">
          {apiError}
        </div>
      ) : null}

      <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        {/* Filters Header */}
        <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 font-bold uppercase tracking-wider">Profile:</span>
              <select
                value={profileFilter}
                onChange={(e) => { setProfileFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none cursor-pointer hover:bg-white/10 transition-all"
              >
                <option className="bg-dark-bg" value="All">All Profiles</option>
                <option className="bg-dark-bg" value="Complete">Complete</option>
                <option className="bg-dark-bg" value="Incomplete">Incomplete</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 font-bold uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none cursor-pointer hover:bg-white/10 transition-all"
              >
                <option className="bg-dark-bg" value="All">All Status</option>
                <option className="bg-dark-bg" value="Active">Active</option>
                <option className="bg-dark-bg" value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">User</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Gender</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Profile / Wallet</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Access Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Joined Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 flex items-center justify-center text-white/50 font-bold border border-white/10">
                        {(user.name?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm group-hover:text-brand-cyan transition-colors">{user.name || '—'}</p>
                        <div className="flex items-center gap-1.5 text-xs text-white/30">
                          <Mail className="w-3 h-3" />
                          {user.email ?? '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white/60 font-medium">{user.gender ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${user.isProfileComplete ? 'text-brand-cyan' : 'text-white/20'}`} />
                      <div>
                        <span className="text-sm text-white/60 font-medium">{user.isProfileComplete ? 'Complete' : 'Incomplete'}</span>
                        <p className="text-[10px] text-white/30 font-bold">₹{user.walletBalance.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(user._id)}
                        title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none border border-white/10 ${user.status === 'Active' ? 'bg-emerald-500/20' : 'bg-white/5'
                          }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-300 ${user.status === 'Active'
                            ? 'translate-x-5 bg-emerald-400'
                            : 'translate-x-0 bg-white/20'
                            }`}
                        />
                      </button>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${user.status === 'Active' ? 'text-emerald-400' : 'text-white/30'}`}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(user.joined)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 transition-opacity">
                      <button
                        onClick={() => setNotifyUser(user)}
                        title="Send Test Notification"
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-brand-cyan transition-all"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        title="Edit Details"
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-brand-cyan transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        title="Delete Account"
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

          {filteredUsers.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-center opacity-40">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="font-medium italic">
                {isLoading ? 'Loading users...' : users.length === 0 ? 'No users yet.' : 'No users found matching your search.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-xs text-white/30 font-medium">
              Showing <span className="text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(page * itemsPerPage, filteredUsers.length)}</span> of <span className="text-white">{filteredUsers.length}</span> results
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${page === i + 1 ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 !mt-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          <div className="relative glass-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 ml-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 ml-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 ml-1">Gender</label>
                <select
                  value={editingUser.gender}
                  onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value as EditForm['gender'] })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium"
                >
                  {editingUser.gender === '' && <option className="bg-dark-bg" value="">Not set</option>}
                  <option className="bg-dark-bg" value="Male">Male</option>
                  <option className="bg-dark-bg" value="Female">Female</option>
                  <option className="bg-dark-bg" value="Other">Other</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-brand-cyan hover:opacity-90 text-white shadow-lg shadow-brand-cyan/20 transition-all font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notifyUser && (
        <SendPushModal
          userId={notifyUser._id}
          userLabel={notifyUser.name || notifyUser.email || notifyUser._id}
          onClose={() => setNotifyUser(null)}
        />
      )}
    </div>
  );
};

export default Users;
