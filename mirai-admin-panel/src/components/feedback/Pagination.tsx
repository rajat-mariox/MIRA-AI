import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-8">

      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
      >
        <ChevronLeft size={18} />
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;

        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`w-11 h-11 rounded-xl font-semibold transition
              ${
                page === pageNumber
                  ? "bg-brand-cyan text-dark-bg"
                  : "bg-white/5 text-white hover:bg-white/10"
              }
            `}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
      >
        Next
        <ChevronRight size={18} />
      </button>

    </div>
  );
};

export default Pagination;