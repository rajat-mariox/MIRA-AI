import React, { useState } from "react";
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

import {
  useGetSupportByIdQuery,
  useUpdateSupportMutation,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from "../../app/features/auth/supportApi";
import { getErrorMessage } from "../../lib/errors";

interface SupportDetailsModalProps {
  onClose: () => void;
  ticket: SupportTicket;
}

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";

/**
 * Rendered only while open and keyed by ticket id: the form is initialised from the list row
 * (same shape as the detail endpoint); the detail query refreshes the read-only fields.
 */
const SupportDetailsModal: React.FC<SupportDetailsModalProps> = ({ onClose, ticket }) => {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [adminResponse, setAdminResponse] = useState(ticket.adminResponse ?? "");
  const [error, setError] = useState("");

  const { data } = useGetSupportByIdQuery(ticket._id);
  const support: SupportTicket = data?.data ?? ticket;
  const [updateSupport, { isLoading: isUpdating }] = useUpdateSupportMutation();

  const handleSave = async () => {
    setError("");
    try {
      await updateSupport({
        id: support._id,
        status,
        priority,
        adminResponse: adminResponse.trim(),
      }).unwrap();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update ticket."));
    }
  };

  return (
    <div className="fixed inset-0 !mt-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 overflow-y-auto">

      <div className="w-full max-w-4xl rounded-3xl bg-[#16181D] border border-white/10 shadow-2xl">

        {/* Header */}

        <div className="flex justify-between items-center px-8 py-6 border-b border-white/10">

          <div>

            <h2 className="text-2xl font-bold text-white">
              Support Ticket{support.ticketNumber ? ` ${support.ticketNumber}` : ""}
            </h2>

            <p className="text-white/40 mt-1">
              Review and respond to customer ticket.
              {support.category ? ` Category: ${support.category.replace(/_/g, " ")}.` : ""}
            </p>

          </div>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white"
          >
            <X size={24} />
          </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-8">

          {/* Customer */}

          <div className="grid grid-cols-2 gap-6">

            <div className="flex items-center gap-3">
              <User className="text-brand-cyan" />
              <div>
                <p className="text-white/40 text-sm">Name</p>
                <p className="text-white font-semibold">{support.user?.name || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="text-brand-cyan" />
              <div>
                <p className="text-white/40 text-sm">Email</p>
                <p className="text-white font-semibold">{support.user?.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="text-brand-cyan" />
              <div>
                <p className="text-white/40 text-sm">Phone</p>
                <p className="text-white font-semibold">{support.user?.phone || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="text-brand-cyan" />
              <div>
                <p className="text-white/40 text-sm">Submitted</p>
                <p className="text-white font-semibold">{formatDate(support.createdAt)}</p>
                {support.respondedAt ? (
                  <p className="text-white/40 text-xs mt-0.5">Responded {formatDate(support.respondedAt)}</p>
                ) : null}
              </div>
            </div>

          </div>

          {/* Subject */}

          <div>
            <label className="block text-white/70 mb-2">Subject</label>
            <input
              value={support.subject}
              disabled
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white"
            />
          </div>

          {/* Customer Message */}

          <div>
            <label className="block text-white/70 mb-2">Customer Message</label>
            <textarea
              value={support.description}
              disabled
              rows={5}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white resize-none"
            />
          </div>

          {/* Status & Priority */}

          <div className="grid grid-cols-2 gap-6">

            <div>
              <label className="block text-white/70 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white"
              >
                <option className="bg-[#1D2129]" value="open">Open</option>
                <option className="bg-[#1D2129]" value="in-progress">In Progress</option>
                <option className="bg-[#1D2129]" value="resolved">Resolved</option>
                <option className="bg-[#1D2129]" value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-white/70 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white"
              >
                <option className="bg-[#1D2129]" value="low">Low</option>
                <option className="bg-[#1D2129]" value="medium">Medium</option>
                <option className="bg-[#1D2129]" value="high">High</option>
                <option className="bg-[#1D2129]" value="urgent">Urgent</option>
              </select>
            </div>

          </div>

          {/* Admin Response */}

          <div>
            <label className="block text-white/70 mb-2">Admin Response</label>
            <textarea
              rows={6}
              value={adminResponse}
              maxLength={5000}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Write your response..."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white resize-none outline-none focus:border-brand-cyan"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-4 px-8 py-6 border-t border-white/10">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-white/10 text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-6 py-3 rounded-xl bg-brand-cyan text-dark-bg font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default SupportDetailsModal;
