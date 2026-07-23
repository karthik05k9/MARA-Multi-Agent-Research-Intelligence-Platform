import type { NormalizedSource } from "../../shared/research";
import {
  normalizeHfModel,
  scoreFreshness,
  scoreRelevance,
} from "../utils/normalize";

function clampMax(n: number, max: number) {
  return Math.max(1, Math.min(n, max));
}

export async function fetchHuggingFaceModels(
  query: string,
  maxResults = 10
): Promise<NormalizedSource[]> {
  const q = query.trim();
  if (!q) return [];

  const url = new URL("https://huggingface.co/api/models");
  url.searchParams.set("search", q);
  url.searchParams.set("limit", String(clampMax(maxResults, 20)));

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token =
    process.env.HF_TOKEN?.trim() ||
    process.env.HUGGINGFACEHUB_API_TOKEN?.trim() ||
    process.env.HF_API_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    throw new Error(`Hugging Face request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items = Array.isArray(data) ? data : Array.isArray(data?.models) ? data.models : [];

  return items.map((model: any) => {
    const normalized = normalizeHfModel(model);
    const text = `${normalized.title} ${normalized.snippet} ${(normalized.tags ?? []).join(" ")}`;

    return {
      ...normalized,
      relevance: scoreRelevance(text, query),
      freshness: scoreFreshness(normalized.publishedAt),
    };
  });
}