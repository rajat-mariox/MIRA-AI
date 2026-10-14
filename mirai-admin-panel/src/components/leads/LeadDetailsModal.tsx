import React, { useState } from "react";
import { X, Save, User, Mail, Phone, Calendar, Copy, Check, Send, PhoneCall, Trash2, Globe } from "lucide-react";

import {
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  type Lead,
  type LeadStatus,
} from "../../app/features/auth/leadsApi";
import { LEAD_STATUSES, LEAD_STATUS_META, formatDateTime, timeAgo } from "../../lib/leads";
import { getErrorMessage } from "../../lib/errors";
import DeleteLeadModal from "./DeleteLeadModal";

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
}

const CopyButton: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (non-secure context): nothing to do
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      className="p-1.5 rounded-lg text-white/40 hover:text-brand-cyan hover:bg-white/5 transition"
    >
      {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
    </button>
  );
};

/**
 * Rendered only while open and keyed by lead id: the form starts from the list row (same shape
 * as the detail endpoint); the detail query refreshes the read-only fields.
 */
const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead: initial, onClose }) => {
  const [status, setStatus] = useState<LeadStatus>(initial.status);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data } = useGetLeadByIdQuery(initial._id);
  const lead: Lead = data?.data?.lead ?? initial;
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

  const dirty = status !== (lead.status ?? "new") || notes.trim() !== (lead.notes ?? "");
  const mailto = `mailto:${lead.email}?subject=${encodeURIComponent(`Re: ${lead.subject}`)}`;

  const handleSave = async () => {
    setError("");
    try {
      await updateLead({ id: lead._id, status, notes: notes.trim() }).unwrap();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update lead."));
    }
  };

  return (
    <div className="fixed inset-0 !mt-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 overflow-y-auto">

      <div className="w-full max-w-4xl rounded-3xl bg-[#16181D] border border-white/10 shadow-2xl my-auto">

        {/* Header */}

        <div className="flex justify-between items-center px-8 py-6 border-b border-white/10">

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-white">Lead Details</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${LEAD_STATUS_META[lead.status]?.badge ?? ""}`}>
                {LEAD_STATUS_META[lead.status]?.label ?? lead.status}
              </span>
            </div>
            <p className="text-white/40 mt-1">
              Website enquiry received {timeAgo(lead.createdAt)}.
            </p>
          </div>

          <button onClick={onClose} className="text-white/40 hover:text-white" aria-label="Close">
            <X size={24} />
          </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-8">

          {/* Contact */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="flex items-center gap-3">
              <User className="text-brand-cyan shrink-0" />
              <div className="min-w-0">
                <p className="text-white/40 text-sm">Name</p>
                <p className="text-white font-semibold break-words">{lead.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="text-brand-cyan shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white/40 text-sm">Email</p>
                <div className="flex items-center gap-1">
                  <a href={mailto} className="text-white font-semibold break-all hover:text-brand-cyan transition">{lead.email}</a>
                  <CopyButton value={lead.email} label="email" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="text-brand-cyan shrink-0" />
              <div className="min-w-0">
                <p className="text-white/40 text-sm">Phone</p>
                {lead.phone ? (
                  <div className="flex items-center gap-1">
                    <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="text-white font-semibold hover:text-brand-cyan transition">
                      {lead.phone}
                    </a>
                    <CopyButton value={lead.phone} label="phone" />
                  </div>
                ) : (
                  <p className="text-white/40 font-semibold">Not provided</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="text-brand-cyan shrink-0" />
              <div>
                <p className="text-white/40 text-sm">Received</p>
                <p className="text-white font-semibold">{formatDateTime(lead.createdAt)}</p>
                {lead.updatedAt && lead.updatedAt !== lead.createdAt ? (
                  <p className="text-white/40 text-xs mt-0.5">Updated {formatDateTime(lead.updatedAt)}</p>
                ) : null}
              </div>
            </div>

          </div>

          {/* Quick actions */}

          <div className="flex gap-3 flex-wrap">
            <a
              href={mailto}
              className="px-4 py-2 rounded-xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition flex items-center gap-2 text-sm font-semibold"
            >
              <Send size={16} />
              Reply by email
            </a>
            {lead.phone ? (
              <a
                href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition flex items-center gap-2 text-sm font-semibold"
              >
                <PhoneCall size={16} />
                Call
              </a>
            ) : null}
          </div>

          {/* Subject */}

          <div>
            <label className="block text-white/70 mb-2">Subject</label>
            <input value={lead.subject} disabled className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white" />
          </div>

          {/* Message */}

          <div>
            <label className="block text-white/70 mb-2">Message</label>
            <div className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white whitespace-pre-wrap break-words max-h-72 overflow-y-auto leading-7">
              {lead.message}
            </div>
          </div>

          {/* Source */}

          <div className="flex items-start gap-3 text-sm text-white/50">
            <Globe size={16} className="mt-0.5 shrink-0" />
            <p className="break-all">
              Source: <span className="text-white/70">{lead.source || "website"}</span>
              {lead.page ? <> · Page: <span className="text-white/70">{lead.page}</span></> : null}
              {lead.referrer ? <> · Referrer: <span className="text-white/70">{lead.referrer}</span></> : null}
              {lead.ip ? <> · IP: <span className="text-white/70">{lead.ip}</span></> : null}
            </p>
          </div>

          {/* Status */}

          <div>
            <label className="block text-white/70 mb-2" htmlFor="lead-status">Status</label>
            <select
              id="lead-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="w-full md:w-1/2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} className="bg-[#1D2129]" value={s}>
                  {LEAD_STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>

          {/* Internal notes */}

          <div>
            <label className="block text-white/70 mb-2" htmlFor="lead-notes">
              Internal Notes <span className="text-white/30 text-sm">(only visible to admins)</span>
            </label>
            <textarea
              id="lead-notes"
              rows={5}
              value={notes}
              maxLength={5000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call outcome, follow-up date, plan discussed..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white resize-none outline-none focus:border-brand-cyan"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

        </div>

        {/* Footer */}

        <div className="flex justify-between gap-4 px-8 py-6 border-t border-white/10 flex-wrap">

          <button
            onClick={() => setConfirmDelete(true)}
            className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete
          </button>

          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 text-white">
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isUpdating || !dirty}
              className="px-6 py-3 rounded-xl bg-brand-cyan text-dark-bg font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </div>

      </div>

      {confirmDelete && (
        <DeleteLeadModal lead={lead} onClose={() => setConfirmDelete(false)} onDeleted={onClose} />
      )}

    </div>
  );
};

export default LeadDetailsModal;
