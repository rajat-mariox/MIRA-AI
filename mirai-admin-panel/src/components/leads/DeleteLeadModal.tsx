import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

import { useDeleteLeadMutation, type Lead } from "../../app/features/auth/leadsApi";
import { getErrorMessage } from "../../lib/errors";

interface DeleteLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onDeleted: () => void;
}

/** Rendered only while open (same layout as DeleteBannerModal). */
const DeleteLeadModal: React.FC<DeleteLeadModalProps> = ({ lead, onClose, onDeleted }) => {
  const [deleteLead, { isLoading, error }] = useDeleteLeadMutation();

  const handleDelete = async () => {
    try {
      await deleteLead(lead._id).unwrap();
      onDeleted();
    } catch {
      // shown below via the mutation error state
    }
  };

  return (
    <div className="fixed inset-0 !mt-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

      <div className="w-full max-w-md rounded-3xl bg-[#16181D] border border-white/10 overflow-hidden shadow-2xl">

        {/* Header */}

        <div className="flex justify-between items-center px-6 py-5 border-b border-white/10">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Delete Lead</h2>
              <p className="text-white/40 text-sm">This action cannot be undone.</p>
            </div>

          </div>

          <button onClick={onClose} disabled={isLoading} className="text-white/40 hover:text-white">
            <X size={22} />
          </button>

        </div>

        {/* Body */}

        <div className="px-6 py-6">

          <p className="text-white/70 leading-7">Are you sure you want to delete this lead?</p>

          <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-white font-semibold">{lead.name}</h3>
            <p className="text-white/50 text-sm mt-1 break-all">{lead.email}</p>
            <p className="text-white/50 text-sm mt-2">{lead.subject}</p>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {getErrorMessage(error, "Failed to delete lead.")}
            </div>
          ) : null}

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/10">

          <button onClick={onClose} className="px-5 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition">
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <Trash2 size={18} />
            {isLoading ? "Deleting..." : "Delete"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default DeleteLeadModal;
