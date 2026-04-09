import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn/ui's standard Tailwind class merger. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Convert a hex colour string to "R G B" so it can be slotted into the
 * `--client-primary` / `--client-accent` CSS variables that Tailwind reads
 * via the `<alpha-value>` placeholder. Returns null on parse failure.
 */
export function hexToRgbString(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return `${r} ${g} ${b}`;
}
