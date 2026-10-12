/**
 * Thin wrapper over the Catalyst Web SDK (loaded from the root layout when
 * the real backend is configured). Slate serves the app from *.onslate.com
 * while functions live on *.catalystserverless.com, so API calls are
 * cross-domain and carry a token from generateAuthToken() instead of relying
 * on the session cookie.
 */

interface CatalystWebSdk {
  auth: {
    isUserAuthenticated(): Promise<{ content: { user_id: string; email_id: string; first_name: string; last_name: string } }>;
    generateAuthToken(): Promise<{ access_token: string; expires_in?: number }>;
    signOut(redirectUrl: string): void;
  };
}

declare global {
  interface Window {
    catalyst?: CatalystWebSdk;
  }
}

/** The real backend is on when its URL is baked into the build; otherwise the app runs on mock data. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_ZIASNAP_API_URL?.replace(/\/+$/, "") ?? "";
export const isRealBackend = API_BASE_URL !== "";

export const LOGIN_PATH = "/__catalyst/auth/login";
export const SIGNUP_PATH = "/__catalyst/auth/signup";

let sdkPromise: Promise<CatalystWebSdk> | null = null;

/** init.js finishes setting up `window.catalyst` asynchronously — wait for it rather than racing it. */
export function loadCatalyst(timeoutMs = 10_000): Promise<CatalystWebSdk> {
  if (typeof window === "undefined") return Promise.reject(new Error("Catalyst SDK is browser-only"));
  sdkPromise ??= new Promise<CatalystWebSdk>((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (window.catalyst?.auth?.generateAuthToken) return resolve(window.catalyst);
      if (Date.now() - started > timeoutMs) {
        sdkPromise = null;
        return reject(new Error("Catalyst sign-in didn't load. Check your connection and reload."));
      }
      setTimeout(check, 50);
    };
    check();
  });
  return sdkPromise;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const sdk = await loadCatalyst();
  const response = await sdk.auth.generateAuthToken();
  // Tokens last about an hour; refresh early so a request never carries a dying one.
  const lifetimeMs = (response.expires_in ?? 3600) * 1000;
  cachedToken = { value: response.access_token, expiresAt: Date.now() + Math.min(lifetimeMs, 3_600_000) - 120_000 };
  return response.access_token;
}

export function clearAuthToken() {
  cachedToken = null;
}

export async function isSignedIn(): Promise<boolean> {
  try {
    const sdk = await loadCatalyst();
    await sdk.auth.isUserAuthenticated();
    return true;
  } catch {
    return false;
  }
}

export function redirectToLogin() {
  // Catalyst's hosted login is served by Slate, outside the Next.js router — it needs a full navigation.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(LOGIN_PATH);
}

export async function signOut() {
  clearAuthToken();
  const sdk = await loadCatalyst();
  sdk.auth.signOut(window.location.origin);
}
