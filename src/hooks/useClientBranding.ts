import { useEffect } from 'react';
import { hexToRgbString } from '@/lib/utils';
import type { ClientSummary } from '@/api/clients';

/**
 * Paints the given client's brand colours onto the document root as CSS
 * variables, so Tailwind's `client-primary` / `client-accent` classes pick
 * them up across the tree. Resets to PH defaults when `client` is null.
 */
export function useClientBranding(client: ClientSummary | null) {
  useEffect(() => {
    const root = document.documentElement;
    if (!client) {
      root.style.removeProperty('--client-primary');
      root.style.removeProperty('--client-accent');
      return;
    }
    const primary = hexToRgbString(client.primaryColor);
    const accent = hexToRgbString(client.accentColor);
    if (primary) root.style.setProperty('--client-primary', primary);
    if (accent) root.style.setProperty('--client-accent', accent);
  }, [client]);
}
