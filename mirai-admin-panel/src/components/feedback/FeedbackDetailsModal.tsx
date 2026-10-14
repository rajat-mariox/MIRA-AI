import React from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  MessageSquare,
} from "lucide-react";

import type { Feedback } from "../../pages/FeedbackManagement";

interface FeedbackDetailsModalProps {
  open: boolean;
  onClose: () => void;
  feedback: Feedback | null;
}

const FeedbackDetailsModal: React.FC<FeedbackDetailsModalProps> = ({
  open,
  onClose,
  feedback,
}) => {
  if (!open || !feedback) return null;

  return (
    <div className="fixed inset-0 !mt-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">

      <div className="w-full max-w-3xl rounded-3xl bg-[#16181D] border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">

          <div>

            <h2 className="text-2xl font-bold text-white">
              Feedback Details
            </h2>

            <p className="text-white/40 text-sm mt-1">
              User submitted feedback
            </p>

          </div>

          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition"
          >
            <X size={24} />
          </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-8">

          {/* User Info */}

          <div className="grid grid-cols-2 gap-6">

            <div className="flex items-center gap-3">

              <User className="text-brand-cyan" />

              <div>

                <p className="text-white/40 text-sm">
                  Name
                </p>

                <p className="text-white font-semibold">
                 {feedback.user?.name ?? "N/A"}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <Mail className="text-brand-cyan" />

              <div>

                <p className="text-white/40 text-sm">
                  Email
                </p>

                <p className="text-white font-semibold">
                  {feedback.user?.email ?? "N/A"}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <Phone className="text-brand-cyan" />

              <div>

                <p className="text-white/40 text-sm">
                  Phone
                </p>

                <p className="text-white font-semibold">
                  {feedback.user?.phone ?? "N/A"}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <Calendar className="text-brand-cyan" />

              <div>

                <p className="text-white/40 text-sm">
                  Submitted On
                </p>

                <p className="text-white font-semibold">
                  {feedback.createdAt}
                </p>

              </div>

            </div>

          </div>

          {/* Rating */}

          <div>

            <h3 className="text-white font-semibold mb-3">
              Rating
            </h3>

            <div className="flex gap-1">

              {[1, 2, 3, 4, 5].map((star) => (

                <Star
                  key={star}
                  size={22}
                  className={
                    star <= feedback.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white/20"
                  }
                />

              ))}

            </div>

          </div>

          {/* Feedback */}

          <div>

            <div className="flex items-center gap-2 mb-4">

              <MessageSquare className="text-brand-cyan" />

              <h3 className="text-white font-semibold">
                Feedback
              </h3>

            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">

              <p className="text-white/70 leading-8 whitespace-pre-wrap">
                {new Date(feedback.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}
              </p>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="border-t border-white/10 px-8 py-6 flex justify-end">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-brand-cyan text-dark-bg font-semibold"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
};

export default FeedbackDetailsModal;