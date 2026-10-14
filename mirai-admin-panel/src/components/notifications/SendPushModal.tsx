import React, { useState } from "react";
import { Bell, Send, X } from "lucide-react";

import { adminService } from "../../services/admin.service";
import { getErrorMessage } from "../../lib/errors";

interface SendPushModalProps {
  userId: string;
  userLabel: string;
  onClose: () => void;
}

/** POST /admin/users/test-notification for one user (503 when Firebase is not configured on the server). */
const SendPushModal: React.FC<SendPushModalProps> = ({ userId, userLabel, onClose }) => {
  const [title, setTitle] = useState("Test notification");
  const [body, setBody] = useState("This is a test notification from MIRA AI.");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");
    if (!title.trim() || !body.trim()) {
      setError("Title and message are required.");
      return;
    }
    setIsSending(true);
    try {
      const res = await adminService.sendTestNotification({ userId, title: title.trim(), body: body.trim() });
      const r = res.data;
      setResult(`Delivered to ${r.successCount} of ${r.tokens} device(s)${r.failureCount ? `, ${r.failureCount} failed` : ""}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send notification."));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 !mt-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Send Test Notification</h2>
              <p className="text-xs text-white/40 break-all">To: {userLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/60 ml-1">Title</label>
            <input
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/60 ml-1">Message</label>
            <textarea
              rows={3}
              value={body}
              maxLength={1000}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all font-medium resize-none"
            />
          </div>
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
          )}
          {result && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{result}</div>
          )}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all font-medium"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex-1 py-2.5 rounded-xl bg-brand-cyan hover:opacity-90 text-dark-bg shadow-lg shadow-brand-cyan/20 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendPushModal;
