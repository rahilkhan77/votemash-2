const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 512_000;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

export type SiteMetadata = {
  url: string;
  name: string;
  description: string;
  logoUrl: string | null;
  ogImageUrl: string | null;
};

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function metaContent(html: string, ...keys: string[]): string | null {
  for (const key of keys) {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeEntities(match[1].trim());
    }
  }
  return null;
}

function titleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeEntities(match[1].trim()) : null;
}

function googleFavicon(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

function faviconFromHtml(html: string, base: URL): string {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  const scored: { href: string; score: number }[] = [];

  for (const tag of tags) {
    const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const rawHref = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!rel || !rawHref || !rel.includes("icon")) continue;
    let href: string;
    try {
      href = new URL(decodeEntities(rawHref), base).toString();
    } catch {
      continue;
    }
    let score = 1;
    if (rel.includes("apple-touch")) score += 5;
    if (/\.(png|svg|webp)(\?|$)/i.test(href)) score += 2;
    scored.push({ href, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.href ?? googleFavicon(base.hostname);
}

function hostnameFallback(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

export function normalizePublicUrl(raw: string): URL {
  const trimmed = raw.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error("That URL cannot be fetched");
  }
  return url;
}

export async function fetchSiteMetadata(rawUrl: string): Promise<SiteMetadata> {
  const url = normalizePublicUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "VoteMashBot/1.0 (+https://votemash.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Could not load that site (${response.status})`);
    }

    const finalUrl = new URL(response.url);
    if (isBlockedHost(finalUrl.hostname)) {
      throw new Error("That URL cannot be fetched");
    }

    const reader = response.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let received = 0;
      while (received < MAX_HTML_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (html.includes("</head>") || received >= MAX_HTML_BYTES) {
          await reader.cancel();
          break;
        }
      }
    } else {
      html = (await response.text()).slice(0, MAX_HTML_BYTES);
    }

    const name =
      metaContent(html, "og:site_name", "og:title", "twitter:title") ??
      titleFromHtml(html) ??
      hostnameFallback(finalUrl);

    const description =
      metaContent(html, "og:description", "description", "twitter:description") ??
      "";

    const ogImageRaw = metaContent(html, "og:image", "twitter:image");
    const ogImageUrl = ogImageRaw
      ? new URL(ogImageRaw, finalUrl).toString()
      : null;

    return {
      url: finalUrl.toString(),
      name: name.slice(0, 80),
      description: description.slice(0, 280),
      logoUrl: faviconFromHtml(html, finalUrl) || googleFavicon(finalUrl.hostname),
      ogImageUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timed out fetching that website");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
