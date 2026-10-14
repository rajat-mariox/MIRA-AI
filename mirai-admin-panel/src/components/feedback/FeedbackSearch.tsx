import React from "react";
import { Search } from "lucide-react";

interface FeedbackSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const FeedbackSearch: React.FC<FeedbackSearchProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="relative flex-1">

      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by Name or Email..."
        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-brand-cyan transition"
      />

    </div>
  );
};

export default FeedbackSearch;