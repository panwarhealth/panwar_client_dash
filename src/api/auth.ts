import { apiFetch, BASE_URL } from './client';

/**
 * Mirror of API's MeResponse. Client-specific fields (branding, brands) now
 * live on separate endpoints because users can belong to multiple clients.
 */
export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  type: 'client' | 'employee';
  roles: string[];
}

export type LoginMethod = 'magic-link' | 'entra' | 'denied';

export async function resolveLoginMethod(email: string): Promise<LoginMethod> {
  const res = await apiFetch<{ method: LoginMethod }>('/auth/method', {
    method: 'POST',
    body: { email },
  });
  return res.method;
}

export async function requestMagicLink(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/magic-link', { method: 'POST', body: { email } });
}

export async function verifyMagicLink(token: string): Promise<MeResponse> {
  return apiFetch('/auth/magic-link/verify', { method: 'POST', body: { token } });
}

export async function exchangeEntraToken(idToken: string): Promise<MeResponse> {
  return apiFetch('/auth/entra/exchange', {
    method: 'POST',
    body: { idToken },
  });
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch('/auth/me');
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

/**
 * Best-effort "viewed" beacon for report-invite tracking. keepalive lets the
 * POST finish even if we immediately navigate to the deeplinked page.
 */
export function postViewBeacon(token: string): void {
  try {
    void fetch(`${BASE_URL}/track/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      credentials: 'include',
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort only
  }
}
