import React from "react";
import {
  Pencil,
  Trash2,
  CircleHelp,
  ArrowUpDown,
} from "lucide-react";
import type { FAQ } from "../../pages/FAQManagement";

interface FAQCardProps {
  faq: FAQ;
  onEdit: () => void;
  onDelete: () => void;
}

const FAQCard: React.FC<FAQCardProps> = ({
  faq,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand-cyan/20 transition-all duration-300">

      {/* Header */}

      <div className="flex justify-between items-start">

        <div className="flex gap-4">

          <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">

            <CircleHelp size={24} />

          </div>

          <div>

            <h3 className="text-white text-lg font-bold">

              {faq.question}

            </h3>

            <div className="flex gap-3 mt-2">

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${
                  faq.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {faq.isActive ? "Active" : "Inactive"}
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold flex items-center gap-1">

                <ArrowUpDown size={14} />

                Order : {faq.order}

              </span>

            </div>

          </div>

        </div>

        {/* Buttons */}

        <div className="flex gap-2">

          <button
            onClick={onEdit}
            className="w-10 h-10 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan flex items-center justify-center transition"
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={onDelete}
            className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition"
          >
            <Trash2 size={18} />
          </button>

        </div>

      </div>

      {/* Answer */}

      <div className="mt-6 border-t border-white/5 pt-5">

        <p className="text-white/60 leading-7">

          {faq.answer}

        </p>

      </div>

    </div>
  );
};

export default FAQCard;