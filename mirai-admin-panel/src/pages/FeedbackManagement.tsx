import React, { useState } from "react";
import { MessageSquare, Star } from "lucide-react";

import FeedbackCard from "../components/feedback/FeedbackCard";
import FeedbackSearch from "../components/feedback/FeedbackSearch";
import RatingFilter from "../components/feedback/RatingFilter";
import FeedbackDetailsModal from "../components/feedback/FeedbackDetailsModal";
import Pagination from "../components/feedback/Pagination";
import { useGetAllFeedbackQuery, type Feedback } from "../app/features/auth/feedbackApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getErrorMessage } from "../lib/errors";

export type { Feedback };

const PAGE_LIMIT = 10;

const FeedbackManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search (name / email / message) and the rating filter run on the server, across all pages.
  const debouncedSearch = useDebouncedValue(search.trim());
  const { data, isLoading, isFetching, error } = useGetAllFeedbackQuery({
    page,
    limit: PAGE_LIMIT,
    rating: ratingFilter || undefined,
    search: debouncedSearch || undefined,
  });

  const feedbacks = data?.data?.feedback ?? [];
  const stats = data?.data?.stats;

  const openModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-white text-center mt-20">
        Loading Feedback...
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-red-500 text-center mt-20">
        Failed to load feedback: {getErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between gap-4 flex-wrap">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Feedback Management
          </h1>

          <p className="text-white/40 mt-1">
            Review feedback submitted by users.
          </p>

        </div>

        <div className="flex items-center gap-3">
          {stats && stats.totalRatings > 0 && (
            <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <p className="text-amber-300 font-semibold">
                {stats.averageRating.toFixed(1)} avg · {stats.totalRatings} ratings
              </p>
            </div>
          )}
          <div className="px-5 py-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
            <p className="text-brand-cyan font-semibold">
              {ratingFilter || debouncedSearch ? "Matching" : "Total"} Feedback : {data?.data?.total ?? 0}
            </p>
          </div>
        </div>

      </div>

      <div className="flex gap-4">

        <FeedbackSearch
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />

        <RatingFilter
          value={ratingFilter}
          onChange={(r) => {
            setRatingFilter(r);
            setPage(1);
          }}
        />

      </div>

      {feedbacks.length === 0 ? (

        <div className="glass-card rounded-3xl border border-white/5 p-12 flex flex-col items-center">

          <MessageSquare
            size={70}
            className="text-white/20"
          />

          <h2 className="text-white text-xl font-semibold mt-5">
            {isFetching ? "Searching..." : "No Feedback Found"}
          </h2>

        </div>

      ) : (

        <div className={`space-y-5 transition-opacity ${isFetching ? "opacity-60" : ""}`}>

          {feedbacks.map((feedback) => (

            <FeedbackCard
              key={feedback._id}
              feedback={feedback}
              onView={() => openModal(feedback)}
            />

          ))}

        </div>

      )}

      <Pagination
        page={page}
        totalPages={data?.data?.totalPages ?? 1}
        onPageChange={setPage}
      />

      <FeedbackDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feedback={selectedFeedback}
      />

    </div>
  );
};

export default FeedbackManagement;
