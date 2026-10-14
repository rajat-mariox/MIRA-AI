import React, { useState } from "react";
import { Inbox, Users, Sparkles, PhoneCall, BadgeCheck, Search, RefreshCw, type LucideIcon } from "lucide-react";

import LeadCard from "../components/leads/LeadCard";
import LeadDetailsModal from "../components/leads/LeadDetailsModal";
import Pagination from "../components/feedback/Pagination";
import { useGetLeadsQuery, type Lead } from "../app/features/auth/leadsApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getErrorMessage } from "../lib/errors";
import { LEAD_STATUSES, LEAD_STATUS_META } from "../lib/leads";

const PAGE_LIMIT = 10;

const StatCard: React.FC<{ label: string; value: number | string; icon: LucideIcon; tone: string }> = ({
  label,
  value,
  icon: Icon,
  tone,
}) => (
  <div className="glass-card p-6 rounded-3xl border border-white/5 flex items-center gap-4">
    <div className={`p-3 rounded-2xl ${tone}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-white/40 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</p>
    </div>
  </div>
);

const LeadSkeleton = () => (
  <div className="glass-card rounded-3xl border border-white/5 p-6 animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-3">
        <div className="h-5 w-48 rounded-lg bg-white/10" />
        <div className="h-4 w-64 rounded-lg bg-white/5" />
      </div>
      <div className="h-10 w-20 rounded-xl bg-white/5" />
    </div>
    <div className="mt-6 space-y-2">
      <div className="h-4 w-1/3 rounded-lg bg-white/10" />
      <div className="h-4 w-full rounded-lg bg-white/5" />
      <div className="h-4 w-2/3 rounded-lg bg-white/5" />
    </div>
    <div className="mt-6 pt-5 border-t border-white/5 flex justify-between">
      <div className="h-6 w-24 rounded-full bg-white/5" />
      <div className="h-5 w-20 rounded-lg bg-white/5" />
    </div>
  </div>
);

const LeadsManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [page, setPage] = useState(1);

  // Pagination, status filter and search (name, email, subject, phone) are server-side.
  // Saving or deleting a lead invalidates the "Lead" tag, so this list refetches.
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading, isFetching, error, refetch } = useGetLeadsQuery({
    page,
    limit: PAGE_LIMIT,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  });

  const leads = data?.data?.leads ?? [];
  const stats = data?.data?.stats;
  const isFiltered = Boolean(statusFilter || debouncedSearch);
  const totalPages = data?.data?.totalPages ?? 1;
  // Deleting the last lead of the last page: step back to the new last page.
  if (data && totalPages > 0 && page > totalPages) setPage(totalPages);

  const pills: Array<{ value: string; label: string; count?: number }> = [
    { value: "", label: "All", count: stats?.total },
    ...LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_META[s].label, count: stats?.[s] })),
  ];

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-white/40 mt-1">Enquiries submitted through the website contact form.</p>
        </div>

        <div className="px-5 py-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
          <p className="text-brand-cyan font-semibold">
            {isFiltered ? "Matching" : "Total"} Leads : {data?.data?.total ?? 0}
          </p>
        </div>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total Leads" value={stats?.total ?? "–"} icon={Users} tone="bg-brand-cyan/10 text-brand-cyan" />
        <StatCard label="New" value={stats?.new ?? "–"} icon={Sparkles} tone="bg-blue-500/10 text-blue-400" />
        <StatCard label="Contacted" value={stats?.contacted ?? "–"} icon={PhoneCall} tone="bg-yellow-500/10 text-yellow-400" />
        <StatCard label="Converted" value={stats?.converted ?? "–"} icon={BadgeCheck} tone="bg-green-500/10 text-green-400" />
      </div>

      {/* Search + status filter */}

      <div className="space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone or subject..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-brand-cyan transition"
          />
        </div>

        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter by status">
          {pills.map((p) => {
            const active = statusFilter === p.value;
            return (
              <button
                key={p.value || "all"}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setStatusFilter(p.value);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition flex items-center gap-2 ${
                  active
                    ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p.value ? <span className={`w-2 h-2 rounded-full ${LEAD_STATUS_META[p.value as keyof typeof LEAD_STATUS_META].dot}`} /> : null}
                {p.label}
                {p.count !== undefined ? <span className={active ? "text-brand-cyan/70" : "text-white/30"}>{p.count}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}

      {error ? (
        <div className="glass-card rounded-3xl border border-red-500/20 bg-red-500/5 p-10 flex flex-col items-center text-center">
          <p className="text-red-400">Failed to load leads: {getErrorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="mt-5 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-5">
          <LeadSkeleton />
          <LeadSkeleton />
          <LeadSkeleton />
        </div>
      ) : leads.length === 0 ? (
        <div className="glass-card rounded-3xl border border-white/5 p-12 flex flex-col items-center text-center">
          <Inbox size={70} className="text-white/20" />
          <h2 className="text-xl text-white mt-4">
            {isFetching ? "Searching..." : isFiltered ? "No Matching Leads" : "No Leads Yet"}
          </h2>
          <p className="text-white/40 mt-2">
            {isFiltered
              ? "Try a different search or status."
              : "Messages sent from the website contact form will appear here."}
          </p>
        </div>
      ) : (
        <div className={`space-y-5 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {leads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} onView={() => setSelectedLead(lead)} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {selectedLead && (
        <LeadDetailsModal key={selectedLead._id} lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

    </div>
  );
};

export default LeadsManagement;
