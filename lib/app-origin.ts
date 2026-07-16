export const productionAppOrigin = "https://trancense.vercel.app";
export const localAppOrigin = "http://localhost:3000";

type OriginOptions = {
  configuredOrigin?: string;
  requestOrigin?: string;
  browserOrigin?: string;
  configuredPreviewOrigins?: string[];
  isProduction?: boolean;
};

function isVercelOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname.endsWith(".vercel.app") && hostname !== "vercel.app";
  } catch {
    return false;
  }
}

export function normalizeAppOrigin(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(normalized);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const validProtocol = parsed.protocol === "https:" || (parsed.protocol === "http:" && isLocal);
    const validPath = parsed.pathname === "" || parsed.pathname === "/";
    if (!validProtocol || !validPath || parsed.search || parsed.hash || parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isTrustedAppOrigin(value: string | null | undefined, options: Pick<OriginOptions, "isProduction" | "configuredPreviewOrigins" | "configuredOrigin"> = {}) {
  const origin = normalizeAppOrigin(value);
  if (!origin) return false;
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";
  if (origin === productionAppOrigin) return true;
  if (!isProduction && origin === localAppOrigin) return true;

  const configured = normalizeAppOrigin(options.configuredOrigin);
  const previews = (options.configuredPreviewOrigins ?? []).map(normalizeAppOrigin).filter((item): item is string => Boolean(item));
  return (configured === origin || previews.includes(origin)) && isVercelOrigin(origin);
}

export function resolveTrustedAppOrigin(options: OriginOptions = {}) {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";
  const configuredOrigin = normalizeAppOrigin(options.configuredOrigin);
  const candidates = [configuredOrigin, normalizeAppOrigin(options.requestOrigin), normalizeAppOrigin(options.browserOrigin)];
  for (const candidate of candidates) {
    if (candidate && isTrustedAppOrigin(candidate, { isProduction, configuredOrigin: configuredOrigin ?? undefined, configuredPreviewOrigins: options.configuredPreviewOrigins })) return candidate;
  }
  return isProduction ? productionAppOrigin : localAppOrigin;
}

export function getTrustedAppOrigin(options: Omit<OriginOptions, "configuredOrigin" | "browserOrigin"> & { configuredOrigin?: string; browserOrigin?: string } = {}) {
  const browserOrigin = options.browserOrigin ?? (typeof window !== "undefined" ? window.location.origin : undefined);
  return resolveTrustedAppOrigin({ ...options, configuredOrigin: options.configuredOrigin ?? process.env.NEXT_PUBLIC_APP_URL, browserOrigin });
}

export function getSafeInternalPath(value: string | null | undefined, fallback = "/overview") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const parsed = new URL(value, productionAppOrigin);
    if (parsed.origin !== productionAppOrigin) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}
