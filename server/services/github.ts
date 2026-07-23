import { EvidenceSource } from "../../shared/research";

export async function searchGitHub(topic: string): Promise<EvidenceSource[]> {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", `${topic} in:name,description`);
  url.searchParams.set("sort", "updated");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "10");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });

  if (!res.ok) throw new Error(`GitHub request failed: ${res.status}`);

  const data = await res.json();
  return (data.items ?? []).map((r: any): EvidenceSource => ({
    id: `gh_${r.id}`,
    title: r.full_name,
    source_type: "github",
    source_name: "GitHub",
    url: r.html_url,
    date: r.updated_at ?? r.created_at,
    summary: r.description ?? "",
    topic_tags: [topic.toLowerCase(), "github"],
    relevance_score: 0.8,
    freshness_score: 0.8,
    confidence: 0.75,
    metadata: {
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
    },
  }));
}