import { apiFetch } from './client';

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
