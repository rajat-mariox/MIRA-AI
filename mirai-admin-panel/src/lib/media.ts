/**
 * Resolves an image URL stored by the backend for display in the panel.
 * The API may store server-relative paths (`/uploads/...`): in dev they go through the Vite
 * `/uploads` proxy as-is; when VITE_API_BASE_URL is absolute (production build) they are
 * resolved against that API's origin. Absolute, blob: and data: URLs are returned unchanged.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  const value = (url ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return value;
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "");
  if (/^https?:\/\//i.test(base)) {
    try {
      return new URL(value, base).href;
    } catch {
      return value;
    }
  }
  return value;
}
