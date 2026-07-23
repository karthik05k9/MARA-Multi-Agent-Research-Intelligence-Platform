import type { NormalizedSource } from "../../shared/research";
import {
  normalizeGithubRepo,
  scoreFreshness,
  scoreRelevance,
} from "../utils/normalize";

function clampMax(n: number, max: number) {
  return Math.max(1, Math.min(n, max));
}

export async function fetchGithubRepos(
  query: string,
  maxResults = 10
): Promise<NormalizedSource[]> {
  const q = query.trim();
  if (!q) return [];

  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", `${q} in:name,description,readme`);
  url.searchParams.set("sort", "updated");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(clampMax(maxResults, 20)));

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "multi-agent-ai-research-assistant/1.0",
    "X-GitHub-Api-Version": "2026-03-10",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    throw new Error(`GitHub request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];

  return items.map((repo: any) => {
    const normalized = normalizeGithubRepo(repo);
    const text = `${normalized.title} ${normalized.snippet} ${(normalized.tags ?? []).join(" ")}`;
    return {
      ...normalized,
      relevance: scoreRelevance(text, query),
      freshness: scoreFreshness(normalized.publishedAt),
    };
  });
}