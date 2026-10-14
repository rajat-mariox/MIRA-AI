import { useEffect, useState } from 'react';
import { getUnreadCount } from '../api/notifications';

/** Unread in-app notifications (Home bell dot). Updated by the Notification screen and incoming pushes. */
let unread = 0;
const listeners = new Set<(n: number) => void>();

export function setUnreadCount(n: number) {
  const next = Math.max(0, Math.floor(n) || 0);
  if (next === unread) return;
  unread = next;
  listeners.forEach(l => l(unread));
}

/** GET /notifications/unread-count (errors ignored: the dot just keeps its last value) */
export async function refreshUnreadCount() {
  try {
    setUnreadCount(await getUnreadCount());
  } catch {
    // offline / signed out
  }
}

export function useUnreadCount() {
  const [n, setN] = useState(unread);
  useEffect(() => {
    listeners.add(setN);
    setN(unread);
    return () => {
      listeners.delete(setN);
    };
  }, []);
  return n;
}
