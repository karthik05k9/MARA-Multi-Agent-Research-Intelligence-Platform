// server/services/openalex.ts
import { EvidenceSource } from "../../shared/research";

export async function searchOpenAlex(topic: string, timeWindow: "30d" | "90d" | "all") {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", topic);
  url.searchParams.set("per-page", "10");

  if (timeWindow !== "all") {
    const days = timeWindow === "30d" ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    url.searchParams.set("filter", `from_publication_date:${since.toISOString().slice(0, 10)}`);
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "multi-agent-research-assistant/1.0" },
  });

  if (!res.ok) throw new Error(`OpenAlex request failed: ${res.status}`);

  const data = await res.json();

  return (data.results ?? []).map((w: any): EvidenceSource => ({
    id: `oa_${w.id?.split("/").pop() ?? crypto.randomUUID()}`,
    title: w.title ?? "Untitled",
    source_type: "paper",
    source_name: "OpenAlex",
    url: w.primary_location?.landing_page_url ?? w.id,
    date: w.publication_date ?? w.created_date ?? new Date().toISOString(),
    summary: w.abstract_inverted_index ? "Abstract available in indexed form" : (w.display_name ?? ""),
    topic_tags: [topic.toLowerCase()],
    relevance_score: 0.8,
    freshness_score: 0.8,
    confidence: 0.8,
    raw_text: w.abstract_inverted_index ? JSON.stringify(w.abstract_inverted_index) : undefined,
    metadata: {
      doi: w.doi,
      cited_by_count: w.cited_by_count,
      authors: w.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) ?? [],
    },
  }));
}