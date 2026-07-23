import type { NormalizedSource } from "../../shared/research";
import {
  scoreFreshness,
  scoreRelevance,
  normalizeArxivEntry,
} from "../utils/normalize";

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.records)) return value.records;
  if (Array.isArray(value?.articles)) return value.articles;
  return [];
}

function buildIeeeUrl(query: string, maxResults: number) {
  const apiKey = process.env.IEEE_API_KEY?.trim();
  const baseUrl = process.env.IEEE_BASE_URL?.trim() || "https://ieeexploreapi.ieee.org/api/v1/search/articles";
  const url = new URL(baseUrl);

  url.searchParams.set("apikey", apiKey || "");
  url.searchParams.set("format", "json");
  url.searchParams.set("max_records", String(Math.max(1, Math.min(maxResults, 25))));
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("sort_field", "publication_year");
  url.searchParams.set("querytext", query);

  return url.toString();
}

export async function fetchIeeePapers(
  query: string,
  maxResults = 10
): Promise<NormalizedSource[]> {
  const apiKey = process.env.IEEE_API_KEY?.trim();
  if (!apiKey) {
    return [];
  }

  const url = buildIeeeUrl(query.trim(), maxResults);

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "multi-agent-ai-research-assistant/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`IEEE request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items = asArray(data);

  return items.map((item: any, idx: number): NormalizedSource => {
    const title = String(item.title ?? item.article_title ?? item.paper_title ?? "").trim();
    const abstract = String(item.abstract ?? item.abstract_text ?? item.abstractText ?? "").trim();
    const url = String(item.pdf_url ?? item.html_url ?? item.pdfUrl ?? item.article_url ?? item.url ?? "").trim();
    const publishedAt =
      String(item.publication_date ?? item.published ?? item.publicationDate ?? item.publication_year ?? new Date().toISOString()).trim();

    const normalized = normalizeArxivEntry({
      title,
      summary: abstract,
      published: publishedAt,
      url,
      id: `ieee-${idx}-${title}`,
    });

    const text = `${normalized.title} ${normalized.snippet} ${(normalized.tags ?? []).join(" ")}`;

    return {
      ...normalized,
      source: "IEEE Xplore",
      type: "paper",
      relevance: scoreRelevance(text, query),
      freshness: scoreFreshness(normalized.publishedAt),
      raw: item,
    };
  });
}