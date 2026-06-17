const KEY = 'deeplink_pending';
const MAX_AGE_MS = 60 * 60 * 1000;

interface PendingDeeplink {
  path: string;
  token: string;
  ts: number;
}

export function captureDeeplink(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('e');
  if (!token) return;

  params.delete('e');
  const qs = params.toString();
  const path = window.location.pathname + (qs ? `?${qs}` : '');

  localStorage.setItem(KEY, JSON.stringify({ path, token, ts: Date.now() }));
  window.history.replaceState({}, '', path);
}

export function consumeDeeplink(): { path: string; token: string } | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  localStorage.removeItem(KEY);

  try {
    const pending = JSON.parse(raw) as PendingDeeplink;
    if (Date.now() - pending.ts > MAX_AGE_MS) return null;
    return { path: pending.path, token: pending.token };
  } catch {
    return null;
  }
}
