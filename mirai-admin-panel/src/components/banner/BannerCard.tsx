import React from "react";
import {
  Pencil,
  Trash2,
  ArrowUpDown,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

import type { Banner } from "../../pages/BannerManagement";
import { resolveMediaUrl } from "../../lib/media";

interface BannerCardProps {
  banner: Banner;
  onEdit: () => void;
  onDelete: () => void;
}

const BannerCard: React.FC<BannerCardProps> = ({
  banner,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:border-brand-cyan/20 transition-all duration-300">

      <div className="flex justify-between items-start">

        {/* Left */}

        <div className="flex gap-5">

          {/* Banner Image */}

          <div className="w-40 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">

            {banner.imageUrl ? (

              <img
                src={resolveMediaUrl(banner.imageUrl)}
                alt={banner.title}
                className="w-full h-full object-cover"
              />

            ) : (

              <ImageIcon
                size={36}
                className="text-white/30"
              />

            )}

          </div>

          {/* Banner Info */}

          <div>

            <h3 className="text-white text-xl font-bold">

              {banner.title}

            </h3>

            {banner.subtitle && (
              <p className="text-white/60 text-sm mt-1">{banner.subtitle}</p>
            )}

            <span className="inline-block mt-3 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-semibold">
              Button: {banner.buttonText || "View Today"}
            </span>

            {banner.link && (/^https?:\/\//i.test(banner.link) ? (
              <a
                href={banner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-cyan text-sm mt-2 hover:underline"
              >
                <ExternalLink size={15} />

                {banner.link}

              </a>
            ) : (
              <p className="flex items-center gap-2 text-white/50 text-sm mt-2">
                <ExternalLink size={15} />
                App screen: {banner.link}
              </p>
            ))}

            <div className="flex gap-3 mt-5">

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${
                  banner.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {banner.isActive ? "Active" : "Inactive"}
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold flex items-center gap-1">

                <ArrowUpDown size={14} />

                Order : {banner.order}

              </span>

            </div>

          </div>

        </div>

        {/* Action Buttons */}

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

    </div>
  );
};

export default BannerCard;