import { apiFetch } from './client';

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  type: 'client' | 'employee';
  clientId: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
  clientPrimaryColor: string | null;
  clientAccentColor: string | null;
  roles: string[];
}

export async function requestMagicLink(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/magic-link', { method: 'POST', body: { email } });
}

export async function verifyMagicLink(token: string): Promise<MeResponse> {
  return apiFetch('/auth/magic-link/verify', { method: 'POST', body: { token } });
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch('/auth/me');
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}
