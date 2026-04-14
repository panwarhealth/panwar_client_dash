import { PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string | undefined;
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string | undefined;

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: clientId ?? '',
    authority: `https://login.microsoftonline.com/${tenantId ?? 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
});

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
  // Always prompt for account choice — users often have multiple Microsoft
  // accounts signed in (corporate + personal) and we want them to pick.
  prompt: 'select_account',
};
