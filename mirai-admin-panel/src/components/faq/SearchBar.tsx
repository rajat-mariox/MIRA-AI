import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="glass-card rounded-2xl border border-white/5 bg-white/[0.02] p-4">

      <div className="relative">

        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
        />

        <input
          type="text"
          placeholder="Search FAQ..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan transition"
        />

        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X size={18} />
          </button>
        )}

      </div>

    </div>
  );
};

export default SearchBar;