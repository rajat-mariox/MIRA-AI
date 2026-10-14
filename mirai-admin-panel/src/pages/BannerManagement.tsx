import React, { useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";

import BannerCard from "../components/banner/BannerCard";
import BannerModal from "../components/banner/BannerModal";
import DeleteBannerModal from "../components/banner/DeleteBannerModal";
import BannerSearch from "../components/banner/BannerSearch";

import { useGetAllBannersQuery, type Banner } from "../app/features/auth/bannerApi";
import { getErrorMessage } from "../lib/errors";

export type { Banner };

const BannerManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Mutations invalidate the "Banner" tag, so the list refetches by itself; refetch is kept for the modals.
  const { data, isLoading, error, refetch } = useGetAllBannersQuery();

  const filteredBanners = useMemo(() => {
    const banners = data?.data?.banners ?? [];
    const term = search.toLowerCase();
    return [...banners]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter((banner) => (banner.title ?? "").toLowerCase().includes(term));
  }, [data, search]);

  if (isLoading) {
    return (
      <div className="text-white text-center mt-20">
        Loading Banners...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-20">
        Failed to load banners: {getErrorMessage(error)}
      </div>
    );
  }

  const openCreateModal = () => {
    setSelectedBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsModalOpen(true);
  };

  const openDeleteModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Banner Management
          </h1>

          <p className="text-white/40 mt-1">
            Manage promotional banners displayed inside the application.
          </p>

        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-brand-cyan text-dark-bg font-semibold px-5 py-3 rounded-xl hover:scale-105 transition"
        >
          <ImagePlus size={18} />
          Add Banner
        </button>

      </div>

      <BannerSearch
        value={search}
        onChange={setSearch}
      />

      {filteredBanners.length === 0 ? (

        <div className="glass-card rounded-3xl border border-white/5 p-12 flex flex-col items-center">

          <ImagePlus
            size={70}
            className="text-white/20"
          />

          <h2 className="text-white text-xl font-semibold mt-5">
            No Banners Found
          </h2>

        </div>

      ) : (

        <div className="space-y-5">

          {filteredBanners.map((banner) => (

            <BannerCard
              key={banner.id}
              banner={banner}
              onEdit={() => openEditModal(banner)}
              onDelete={() => openDeleteModal(banner)}
            />

          ))}

        </div>

      )}

      {isModalOpen && (
        <BannerModal
          key={selectedBanner?.id ?? "new"}
          onClose={() => setIsModalOpen(false)}
          banner={selectedBanner}
          nextOrder={(data?.data?.banners ?? []).reduce((max, b) => Math.max(max, b.order ?? 0), 0) + 1}
        />
      )}

      <DeleteBannerModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        banner={selectedBanner}
        refetch={refetch}
      />

    </div>
  );
};

export default BannerManagement;
