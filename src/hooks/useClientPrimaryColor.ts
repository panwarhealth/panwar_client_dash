import { useEffect, useState } from 'react';

/**
 * Reads the live `--client-primary` CSS variable (set by useClientBranding)
 * so non-Tailwind consumers (Recharts SVG paints) can use the active client's
 * brand colour. Falls back to PH purple while the variable is unset.
 */
export function useClientPrimaryColor(): string {
  const [color, setColor] = useState('#702f8f');
  useEffect(() => {
    const rgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--client-primary')
      .trim();
    if (rgb) setColor(`rgb(${rgb})`);
  }, []);
  return color;
}
