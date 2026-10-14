import React from "react";
import { ChevronDown } from "lucide-react";

interface RatingFilterProps {
  value: number;
  onChange: (rating: number) => void;
}

const RatingFilter: React.FC<RatingFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="relative min-w-[200px]">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none px-5 py-3 pr-12 rounded-2xl bg-[#1D2129] border border-white/20 text-white font-medium shadow-lg outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 transition"
      >
        <option className="bg-[#1D2129] text-white" value={0}>
          ⭐ All Ratings
        </option>
        <option className="bg-[#1D2129] text-white" value={5}>
          ⭐⭐⭐⭐⭐ (5)
        </option>
        <option className="bg-[#1D2129] text-white" value={4}>
          ⭐⭐⭐⭐ (4)
        </option>
        <option className="bg-[#1D2129] text-white" value={3}>
          ⭐⭐⭐ (3)
        </option>
        <option className="bg-[#1D2129] text-white" value={2}>
          ⭐⭐ (2)
        </option>
        <option className="bg-[#1D2129] text-white" value={1}>
          ⭐ (1)
        </option>
      </select>

      <ChevronDown
        size={18}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
      />
    </div>
  );
};

export default RatingFilter;