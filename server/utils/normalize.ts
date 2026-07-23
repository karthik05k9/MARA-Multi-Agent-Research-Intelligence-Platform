import crypto from "crypto";
import type { NormalizedSource, SourceType } from "../../shared/research";

function shaId(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 16);
}

function cleanText(value: string | undefined | null): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return cleanText(value);
}

function keywordTags(text: string): string[] {
  const lower = text.toLowerCase();

  const rules: Array<[string, RegExp]> = [
    ["rag", /\brag\b|retrieval[-\s]?augmented/i],
    ["agents", /\bagent(ic)?\b|orchestration|tool[-\s]?use/i],
    ["evaluation", /benchmark|eval|evaluation|leaderboard/i],
    ["fine-tuning", /fine[-\s]?tuning|adapter|lora|qlora/i],
    ["nlp", /\bnlp\b|llm|language model/i],
    ["models", /\bmodel(s)?\b|checkpoint|weights/i],
    ["github", /github|repo|repository/i],
    ["paper", /paper|preprint|arxiv|ieee/i],
    ["news", /news|article|blog|medium|techcrunch|tldr|techmeme/i],
  ];

  return rules.filter(([, re]) => re.test(lower)).map(([tag]) => tag);
}

function baseNormalizedSource(
  type: SourceType,
  source: string,
  title: string,
  url: string,
  publishedAt: string,
  snippet: string,
  tags: string[],
  relevance = 0.5,
  freshness = 0.5,
  raw?: unknown
): NormalizedSource {
  const id = shaId(`${source}|${title}|${url}`);

  return {
    id,
    type,
    title: titleCase(title),
    url,
    source,
    publishedAt,
    snippet: cleanText(snippet),
    tags: Array.from(new Set(tags.map((t) => t.toLowerCase()))),
    relevance,
    freshness,
    raw,
  };
}

export function normalizeArxivEntry(entry: any): NormalizedSource {
  const title = cleanText(entry.title);
  const summary = cleanText(entry.summary);
  const url =
    cleanText(entry.url) ||
    cleanText(entry.alternateUrl) ||
    cleanText(entry.id) ||
    "";
  const publishedAt = cleanText(entry.published) || new Date().toISOString();
  const tags = keywordTags(`${title} ${summary}`);

  return baseNormalizedSource(
    "paper",
    "arXiv",
    title,
    url,
    publishedAt,
    summary,
    tags,
    0.75,
    0.9,
    entry
  );
}

export function normalizeGithubRepo(repo: any): NormalizedSource {
  const title = cleanText(repo.full_name || repo.name);
  const url = cleanText(repo.html_url || repo.url);
  const summary = cleanText(repo.description);
  const publishedAt = cleanText(repo.updated_at || repo.pushed_at || repo.created_at) || new Date().toISOString();
  const tags = [
    ...keywordTags(`${title} ${summary} ${(repo.topics ?? []).join(" ")}`),
    ...(Array.isArray(repo.topics) ? repo.topics : []),
    repo.language,
  ].filter(Boolean) as string[];

  const starBoost = Math.min(Number(repo.stargazers_count ?? 0) / 1000, 1);

  return baseNormalizedSource(
    "repo",
    "GitHub",
    title,
    url,
    publishedAt,
    summary || "GitHub repository",
    tags,
    0.65 + starBoost * 0.2,
    0.7,
    repo
  );
}

export function normalizeHfModel(model: any): NormalizedSource {
  const title = cleanText(model.modelId || model.id || model.name);
  const url =
    cleanText(model.url) ||
    `https://huggingface.co/${encodeURIComponent(title)}`;
  const summary = cleanText(model.pipeline_tag || model.tags?.join(" ") || model.summary);
  const publishedAt = cleanText(model.createdAt || model.lastModified) || new Date().toISOString();
  const tags = [
    ...keywordTags(`${title} ${summary} ${(model.tags ?? []).join(" ")}`),
    ...(Array.isArray(model.tags) ? model.tags : []),
    model.pipeline_tag,
  ].filter(Boolean) as string[];

  return baseNormalizedSource(
    "model",
    "Hugging Face",
    title,
    url,
    publishedAt,
    summary || "Hugging Face model",
    tags,
    0.7,
    0.8,
    model
  );
}

export function normalizeNewsItem(item: any, sourceName = "News"): NormalizedSource {
  const title = cleanText(item.title);
  const url = cleanText(item.link || item.url);
  const summary = cleanText(item.summary || item.description || item.contentSnippet);
  const publishedAt = cleanText(item.pubDate || item.published || item.isoDate) || new Date().toISOString();
  const tags = keywordTags(`${title} ${summary} ${sourceName}`);

  return baseNormalizedSource(
    "news",
    sourceName,
    title,
    url,
    publishedAt,
    summary,
    tags,
    0.6,
    0.85,
    item
  );
}

export function dedupeAndSortSources(sources: NormalizedSource[]): NormalizedSource[] {
  const map = new Map<string, NormalizedSource>();

  for (const src of sources) {
    const key = `${src.url}|${src.title}`.toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, src);
      continue;
    }

    const better =
      src.relevance + src.freshness > existing.relevance + existing.freshness
        ? src
        : existing;

    map.set(key, better);
  }

  return [...map.values()].sort((a, b) => {
    const scoreA = a.relevance * 0.7 + a.freshness * 0.3;
    const scoreB = b.relevance * 0.7 + b.freshness * 0.3;
    return scoreB - scoreA;
  });
}

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function scoreFreshness(publishedAt: string): number {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return 0.5;

  const days = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  if (days <= 7) return 1;
  if (days <= 30) return 0.9;
  if (days <= 90) return 0.75;
  if (days <= 365) return 0.5;
  return 0.3;
}

export function scoreRelevance(text: string, query: string): number {
  const hay = text.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (!terms.length) return 0.5;

  let hits = 0;
  for (const term of terms) {
    if (hay.includes(term)) hits += 1;
  }

  return clamp01(hits / Math.max(terms.length, 1));
}