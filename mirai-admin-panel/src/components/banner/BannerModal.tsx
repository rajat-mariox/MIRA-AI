import React, { useRef, useState } from "react";
import { X, Save, Upload, Loader2 } from "lucide-react";

import {
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useUploadImagesMutation,
  type Banner,
} from "../../app/features/auth/bannerApi";
import { getErrorMessage } from "../../lib/errors";
import { resolveMediaUrl } from "../../lib/media";

interface BannerModalProps {
  onClose: () => void;
  /** null = create */
  banner: Banner | null;
  /** Default display order for a new banner. */
  nextOrder: number;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";

/** Rendered only while open and keyed by banner id, so state is initialised from props (no sync effect). */
const BannerModal: React.FC<BannerModalProps> = ({ onClose, banner, nextOrder }) => {
  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [buttonText, setButtonText] = useState(banner?.buttonText ?? "View Today");
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");
  const [link, setLink] = useState(banner?.link ?? "");
  const [order, setOrder] = useState(banner?.order ?? nextOrder);
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const [createBanner, { isLoading }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const [uploadImages, { isLoading: isUploading }] = useUploadImagesMutation();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }
    try {
      const res = await uploadImages([file]).unwrap();
      // Prefer the relative `/uploads/...` path so the banner works from any API host.
      const url = res.data?.paths?.[0] ?? res.data?.files?.[0]?.path ?? res.data?.urls?.[0];
      if (!url) throw new Error("Upload succeeded but no URL was returned.");
      setImageUrl(url);
    } catch (err) {
      setError(getErrorMessage(err, "Image upload failed."));
    }
  };

  const handleSubmit = async () => {
    setError("");

    const bannerTitle = title.trim();
    const bannerImageUrl = imageUrl.trim();
    const bannerLink = link.trim();

    if (!bannerTitle) {
      setError("Banner title is required.");
      return;
    }

    if (!bannerImageUrl) {
      setError("Upload an image or enter an image URL.");
      return;
    }

    try {
      const body = {
        title: bannerTitle,
        subtitle: subtitle.trim(),
        buttonText: buttonText.trim() || "View Today",
        imageUrl: bannerImageUrl,
        link: bannerLink,
        isActive,
        order: Number.isFinite(order) && order >= 0 ? order : 0,
      };
      if (banner) await updateBanner({ id: banner.id, ...body }).unwrap();
      else await createBanner(body).unwrap();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save banner. Please check the details and try again."));
    }
  };

  const isSaving = isLoading || isUpdating;

  return (

    <div className="fixed inset-0 !mt-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">

      <div className="w-full max-w-3xl max-h-[calc(100vh-2.5rem)] rounded-3xl bg-[#16181D] border border-white/10 shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}

        <div className="flex justify-between items-center border-b border-white/10 px-8 py-6">

          <div>

            <h2 className="text-2xl font-bold text-white">
              {banner ? "Edit Banner" : "Add Banner"}
            </h2>

            <p className="text-white/40 text-sm mt-1">
              Fill banner details below.
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

        <div className="p-8 space-y-6 overflow-y-auto">

          {/* Title */}

          <div>

            <label className="block text-sm text-white/70 mb-2">
              Banner Title
            </label>

            <input
              value={title}
              maxLength={200}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand-cyan"
              placeholder="Enter banner title"
            />

          </div>

          {/* Subtitle + Button text */}

          <div className="grid grid-cols-2 gap-6">

            <div>

              <label className="block text-sm text-white/70 mb-2">
                Subtitle <span className="text-white/30">(optional)</span>
              </label>

              <input
                value={subtitle}
                maxLength={300}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand-cyan"
                placeholder="e.g. Kundli, Panchang & Daily Horoscope"
              />

            </div>

            <div>

              <label className="block text-sm text-white/70 mb-2">
                Button Text
              </label>

              <input
                value={buttonText}
                maxLength={40}
                onChange={(e) => {
                  setButtonText(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand-cyan"
                placeholder="View Today"
              />

            </div>

          </div>

          {/* Image: upload or URL */}

          <div>

            <label className="block text-sm text-white/70 mb-2">
              Banner Image
            </label>

            <div className="flex gap-3">
              <input
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (error) setError("");
                }}
                className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand-cyan"
                placeholder="https://..., /uploads/... or upload an image"
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={isUploading}
                className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan font-semibold hover:bg-brand-cyan/20 transition disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {isUploading ? "Uploading..." : "Upload"}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFile}
                className="hidden"
              />
            </div>
            <p className="text-white/30 text-xs mt-2">JPEG, PNG, WebP or GIF, up to 5 MB.</p>

          </div>

          {/* Preview */}

          {imageUrl && (

            <div>

              <img
                src={resolveMediaUrl(imageUrl)}
                alt="Preview"
                className="w-full max-h-56 object-contain rounded-2xl border border-white/10 bg-black/20"
              />

            </div>

          )}

          {/* Link */}

          <div>

            <label className="block text-sm text-white/70 mb-2">
              Banner Link <span className="text-white/30">(optional)</span>
            </label>

            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (error) setError("");
              }}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand-cyan"
              placeholder="https://example.com or an in-app screen (e.g. Horoscope)"
            />

          </div>

          {/* Order + Status */}

          <div className="grid grid-cols-2 gap-6">

            <div>

              <label className="block text-sm text-white/70 mb-2">
                Display Order
              </label>

              <input
                type="number"
                min={0}
                value={Number.isFinite(order) ? order : ""}
                onChange={(e) => {
                  setOrder(parseInt(e.target.value, 10));
                  if (error) setError("");
                }}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-brand-cyan"
              />

            </div>

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
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || isUploading}
            className="px-6 py-3 rounded-xl bg-brand-cyan text-dark-bg font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : banner ? "Update Banner" : "Create Banner"}
          </button>

        </div>

      </div>

    </div>

  );

};

export default BannerModal;
