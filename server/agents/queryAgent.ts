import type { JsonLLM } from "../llm/types";

const querySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topic: { type: "string" },
    intent: { type: "string" },
    outputStyle: { type: "string" },
    timeWindow: { type: "string" },
    subareas: { type: "array", items: { type: "string" } },
    searchTerms: { type: "array", items: { type: "string" } },
  },
  required: ["topic", "intent", "outputStyle", "timeWindow", "subareas", "searchTerms"],
};

function toStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function cleanJsonText(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function understandQuery(
  llm: JsonLLM,
  query: string,
  timeWindow: string,
  mode: string
) {
  const fallback = {
    topic: query.trim(),
    intent: "research",
    outputStyle: mode,
    timeWindow,
    subareas: [],
    searchTerms: query.split(/\s+/).filter(Boolean),
  };

  const prompt = `
You are a research query parser.

Return JSON only. No markdown, no code fences.

Schema:
- topic: string
- intent: string
- outputStyle: string
- timeWindow: string
- subareas: string[]
- searchTerms: string[]

User query: "${query}"
Mode: "${mode}"
Time window: "${timeWindow}"
`;

  try {
    const raw = await llm.generateJson(prompt, querySchema);
    if (!raw?.trim()) return fallback;

    const cleaned = cleanJsonText(raw);
    if (!cleaned) return fallback;

    const parsed = JSON.parse(cleaned);

    return {
      topic: String(parsed.topic ?? fallback.topic).trim() || fallback.topic,
      intent: String(parsed.intent ?? fallback.intent),
      outputStyle: String(parsed.outputStyle ?? fallback.outputStyle),
      timeWindow: String(parsed.timeWindow ?? fallback.timeWindow),
      subareas: toStringArray(parsed.subareas, fallback.subareas),
      searchTerms: toStringArray(parsed.searchTerms, fallback.searchTerms),
    };
  } catch (err) {
    console.error("Query agent failed, using fallback:", err);
    return fallback;
  }
}