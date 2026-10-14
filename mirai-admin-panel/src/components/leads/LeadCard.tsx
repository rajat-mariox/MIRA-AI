import React from "react";
import { Mail, Phone, Clock, Eye, Globe } from "lucide-react";

import type { Lead } from "../../app/features/auth/leadsApi";
import { LEAD_STATUS_META, formatDateTime, timeAgo } from "../../lib/leads";

interface LeadCardProps {
  lead: Lead;
  onView: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onView }) => {
  const meta = LEAD_STATUS_META[lead.status] ?? LEAD_STATUS_META.new;

  return (
    <div className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand-cyan/20 transition-all duration-300">

      {/* Header */}

      <div className="flex justify-between items-start gap-4">

        <div className="min-w-0">

          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-white break-words">{lead.name}</h2>
            {lead.status === "new" && <span className={`w-2 h-2 rounded-full ${meta.dot}`} title="New lead" />}
          </div>

          <div className="flex items-center gap-x-5 gap-y-1 mt-2 text-white/50 text-sm flex-wrap">
            <span className="flex items-center gap-2 break-all">
              <Mail size={15} />
              {lead.email}
            </span>
            {lead.phone ? (
              <span className="flex items-center gap-2">
                <Phone size={15} />
                {lead.phone}
              </span>
            ) : null}
          </div>

        </div>

        <button
          onClick={onView}
          className="px-4 py-2 rounded-xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition flex items-center gap-2 shrink-0"
        >
          <Eye size={18} />
          View
        </button>

      </div>

      {/* Subject + message */}

      <div className="mt-5">
        <p className="text-white font-semibold">{lead.subject}</p>
        <p className="text-white/60 leading-7 line-clamp-2 mt-1 whitespace-pre-line">{lead.message}</p>
      </div>

      {/* Footer */}

      <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center gap-3 flex-wrap">

        <div className="flex gap-3 items-center flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${meta.badge}`}>{meta.label}</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/50 border border-white/10 flex items-center gap-1.5">
            <Globe size={12} />
            {lead.source || "website"}
            {lead.page ? ` · ${lead.page}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 text-white/40 text-sm" title={formatDateTime(lead.createdAt)}>
          <Clock size={15} />
          {timeAgo(lead.createdAt)}
        </div>

      </div>

    </div>
  );
};

export default LeadCard;
