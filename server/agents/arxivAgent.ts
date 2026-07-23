import {
  normalizeArxivEntry,
  scoreFreshness,
  scoreRelevance,
} from "../utils/normalize";
import type { NormalizedSource } from "../../shared/research";

function stripHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function extractLink(block: string): string {
  const alt = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  if (alt?.[1]) return alt[1];

  const abs = block.match(/<id>([\s\S]*?)<\/id>/i);
  return abs ? stripHtml(abs[1]) : "";
}

function extractAuthors(block: string): string[] {
  const authors: string[] = [];
  const re = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi;
  for (const match of block.matchAll(re)) {
    const name = stripHtml(match[1]);
    if (name) authors.push(name);
  }
  return authors;
}

function extractCategories(block: string): string[] {
  const categories: string[] = [];
  const re = /<category[^>]*term="([^"]+)"/gi;
  for (const match of block.matchAll(re)) {
    if (match[1]) categories.push(match[1]);
  }
  return categories;
}

function buildArxivQuery(query: string) {
  const cleaned = query.trim().replace(/\s+/g, " ");
  return `all:${cleaned}`;
}

export async function fetchArxivPapers(
  query: string,
  maxResults = 10
): Promise<NormalizedSource[]> {
  const searchQuery = buildArxivQuery(query);
  const url =
    `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}` +
    `&start=0&max_results=${Math.max(1, Math.min(maxResults, 25))}` +
    `&sortBy=submittedDate&sortOrder=descending`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "multi-agent-ai-research-assistant/1.0",
      "Accept": "application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`arXiv request failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const entryBlocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  const results: NormalizedSource[] = entryBlocks.map((block) => {
    const title = extractTag(block, "title");
    const summary = extractTag(block, "summary");
    const published = extractTag(block, "published");
    const url = extractLink(block);
    const authors = extractAuthors(block);
    const categories = extractCategories(block);

    const normalized = normalizeArxivEntry({
      title,
      summary,
      published,
      url,
      authors,
      categories,
      id: extractTag(block, "id"),
      raw: block,
    });

    const relevance = scoreRelevance(
      `${normalized.title} ${normalized.snippet} ${(normalized.tags ?? []).join(" ")}`,
      query
    );

    return {
      ...normalized,
      relevance,
      freshness: scoreFreshness(normalized.publishedAt),
    };
  });

  return results;
}