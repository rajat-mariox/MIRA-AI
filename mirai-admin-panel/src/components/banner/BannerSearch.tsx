import React from "react";
import { Search } from "lucide-react";

interface BannerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const BannerSearch: React.FC<BannerSearchProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="relative w-full">

      <Search
        className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30"
        size={20}
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search banners..."
        className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-brand-cyan transition"
      />

    </div>
  );
};

export default BannerSearch;