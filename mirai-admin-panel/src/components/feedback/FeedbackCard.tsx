import React from "react";
import {
  Star,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

import type { Feedback } from "../../pages/FeedbackManagement";

interface FeedbackCardProps {
  feedback: Feedback;
  onView: () => void;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onView,
}) => {
  return (
    <div className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand-cyan/20 transition-all duration-300">

      {/* Header */}

      <div className="flex justify-between items-start">

        <div className="space-y-3">

          <div className="flex items-center gap-2">

            <User className="w-4 h-4 text-brand-cyan" />

            <h3 className="text-lg font-bold text-white">

               {feedback.user?.name ?? "N/A"}

            </h3>

          </div>

          <div className="flex items-center gap-2 text-white/50 text-sm">

            <Mail className="w-4 h-4" />

            {feedback.user?.email ?? "N/A"}

          </div>

          <div className="flex items-center gap-2 text-white/50 text-sm">

            <Phone className="w-4 h-4" />

            {feedback.user?.phone ?? "N/A"}

          </div>

        </div>

        <button
          onClick={onView}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition"
        >
          <Eye size={16} />

          View
        </button>

      </div>

      {/* Rating */}

      <div className="flex items-center gap-1 mt-6">

        {[1, 2, 3, 4, 5].map((star) => (

          <Star
            key={star}
            size={18}
            className={
              star <= feedback.rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-white/20"
            }
          />

        ))}

      </div>

      {/* Feedback */}

      <p className="mt-6 text-white/70 leading-7 line-clamp-3">

        {feedback.message}

      </p>

      {/* Footer */}

      <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-2 text-white/40 text-sm">

        <Calendar size={15} />

        {new Date(feedback.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}

      </div>

    </div>
  );
};

export default FeedbackCard;