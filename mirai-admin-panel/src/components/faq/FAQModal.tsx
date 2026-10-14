import React, { useState } from "react";
import { X, Save } from "lucide-react";
import type { FAQ } from "../../app/features/auth/faqApi";
import { useCreateFAQMutation, useUpdateFAQMutation } from "../../app/features/auth/faqApi";
import { getErrorMessage } from "../../lib/errors";

interface FAQModalProps {
  onClose: () => void;
  /** null = create */
  faq: FAQ | null;
  /** Default display order for a new FAQ. */
  nextOrder: number;
}

/** Rendered only while open and keyed by FAQ id, so state is initialised from props (no sync effect). */
const FAQModal: React.FC<FAQModalProps> = ({ onClose, faq, nextOrder }) => {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [order, setOrder] = useState(faq?.order ?? nextOrder);
  const [isActive, setIsActive] = useState(faq?.isActive ?? true);
  const [error, setError] = useState("");
  const [createFAQ, { isLoading: isCreating }] = useCreateFAQMutation();
  const [updateFAQ, { isLoading: isUpdating }] = useUpdateFAQMutation();
  const isLoading = isCreating || isUpdating;

  const handleSubmit = async () => {
    setError("");
    if (!question.trim()) {
      setError("Question is required.");
      return;
    }
    if (!answer.trim()) {
      setError("Answer is required.");
      return;
    }
    const body = {
      question: question.trim(),
      answer: answer.trim(),
      isActive,
      order: Number.isFinite(order) && order >= 0 ? order : 0,
    };
    try {
      if (faq) await updateFAQ({ id: faq._id, ...body }).unwrap();
      else await createFAQ(body).unwrap();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save FAQ."));
    }
  };

  return (

    <div className="fixed inset-0 !mt-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">

      <div className="w-full max-w-2xl rounded-3xl bg-[#16181D] border border-white/10 shadow-2xl overflow-hidden">

        {/* Header */}

        <div className="flex justify-between items-center border-b border-white/10 px-8 py-6">

          <div>

            <h2 className="text-2xl font-bold text-white">
              {faq ? "Edit FAQ" : "Add FAQ"}
            </h2>

            <p className="text-white/40 text-sm mt-1">
              Fill the FAQ information below.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition"
          >
            <X size={24} />
          </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-6">

          {/* Question */}

          <div>

            <label className="block text-sm text-white/70 mb-2">
              Question
            </label>

            <input
              value={question}
              maxLength={500}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-brand-cyan outline-none"
              placeholder="Enter Question"
            />

          </div>

          {/* Answer */}

          <div>

            <label className="block text-sm text-white/70 mb-2">
              Answer
            </label>

            <textarea
              rows={5}
              value={answer}
              maxLength={5000}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-brand-cyan outline-none resize-none"
              placeholder="Enter Answer"
            />

          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Order */}

            <div>

              <label className="block text-sm text-white/70 mb-2">
                Display Order
              </label>

              <input
                type="number"
                min={0}
                value={Number.isFinite(order) ? order : ""}
                onChange={(e) => setOrder(parseInt(e.target.value, 10))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-brand-cyan outline-none"
              />

            </div>

            {/* Status */}

            <div>

              <label className="block text-sm text-white/70 mb-2">
                Status
              </label>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full rounded-xl py-3 font-semibold transition ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </button>

            </div>

          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-4 border-t border-white/10 px-8 py-6">

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-brand-cyan text-dark-bg font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {isLoading ? "Saving..." : faq ? "Update FAQ" : "Create FAQ"}
          </button>

        </div>

      </div>

    </div>

  );

};

export default FAQModal;
