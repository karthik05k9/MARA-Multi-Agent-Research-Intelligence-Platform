import { EvidenceSource } from "../../shared/research";

export function rankSources(sources: EvidenceSource[]) {
  return [...sources]
    .map((s) => ({
      ...s,
      metadata: {
        ...s.metadata,
        combinedScore:
          s.relevance_score * 0.45 +
          s.freshness_score * 0.25 +
          s.confidence * 0.30,
      },
    }))
    .sort((a, b) => (b.metadata?.combinedScore ?? 0) - (a.metadata?.combinedScore ?? 0));
}