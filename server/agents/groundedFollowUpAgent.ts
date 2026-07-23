import type { NormalizedSource } from "../../shared/research";
import { createLLMClient } from "../llm/provider";

export interface GroundedAnswer {
  answer: string;
  citationIds: string[];
}

const answerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" },
    sourceNumbers: { type: "array", items: { type: "number" } },
  },
  required: ["answer", "sourceNumbers"],
};

function cleanJson(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function fallbackAnswer(question: string, sources: NormalizedSource[]): GroundedAnswer {
  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
  const ranked = sources
    .map((source) => ({
      source,
      score: terms.reduce(
        (score, term) => score + (`${source.title} ${source.snippet} ${source.tags.join(" ")}`.toLowerCase().includes(term) ? 1 : 0),
        0
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (!ranked.length || ranked[0].score === 0) {
    return {
      answer: "The retrieved documents do not contain enough information to answer that question. Try asking about one of the concepts shown in the knowledge graph.",
      citationIds: [],
    };
  }

  return {
    answer: ranked
      .map(({ source }, index) => `[${index + 1}] ${source.title}: ${source.snippet}`)
      .join("\n\n"),
    citationIds: ranked.map(({ source }) => source.id),
  };
}

export async function answerFromRetrievedSources(
  question: string,
  originalQuery: string,
  sources: NormalizedSource[],
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<GroundedAnswer> {
  const fallback = fallbackAnswer(question, sources);
  if (!sources.length) return fallback;

  try {
    const llm = createLLMClient();
    const evidence = sources.map((source, index) => ({
      number: index + 1,
      title: source.title,
      source: source.source,
      type: source.type,
      text: source.snippet.slice(0, 1400),
      tags: source.tags.slice(0, 10),
    }));

    const prompt = `You are MARA's document-grounded follow-up agent.

Original research query: "${originalQuery}"
Follow-up question: "${question}"

Answer only from the RETRIEVED DOCUMENTS below. Do not browse, use outside knowledge, or infer unsupported facts.
- If the documents do not answer the question, say so clearly.
- Synthesize across relevant documents instead of listing snippets.
- Distinguish evidence from cautious inference.
- Cite claims inline using [source number].
- sourceNumbers must contain only the documents actually used.

Recent conversation:
${JSON.stringify(history.slice(-6), null, 2)}

RETRIEVED DOCUMENTS:
${JSON.stringify(evidence, null, 2)}`;

    const raw = await llm.generateJson(prompt, answerSchema);
    const parsed = JSON.parse(cleanJson(raw));
    const citationIds = [...new Set(
      (Array.isArray(parsed.sourceNumbers) ? parsed.sourceNumbers : [])
        .map((number: unknown) => sources[Number(number) - 1]?.id)
        .filter(Boolean)
    )] as string[];

    return {
      answer: String(parsed.answer || fallback.answer),
      citationIds,
    };
  } catch (error) {
    console.error("Grounded follow-up agent failed, using document matching fallback:", error);
    return fallback;
  }
}
