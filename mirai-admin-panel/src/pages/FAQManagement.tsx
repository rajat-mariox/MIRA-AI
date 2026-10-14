import React, { useMemo, useState } from "react";
import { CirclePlus, HelpCircle } from "lucide-react";

import FAQCard from "../components/faq/FAQCard";
import FAQModal from "../components/faq/FAQModal";
import DeleteFAQModal from "../components/faq/DeleteFAQModal";
import SearchBar from "../components/faq/SearchBar";
import { useGetAllFAQQuery, type FAQ } from "../app/features/auth/faqApi";
import { getErrorMessage } from "../lib/errors";

export type { FAQ };

const FAQManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  // Create/update/delete invalidate the "Faq" tag, so the list refetches automatically.
  const { data, isLoading, error } = useGetAllFAQQuery();

  const faqs = useMemo(() => [...(data?.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [data]);
  const filteredFaqs = useMemo(() => {
    const term = search.toLowerCase();
    return faqs.filter((faq) =>
      (faq.question ?? "").toLowerCase().includes(term) || (faq.answer ?? "").toLowerCase().includes(term)
    );
  }, [faqs, search]);

  if (isLoading) {
    return (
      <div className="text-white text-center mt-20">
        Loading FAQs...
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-red-500 text-center mt-20">
        Failed to load FAQs: {getErrorMessage(error)}
      </div>
    );
  }

  const openCreateModal = () => {
    setSelectedFAQ(null);
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsModalOpen(true);
  };

  const openDeleteModal = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            FAQ Management
          </h1>

          <p className="text-white/40 mt-1">
            Manage frequently asked questions shown in the app.
          </p>

        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-brand-cyan text-dark-bg font-semibold px-5 py-3 rounded-xl hover:scale-105 transition"
        >
          <CirclePlus size={18} />
          Add FAQ
        </button>

      </div>

      {/* Search */}

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {/* Cards */}

      {filteredFaqs.length === 0 ? (

        <div className="glass-card rounded-3xl border border-white/5 p-12 flex flex-col items-center justify-center">

          <HelpCircle
            size={70}
            className="text-white/20"
          />

          <h2 className="text-white text-xl font-semibold mt-5">
            No FAQs Found
          </h2>

          <p className="text-white/40 mt-2">
            Click "Add FAQ" to create your first FAQ.
          </p>

        </div>

      ) : (

        <div className="space-y-5">

          {filteredFaqs.map((faq) => (

            <FAQCard
              key={faq._id}
              faq={faq}
              onEdit={() => openEditModal(faq)}
              onDelete={() => openDeleteModal(faq)}
            />

          ))}

        </div>

      )}

      {/* Add/Edit */}

      {isModalOpen && (
        <FAQModal
          key={selectedFAQ?._id ?? "new"}
          onClose={() => setIsModalOpen(false)}
          faq={selectedFAQ}
          nextOrder={faqs.reduce((max, f) => Math.max(max, f.order ?? 0), 0) + 1}
        />
      )}

      {/* Delete */}

      <DeleteFAQModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        faq={selectedFAQ}
      />

    </div>
  );
};

export default FAQManagement;