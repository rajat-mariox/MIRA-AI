import type { LeadStatus } from "../app/features/auth/leadsApi";

export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "closed"];

/** Label + badge colours per lead status (same badge style as Support). */
export const LEAD_STATUS_META: Record<LeadStatus, { label: string; badge: string; dot: string }> = {
  new: { label: "New", badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20", dot: "bg-blue-400" },
  contacted: { label: "Contacted", badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20", dot: "bg-yellow-400" },
  qualified: { label: "Qualified", badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20", dot: "bg-purple-400" },
  converted: { label: "Converted", badge: "bg-green-500/10 text-green-400 border border-green-500/20", dot: "bg-green-400" },
  closed: { label: "Closed", badge: "bg-gray-500/10 text-gray-400 border border-gray-500/20", dot: "bg-gray-400" },
};

/** "just now", "5 min ago", "3 h ago", "2 days ago", then a date ("14 Oct 2026"). */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "N/A";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "N/A";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";
