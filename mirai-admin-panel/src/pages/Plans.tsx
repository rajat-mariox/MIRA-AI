import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Edit2,
  Trash2,
  Plus,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  CreditCard,
  Hash
} from 'lucide-react';
import type { Plan } from '../types';
import { planService, type ApiPlan, type PlanInput } from '../services/plan.service';
import { getErrorMessage } from '../lib/errors';

type PlanForm = { packageName: string; numberOfQuestions: number; priceINR: number; status: 'Active' | 'Inactive' };

const emptyForm: PlanForm = { packageName: '', numberOfQuestions: 0, priceINR: 0, status: 'Active' };

const toPlan = (p: ApiPlan): Plan => ({
  id: p.id ?? p._id ?? '',
  packageName: p.title ?? '',
  numberOfQuestions: p.questionCount ?? 0,
  priceINR: p.price ?? 0,
  status: p.isActive ? 'Active' : 'Inactive',
  createdAt: p.createdAt
    ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—',
  raw: p,
});

const Plans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanForm>(emptyForm);

  const itemsPerPage = 6;
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await planService.getPlans();
        if (!cancelled) {
          setPlans(list.map(toPlan));
          setApiError(null);
        }
      } catch (err) {
        if (!cancelled) setApiError(getErrorMessage(err, 'Failed to load plans.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Actions
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await planService.deletePlan(id);
      reload();
    } catch (err) {
      setApiError(getErrorMessage(err, 'Failed to delete plan.'));
    }
  };

  /** Persists the Active/Inactive switch (PATCH { isActive }). */
  const handleToggleStatus = async (plan: Plan) => {
    const nextActive = plan.status !== 'Active';
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, status: nextActive ? 'Active' : 'Inactive' } : p)));
    try {
      const updated = await planService.updatePlan(plan.id, { isActive: nextActive });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? toPlan(updated) : p)));
      setApiError(null);
    } catch (err) {
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
      setApiError(getErrorMessage(err, 'Failed to update plan status.'));
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      packageName: plan.packageName,
      numberOfQuestions: plan.numberOfQuestions,
      priceINR: plan.priceINR,
      status: plan.status,
    });
    setFormError('');
    setIsAddingPlan(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const title = formData.packageName.trim();
    const price = Number(formData.priceINR) || 0;
    const questionCount = Number(formData.numberOfQuestions) || 0;
    const isActive = formData.status === 'Active';
    setIsSaving(true);
    try {
      if (editingPlan) {
        // Send only the fields this form edits and that actually changed, so badge/icon/validity/
        // sortOrder etc. configured elsewhere are never overwritten.
        const changes: PlanInput = {};
        if (title !== editingPlan.packageName) changes.title = title;
        if (price !== editingPlan.priceINR) {
          changes.price = price;
          // Keep the strike-through price sane (it must not be below the selling price).
          const original = editingPlan.raw?.originalPrice;
          if (original === undefined || original < price) changes.originalPrice = price;
        }
        if (questionCount !== editingPlan.numberOfQuestions) changes.questionCount = questionCount;
        if (isActive !== (editingPlan.status === 'Active')) changes.isActive = isActive;
        if (Object.keys(changes).length > 0) await planService.updatePlan(editingPlan.id, changes);
      } else {
        const nextSort = plans.reduce((max, p) => Math.max(max, p.raw?.sortOrder ?? 0), 0) + 1;
        await planService.createPlan({
          title,
          price,
          originalPrice: price,
          questionCount,
          planType: 'question_based',
          isActive,
          sortOrder: nextSort,
        });
      }
      reload();
      closeModal();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save plan.'));
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsAddingPlan(false);
    setEditingPlan(null);
    setFormError('');
    setFormData(emptyForm);
  };

  // Filter Logic
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = plan.packageName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || plan.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginatedPlans = filteredPlans.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Subscription Plans</h1>
          <p className="text-white/30 text-sm font-medium">Manage user question packages and pricing strategy.</p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setFormError(''); setIsAddingPlan(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-cyan text-dark-bg font-bold shadow-lg shadow-brand-cyan/20 active:scale-95 transition-all w-full md:w-auto hover:brightness-110"
        >
          <Plus className="w-5 h-5" />
          Create New Plan
        </button>
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
              placeholder="Search by package name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30 font-bold uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none cursor-pointer hover:bg-white/10 transition-all"
              >
                <option className="bg-dark-bg" value="All">All Status</option>
                <option className="bg-dark-bg" value="Active">Active Only</option>
                <option className="bg-dark-bg" value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plans Grid/List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Package Name</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Questions</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Price (INR)</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">Publication Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/30 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan/20 to-brand-cyan/5 flex items-center justify-center text-brand-cyan border border-brand-cyan/20 shadow-inner">
                        <Zap className="w-5 h-5 fill-brand-cyan" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm group-hover:text-brand-cyan transition-colors">{plan.packageName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-white/30">
                          <Clock className="w-3 h-3" />
                          {plan.raw?.validityText ? `${plan.raw.validityText} · ` : ''}Created on {plan.createdAt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-brand-cyan font-bold">
                    <span className="flex items-center gap-1 font-sans">
                      <Hash className="w-3.5 h-3.5 opacity-50 text-white" />
                      {plan.numberOfQuestions}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    <span className="flex items-center gap-1 font-sans">
                      <CreditCard className="w-3.5 h-3.5 opacity-50" />
                      ₹{(plan.priceINR ?? 0).toLocaleString('en-IN')}
                      {plan.raw?.originalPrice && plan.raw.originalPrice > plan.priceINR ? (
                        <span className="text-xs text-white/30 line-through font-medium ml-1">
                          ₹{plan.raw.originalPrice.toLocaleString('en-IN')}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        title={plan.status === 'Active' ? 'Hide plan' : 'Publish plan'}
                        className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none border border-white/10 ${plan.status === 'Active' ? 'bg-emerald-500/20' : 'bg-white/5'
                          }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-300 ${plan.status === 'Active'
                            ? 'translate-x-5 bg-emerald-400'
                            : 'translate-x-0 bg-white/20'
                            }`}
                        />
                      </button>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${plan.status === 'Active' ? 'text-emerald-400' : 'text-white/30'
                        }`}>
                        {plan.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(plan)}
                        title="Edit Plan"
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-brand-cyan transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        title="Delete Plan"
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

          {filteredPlans.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-center opacity-40">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="font-medium italic text-white/50">
                {isLoading ? 'Loading plans...' : 'No subscription plans found matching your search.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredPlans.length > 0 && (
          <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-xs text-white/30 font-medium">
              Showing <span className="text-white">{(page - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(page * itemsPerPage, filteredPlans.length)}</span> of <span className="text-white">{filteredPlans.length}</span> plans
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

      {/* Plan Details Modal (Add/Edit) */}
      {isAddingPlan && (
        <div className="fixed inset-0 !mt-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal} />
          <div className="relative glass-card w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                <p className="text-xs text-white/30 font-medium mt-1">Configure your subscription offering details.</p>
              </div>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-all p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Package Display Name</label>
                <div className="relative group">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan group-focus-within:animate-pulse" />
                  <input
                    type="text"
                    placeholder="e.g. Pro Developer"
                    value={formData.packageName}
                    maxLength={100}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Total Questions</label>
                  <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="number"
                      placeholder="100"
                      value={Number.isFinite(formData.numberOfQuestions) ? formData.numberOfQuestions : ''}
                      onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value, 10) })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-semibold"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Price (INR)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30 font-sans">₹</span>
                    <input
                      type="number"
                      placeholder="999"
                      value={Number.isFinite(formData.priceINR) ? formData.priceINR : ''}
                      onChange={(e) => setFormData({ ...formData, priceINR: parseFloat(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-semibold"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-1">Default Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanForm['status'] })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-semibold cursor-pointer appearance-none"
                >
                  <option className="bg-dark-bg" value="Active">Active & Listed</option>
                  <option className="bg-dark-bg" value="Inactive">Hidden / Draft</option>
                </select>
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {formError}
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all font-bold text-sm tracking-wider"
                >
                  DISCARD
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-4 rounded-2xl bg-brand-cyan hover:opacity-90 text-dark-bg shadow-xl shadow-brand-cyan/20 transition-all font-extrabold text-sm tracking-widest disabled:opacity-50"
                >
                  {isSaving ? 'SAVING...' : editingPlan ? 'UPDATE PLAN' : 'CREATE PLAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
