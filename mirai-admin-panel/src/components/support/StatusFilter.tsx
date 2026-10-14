import React from "react";
import { ChevronDown } from "lucide-react";

interface StatusFilterProps {
  value: string;
  onChange: (status: string) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="relative min-w-[200px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-5 py-3 pr-12 rounded-2xl bg-[#1D2129] border border-white/20 text-white font-medium shadow-lg outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 transition"
      >
        <option className="bg-[#1D2129] text-white" value="">
          📋 All Status
        </option>

        <option className="bg-[#1D2129] text-white" value="open">
          🟢 Open
        </option>

        <option className="bg-[#1D2129] text-white" value="in-progress">
          🟡 In Progress
        </option>

        <option className="bg-[#1D2129] text-white" value="resolved">
          🔵 Resolved
        </option>

        <option className="bg-[#1D2129] text-white" value="closed">
          ⚫ Closed
        </option>
      </select>

      <ChevronDown
        size={18}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
      />
    </div>
  );
};

export default StatusFilter;