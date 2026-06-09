import { useEffect } from 'react';
import { hexToRgbString } from '@/lib/utils';
import type { ClientSummary } from '@/api/clients';

const COMPANY = 'Panwar Health';
const DEFAULT_TITLE = `Dashboards - ${COMPANY}`;

/**
 * Paints the given client's brand onto the document: brand colours as CSS
 * variables (so Tailwind's `client-primary` / `client-accent` classes pick
 * them up across the tree) and the browser tab title. Resets to PH defaults
 * when `client` is null.
 */
export function useClientBranding(client: ClientSummary | null) {
  useEffect(() => {
    const root = document.documentElement;
    if (!client) {
      root.style.removeProperty('--client-primary');
      root.style.removeProperty('--client-accent');
      document.title = DEFAULT_TITLE;
      return;
    }
    const primary = hexToRgbString(client.primaryColor);
    const accent = hexToRgbString(client.accentColor);
    if (primary) root.style.setProperty('--client-primary', primary);
    if (accent) root.style.setProperty('--client-accent', accent);
    document.title = `${client.name} - ${COMPANY}`;

    // Reset the tab title when leaving the client-scoped layout (e.g. back to
    // the client picker) so it doesn't stay stuck on the last client's name.
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [client]);
}
