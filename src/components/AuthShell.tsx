import type { ReactNode } from 'react';

/**
 * Layout for unauthenticated pages (login, magic link verify). Centred,
 * minimal, PH branding only — clients haven't loaded yet so no per-client
 * theming applies here.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-white to-ph-purple/5 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/ph-logo.webp" alt="Panwar Health" className="h-14 w-auto" />
          <p className="text-sm text-ph-charcoal/70">Panwar Health Portal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
