import Parser from "rss-parser";
import type { NormalizedSource } from "../../shared/research";
import {
  normalizeNewsItem,
  scoreFreshness,
  scoreRelevance,
} from "../utils/normalize";

const parser = new Parser({
  timeout: 15000,
});

function slugifyTag(tag: string) {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function queryTerms(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .slice(0, 3);
}

async function parseFeed(feedUrl: string, sourceName: string): Promise<NormalizedSource[]> {
  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "multi-agent-ai-research-assistant/1.0",
      Accept: "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`${sourceName} feed failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const feed = await parser.parseString(xml);
  const items = Array.isArray(feed.items) ? feed.items : [];

  return items.map((item: any) => {
    const normalized = normalizeNewsItem(item, sourceName);
    const text = `${normalized.title} ${normalized.snippet} ${(normalized.tags ?? []).join(" ")}`;
    return {
      ...normalized,
      relevance: scoreRelevance(text, normalized.title),
      freshness: scoreFreshness(normalized.publishedAt),
    };
  });
}

export async function fetchTechNews(query: string, maxResults = 10): Promise<NormalizedSource[]> {
  const terms = queryTerms(query);

  const feeds: Array<{ source: string; url: string }> = [
    { source: "TechCrunch", url: "https://techcrunch.com/feed/" },
    { source: "Techmeme", url: "https://www.techmeme.com/feed.xml" },
    { source: "TLDR Tech", url: "https://tldr.tech/api/rss/tech" },
  ];

  for (const term of terms) {
    feeds.push({
      source: `Medium:${term}`,
      url: `https://medium.com/feed/tag/${encodeURIComponent(slugifyTag(term))}`,
    });
  }

  const settled = await Promise.allSettled(
    feeds.map((f) => parseFeed(f.url, f.source))
  );

  const all: NormalizedSource[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }

  const filtered = all
    .filter((item) => {
      const hay = `${item.title} ${item.snippet} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      return !terms.length || terms.some((t) => hay.includes(t));
    })
    .sort((a, b) => (b.relevance + b.freshness) - (a.relevance + a.freshness));

  return filtered.slice(0, Math.max(1, Math.min(maxResults, 30)));
}