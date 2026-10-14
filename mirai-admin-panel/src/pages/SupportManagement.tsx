import React, { useState } from "react";
import { LifeBuoy } from "lucide-react";

import SupportCard from "../components/support/SupportCard";
import SupportSearch from "../components/support/SupportSearch";
import StatusFilter from "../components/support/StatusFilter";
import PriorityFilter from "../components/support/PriorityFilter";
import SupportDetailsModal from "../components/support/SupportDetailsModal";
import Pagination from "../components/feedback/Pagination";
import { useGetAllSupportQuery, type SupportTicket } from "../app/features/auth/supportApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getErrorMessage } from "../lib/errors";

export type { SupportTicket };

const PAGE_LIMIT = 10;

const SupportManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [page, setPage] = useState(1);

  // Pagination, filters and search (user name/email, subject, description, ticket number) are server-side.
  // Updating a ticket invalidates the "Support" tag, so this list refetches after a save.
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading, isFetching, error } = useGetAllSupportQuery({
    page,
    limit: PAGE_LIMIT,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    search: debouncedSearch || undefined,
  });

  const tickets = data?.data?.tickets ?? [];
  const stats = data?.data?.stats;
  const isFiltered = Boolean(statusFilter || priorityFilter || debouncedSearch);

  return (

    <div className="space-y-8">

      <div className="flex items-center justify-between gap-4 flex-wrap">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Support Management
          </h1>

          <p className="text-white/40 mt-1">
            Manage customer support tickets.
          </p>

        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {stats && (
            <div className="px-5 py-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/70 font-semibold text-sm">
                Open {stats.open ?? 0} · In progress {stats["in-progress"] ?? 0} · Resolved {stats.resolved ?? 0} · Closed {stats.closed ?? 0}
              </p>
            </div>
          )}
          <div className="px-5 py-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
            <p className="text-brand-cyan font-semibold">
              {isFiltered ? "Matching" : "Total"} Tickets : {data?.data?.total ?? 0}
            </p>
          </div>
        </div>

      </div>

      <div className="flex gap-4">

        <SupportSearch
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />

        <StatusFilter
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />

        <PriorityFilter
          value={priorityFilter}
          onChange={(v) => {
            setPriorityFilter(v);
            setPage(1);
          }}
        />

      </div>

      {error ? (
        <div className="text-red-500 text-center mt-10">
          Failed to load support tickets: {getErrorMessage(error)}
        </div>
      ) : isLoading ? (
        <div className="text-white text-center mt-10">Loading Tickets...</div>
      ) : tickets.length === 0 ? (

        <div className="glass-card rounded-3xl border border-white/5 p-12 flex flex-col items-center">

          <LifeBuoy
            size={70}
            className="text-white/20"
          />

          <h2 className="text-xl text-white mt-4">
            {isFetching ? "Searching..." : "No Support Tickets"}
          </h2>

        </div>

      ) : (

        <div className={`space-y-5 transition-opacity ${isFetching ? "opacity-60" : ""}`}>

          {tickets.map((ticket) => (

            <SupportCard
              key={ticket._id}
              ticket={ticket}
              onView={() => setSelectedTicket(ticket)}
            />

          ))}

        </div>

      )}

      <Pagination
        page={page}
        totalPages={data?.data?.totalPages ?? 1}
        onPageChange={setPage}
      />

      {selectedTicket && (
        <SupportDetailsModal
          key={selectedTicket._id}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
        />
      )}

    </div>

  );
};

export default SupportManagement;
