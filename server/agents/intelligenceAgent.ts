import type {
  NormalizedSource,
  ResearchInsight,
  ResearchIntelligence,
  SummaryResult,
  TopicNode,
} from "../../shared/research";
import { createLLMClient } from "../llm/provider";

const synthesisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    brief: { type: "string" },
    extensive: { type: "string" },
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          sourceNumbers: { type: "array", items: { type: "number" } },
        },
      },
    },
    consensus: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
  },
  required: ["brief", "extensive", "insights", "consensus", "gaps"],
};

function cleanJson(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function fallbackSynthesis(
  query: string,
  nodes: TopicNode[],
  sources: NormalizedSource[]
): Omit<ResearchIntelligence, "agentRuns"> & { summary: SummaryResult } {
  const topSources = sources;
  const topNodes = nodes.slice(0, 6);
  const insights: ResearchInsight[] = topNodes.slice(0, 4).map((node) => {
    const evidence = sources.filter((source) => node.sourceIds.includes(source.id)).slice(0, 3);
    const explanation = evidence
      .map((source) => `${source.title}: ${source.snippet || "Relevant evidence identified."}`)
      .join(" ");
    return {
      title: node.label,
      explanation: explanation.slice(0, 520),
      sourceIds: evidence.map((source) => source.id),
    };
  });

  const brief = topSources.length
    ? `The evidence on “${query}” is led by ${topNodes.slice(0, 3).map((node) => node.label).join(", ")}. ${topSources
        .slice(0, 3)
        .map((source) => source.snippet)
        .filter(Boolean)
        .join(" ")
        .slice(0, 700)}`
    : `No reliable evidence was retrieved for “${query}”. Refine the query or check the source connections.`;

  const themeSections = insights
    .map((insight, index) => `${index + 1}. ${insight.title}\n${insight.explanation}`)
    .join("\n\n");
  const evidenceList = topSources
    .map((source, index) => `- [${index + 1}] ${source.title} (${source.source}): ${source.snippet}`)
    .join("\n");

  return {
    summary: {
      brief,
      extensive: [
        `Research synthesis: ${query}`,
        "",
        "Key themes",
        themeSections || "No stable themes could be extracted.",
        "",
        "Strongest evidence",
        evidenceList || "No evidence available.",
        "",
        "Cross-source interpretation",
        topNodes.length
          ? `The recurring concepts—${topNodes.map((node) => node.label).join(", ")}—show where independent sources overlap. Claims should still be checked against the linked primary material before being treated as conclusive.`
          : "The retrieved material does not yet support a stable cross-source interpretation.",
      ].join("\n"),
    },
    insights,
    consensus: topNodes.slice(0, 3).map(
      (node) => `${node.label} appears across ${node.sourceCount} independent source${node.sourceCount === 1 ? "" : "s"}.`
    ),
    gaps: [
      "Source snippets may omit methods, limitations, and full experimental context.",
      "Conflicting findings require inspection of the linked primary sources.",
    ],
    usedLLM: false,
  };
}

export async function synthesizeResearch(
  query: string,
  nodes: TopicNode[],
  sources: NormalizedSource[]
): Promise<Omit<ResearchIntelligence, "agentRuns"> & { summary: SummaryResult }> {
  const fallback = fallbackSynthesis(query, nodes, sources);
  if (!sources.length) return fallback;

  try {
    const llm = createLLMClient();
    const evidence = sources.map((source, index) => ({
      number: index + 1,
      type: source.type,
      source: source.source,
      title: source.title,
      snippet: source.snippet.slice(0, 1200),
      tags: source.tags.slice(0, 10),
    }));

    const prompt = `You are MARA's evidence synthesis agent. Analyze only the supplied evidence for the query "${query}".

Do not discuss how many items were retrieved. Synthesize what the evidence says.
- The brief must be a dense, decision-useful paragraph.
- The extensive summary must use these sections: Executive synthesis, Major findings, Agreements and tensions, Practical implications, Evidence limitations.
- Distinguish demonstrated findings from inference.
- Cite evidence inline with [source number].
- Produce 4-7 insights. sourceNumbers must refer to the supplied evidence.
- Consensus statements must describe actual cross-source agreement.
- Gaps must name missing evidence, uncertainty, or contradictions.

EVIDENCE:
${JSON.stringify(evidence, null, 2)}`;

    const raw = await llm.generateJson(prompt, synthesisSchema);
    const parsed = JSON.parse(cleanJson(raw));
    const insights: ResearchInsight[] = (Array.isArray(parsed.insights) ? parsed.insights : [])
      .slice(0, 7)
      .map((insight: any) => ({
        title: String(insight.title ?? "Finding"),
        explanation: String(insight.explanation ?? ""),
        sourceIds: (Array.isArray(insight.sourceNumbers) ? insight.sourceNumbers : [])
          .map((number: unknown) => sources[Number(number) - 1]?.id)
          .filter(Boolean),
      }));

    return {
      summary: {
        brief: String(parsed.brief || fallback.summary.brief),
        extensive: String(parsed.extensive || fallback.summary.extensive),
      },
      insights: insights.length ? insights : fallback.insights,
      consensus: Array.isArray(parsed.consensus) ? parsed.consensus.map(String).slice(0, 6) : fallback.consensus,
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 6) : fallback.gaps,
      usedLLM: true,
    };
  } catch (error) {
    console.error("Synthesis agent failed, using evidence fallback:", error);
    return fallback;
  }
}
