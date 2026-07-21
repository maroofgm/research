import * as cheerio from "cheerio";
import type { Source } from "./types";

const SEARCH_ENDPOINT = "https://html.duckduckgo.com/html/";
const SEARCH_TIMEOUT_MS = 12_000;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function resolveResultUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl, "https://duckduckgo.com");
    const redirectTarget = url.searchParams.get("uddg");
    const resolved = redirectTarget ? new URL(redirectTarget) : url;

    if (!['http:', 'https:'].includes(resolved.protocol)) return null;
    if (resolved.hostname.endsWith("duckduckgo.com")) return null;

    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

export function parseDuckDuckGoHtml(html: string, query: string, limit = 4): Omit<Source, "id">[] {
  const $ = cheerio.load(html);
  const sources: Omit<Source, "id">[] = [];

  $(".result").each((_, element) => {
    if (sources.length >= limit) return false;

    const anchor = $(element).find("a.result__a").first();
    const url = resolveResultUrl(anchor.attr("href") || "");
    const title = cleanText(anchor.text());
    const snippet = cleanText($(element).find(".result__snippet").first().text());

    if (url && title && snippet) {
      sources.push({ title, url, snippet, query });
    }
  });

  return sources;
}

export async function searchWeb(query: string, limit = 4): Promise<Omit<Source, "id">[]> {
  const body = new URLSearchParams({ q: query });
  const response = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Search returned HTTP ${response.status}.`);
  }

  const sources = parseDuckDuckGoHtml(await response.text(), query, limit);
  if (!sources.length) {
    throw new Error(`Search returned no usable results for “${query}”.`);
  }

  return sources;
}

export async function searchQueries(queries: string[]): Promise<Source[]> {
  const results = await Promise.allSettled(queries.map((query) => searchWeb(query)));
  const unique = new Map<string, Omit<Source, "id">>();
  const domainCounts = new Map<string, number>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const source of result.value) {
      const url = new URL(source.url);
      const domain = url.hostname.replace(/^www\./, "");
      const arxivId = domain === "arxiv.org" ? url.pathname.match(/\/(?:abs|html)\/([^/]+)/)?.[1] : null;
      const key = arxivId ? `arxiv.org/${arxivId}` : domain + url.pathname.replace(/\/$/, "");
      const domainCount = domainCounts.get(domain) || 0;

      if (!unique.has(key) && domainCount < 2 && unique.size < 15) {
        unique.set(key, source);
        domainCounts.set(domain, domainCount + 1);
      }
    }
  }

  const sources = [...unique.values()].map((source, index) => ({ ...source, id: index + 1 }));
  if (sources.length < 3) {
    throw new Error("Search produced too few reliable sources. Try a more specific topic.");
  }

  return sources;
}
