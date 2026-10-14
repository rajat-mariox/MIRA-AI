import React from "react";
import {
  User,
  Mail,
  Calendar,
  Eye,
  AlertTriangle,
} from "lucide-react";

import type { SupportTicket } from "../../pages/SupportManagement";

interface SupportCardProps {
  ticket: SupportTicket;
  onView: () => void;
}

const SupportCard: React.FC<SupportCardProps> = ({
  ticket,
  onView,
}) => {

  const statusColor = {
    open: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "in-progress":
      "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    resolved:
      "bg-green-500/10 text-green-400 border border-green-500/20",
    closed:
      "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  };

  const priorityColor = {
    low: "bg-green-500/10 text-green-400 border border-green-500/20",
    medium:
      "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    high:
      "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    urgent:
      "bg-red-500/10 text-red-400 border border-red-500/20",
  };

  return (
    <div className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand-cyan/20 transition-all duration-300">

      {/* Header */}

      <div className="flex justify-between items-start">

        <div>

          <h2 className="text-xl font-bold text-white">

            {ticket.subject}

          </h2>

          <div className="flex items-center gap-2 mt-2 text-white/50 text-sm">

            <User size={15} />

            {ticket.user?.name ?? "N/A"}

          </div>

          <div className="flex items-center gap-2 mt-2 text-white/50 text-sm">

            <Mail size={15} />

            {ticket.user?.email ?? "N/A"}

          </div>

        </div>

        <button
          onClick={onView}
          className="px-4 py-2 rounded-xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition flex items-center gap-2"
        >
          <Eye size={18} />

          View

        </button>

      </div>

      {/* Description */}

      <div className="mt-6">

        <p className="text-white/60 leading-7 line-clamp-3">

          {ticket.description}

        </p>

      </div>

      {/* Footer */}

      <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center">

        <div className="flex gap-3">

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              statusColor[ticket.status]
            }`}
          >
            {ticket.status}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              priorityColor[ticket.priority]
            }`}
          >
            <AlertTriangle
              size={12}
              className="inline mr-1"
            />

            {ticket.priority}

          </span>

        </div>

        <div className="flex items-center gap-2 text-white/40 text-sm">

          <Calendar size={15} />

          {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}

        </div>

      </div>

    </div>
  );
};

export default SupportCard;