import type { NormalizedSource, TopicNode } from "../../shared/research";
import { createLLMClient } from "../llm/provider";

const conceptSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    concepts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          sourceNumbers: { type: "array", items: { type: "number" } },
          description: { type: "string" },
        },
        required: ["label", "sourceNumbers", "description"],
      },
    },
  },
  required: ["concepts"],
};

const DOMAIN_CONCEPTS: Array<{
  label: string;
  description: string;
  patterns: RegExp[];
}> = [
  { label: "Agentic AI", description: "Autonomous AI systems that plan and act toward goals.", patterns: [/\bagentic\b/i, /\bai agents?\b/i] },
  { label: "Multi-Agent Systems", description: "Coordination and collaboration between multiple agents.", patterns: [/\bmulti[-\s]?agent\b/i, /\bagent collaboration\b/i, /\bagent orchestration\b/i] },
  { label: "RAG", description: "Retrieval-augmented generation and grounded response pipelines.", patterns: [/\brag\b/i, /retrieval[-\s]?augmented generation/i] },
  { label: "MCP", description: "Model Context Protocol integrations and interoperable tool access.", patterns: [/\bmcp\b/i, /model context protocol/i] },
  { label: "LLMs", description: "Large language models and their capabilities.", patterns: [/\bllms?\b/i, /large language models?/i] },
  { label: "Tool Use", description: "Models invoking tools, functions, APIs, or external systems.", patterns: [/\btool use\b/i, /\btool calling\b/i, /\bfunction calling\b/i] },
  { label: "Planning", description: "Task decomposition, planning, and execution strategies.", patterns: [/\bplanning\b/i, /\btask decomposition\b/i, /\bplan[-\s]and[-\s]execute\b/i] },
  { label: "Reasoning", description: "Reasoning methods and inference-time cognition.", patterns: [/\breasoning\b/i, /chain[-\s]of[-\s]thought/i, /\breflection\b/i] },
  { label: "Agent Memory", description: "Short-term, long-term, episodic, or semantic agent memory.", patterns: [/\bagent memory\b/i, /\blong[-\s]?term memory\b/i, /\bepisodic memory\b/i] },
  { label: "Knowledge Graphs", description: "Graph-structured knowledge, entities, and relationships.", patterns: [/\bknowledge graphs?\b/i, /\bgraph rag\b/i, /\bgraphrag\b/i] },
  { label: "Vector Databases", description: "Vector storage and similarity search infrastructure.", patterns: [/\bvector databases?\b/i, /\bvector stores?\b/i, /\bvector search\b/i] },
  { label: "Embeddings", description: "Semantic vector representations used for retrieval and clustering.", patterns: [/\bembeddings?\b/i, /\bsemantic vectors?\b/i] },
  { label: "Evaluation", description: "Benchmarks, metrics, and evaluation of system quality.", patterns: [/\bevaluations?\b/i, /\bbenchmarks?\b/i, /\bleaderboards?\b/i] },
  { label: "Fine-tuning", description: "Model adaptation through fine-tuning and parameter-efficient methods.", patterns: [/\bfine[-\s]?tuning\b/i, /\blora\b/i, /\bqlora\b/i, /\badapters?\b/i] },
  { label: "Guardrails", description: "Safety, policy enforcement, and constrained agent behavior.", patterns: [/\bguardrails?\b/i, /\bsafety constraints?\b/i, /\bpolicy enforcement\b/i] },
  { label: "Observability", description: "Tracing, monitoring, and debugging agent workflows.", patterns: [/\bobservability\b/i, /\btracing\b/i, /\bmonitoring\b/i] },
  { label: "Human-in-the-loop", description: "Human review, correction, and oversight within AI workflows.", patterns: [/\bhuman[-\s]in[-\s]the[-\s]loop\b/i, /\bhuman oversight\b/i, /\bhuman feedback\b/i] },
  { label: "Workflow Orchestration", description: "Control and execution of multi-step AI workflows.", patterns: [/\bworkflow orchestration\b/i, /\borchestration\b/i, /\bworkflow automation\b/i] },
];

