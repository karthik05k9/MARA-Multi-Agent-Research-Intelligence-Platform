import { EvidenceSource } from "../../shared/research";

export async function searchHuggingFace(topic: string): Promise<EvidenceSource[]> {
  const url = new URL("https://huggingface.co/api/models");
  url.searchParams.set("search", topic);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Hugging Face request failed: ${res.status}`);

  const data = await res.json();
  return (data ?? []).slice(0, 10).map((m: any): EvidenceSource => ({
    id: `hf_${m.id.replace(/[^\w-]/g, "_")}`,
    title: m.id,
    source_type: "model",
    source_name: "Hugging Face",
    url: `https://huggingface.co/${m.id}`,
    date: m.lastModified ?? new Date().toISOString(),
    summary: m.pipeline_tag ? `Model for ${m.pipeline_tag}` : (m.cardData?.model_name ?? ""),
    topic_tags: [topic.toLowerCase(), "huggingface"],
    relevance_score: 0.75,
    freshness_score: 0.8,
    confidence: 0.7,
    metadata: {
      downloads: m.downloads,
      likes: m.likes,
      pipeline_tag: m.pipeline_tag,
    },
  }));
}