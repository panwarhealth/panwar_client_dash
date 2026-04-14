import { apiFetch } from './client';

export interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
}

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
}

export interface AudienceSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ClientBrandsResponse {
  client: ClientSummary;
  brands: BrandSummary[];
  audiences: AudienceSummary[];
}

export async function getMyClients(): Promise<ClientSummary[]> {
  const res = await apiFetch<{ clients: ClientSummary[] }>('/my/clients');
  return res.clients;
}

export async function getClientBrands(clientSlug: string): Promise<ClientBrandsResponse> {
  return apiFetch(`/clients/${encodeURIComponent(clientSlug)}/brands`);
}