function cleanJson(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function sourceText(source: NormalizedSource) {
  return `${source.title} ${source.snippet} ${(source.tags ?? []).join(" ")}`;
}

function fallbackConcepts(sources: NormalizedSource[]): TopicNode[] {
  const domainMatches = DOMAIN_CONCEPTS.map((concept) => {
    const matched = sources.filter((source) => concept.patterns.some((pattern) => pattern.test(sourceText(source))));
    return { concept, matched };
  }).filter(({ matched }) => matched.length > 0);

  const tagMatches = new Map<string, Set<string>>();
  for (const source of sources) {
    for (const rawTag of source.tags ?? []) {
      const tag = rawTag.trim();
      if (
        tag.length < 3 ||
        tag.length > 36 ||
        /^(ai|models?|paper|news|article|github|software|technology)$/i.test(tag) ||
        DOMAIN_CONCEPTS.some((concept) => concept.patterns.some((pattern) => pattern.test(tag)))
      ) continue;
      const ids = tagMatches.get(tag) ?? new Set<string>();
      ids.add(source.id);
      tagMatches.set(tag, ids);
    }
  }

  const nodes: TopicNode[] = domainMatches.map(({ concept, matched }, index) => ({
    id: `concept_domain_${index + 1}`,
    label: concept.label,
    score: matched.length * 10,
    sourceCount: matched.length,
    sourceIds: matched.map((source) => source.id),
    summaryHint: concept.description,
  }));

  const tagNodes: TopicNode[] = [...tagMatches.entries()]
    .filter(([, ids]) => ids.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 5)
    .map(([tag, ids], index) => ({
      id: `concept_tag_${index + 1}`,
      label: tag.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      score: ids.size * 8,
      sourceCount: ids.size,
      sourceIds: [...ids],
      summaryHint: `A recurring research concept supported by ${ids.size} retrieved sources.`,
    }));

  return [...nodes, ...tagNodes]
    .sort((a, b) => b.sourceCount - a.sourceCount || b.score - a.score)
    .slice(0, 14);
}

export async function buildTopicNodes(query: string, sources: NormalizedSource[]): Promise<TopicNode[]> {
  const fallback = fallbackConcepts(sources);
  if (!sources.length) return fallback;

  try {
    const llm = createLLMClient();
    const evidence = sources.map((source, index) => ({
      number: index + 1,
      title: source.title,
      text: source.snippet.slice(0, 650),
      tags: source.tags.slice(0, 8),
    }));

    const prompt = `You are the knowledge-graph concept extraction agent for the research query "${query}".

Extract only 8-14 high-value technical concepts that help a user understand the retrieved research.
Good concepts are domain ideas such as RAG, MCP, LLMs, multi-agent systems, tool use, agent memory, planning, evaluation, knowledge graphs, or similarly specific concepts appropriate to this query.

Rules:
- Never return generic words such as model, data, method, system, paper, result, research, approach, framework, application, or technology.
- Merge synonyms and spelling variants into one canonical label.
- Prefer standard acronyms when widely understood, such as RAG, MCP, and LLMs.
- Every concept must be explicitly supported by at least one supplied source.
- sourceNumbers must list every supplied source that materially discusses that concept.
- description must explain the concept's role in this evidence in one sentence.
- Do not invent concepts because they seem related to the query.

SOURCES:
${JSON.stringify(evidence, null, 2)}`;

    const raw = await llm.generateJson(prompt, conceptSchema);
    const parsed = JSON.parse(cleanJson(raw));
    const concepts = Array.isArray(parsed.concepts) ? parsed.concepts : [];
    const nodes: TopicNode[] = concepts
      .map((concept: any, index: number) => {
        const sourceIds = [...new Set(
          (Array.isArray(concept.sourceNumbers) ? concept.sourceNumbers : [])
            .map((number: unknown) => sources[Number(number) - 1]?.id)
            .filter(Boolean)
        )] as string[];
        return {
          id: `concept_ai_${index + 1}`,
          label: String(concept.label ?? "").trim(),
          score: sourceIds.length * 10,
          sourceCount: sourceIds.length,
          sourceIds,
          summaryHint: String(concept.description ?? "").trim(),
        };
      })
      .filter((node: TopicNode) =>
        node.label &&
        node.sourceCount > 0 &&
        !/^(model|models|data|method|methods|system|systems|paper|research|results?|approach|framework|technology)$/i.test(node.label)
      )
      .sort((a: TopicNode, b: TopicNode) => b.sourceCount - a.sourceCount)
      .slice(0, 14);

    return nodes.length >= 5 ? nodes : fallback;
  } catch (error) {
    console.error("Knowledge graph concept agent failed, using domain fallback:", error);
    return fallback;
  }
}
