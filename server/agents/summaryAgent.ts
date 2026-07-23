import type { NormalizedSource, SummaryResult, TopicNode } from "../../shared/research";

export function buildBriefSummary(
  query: string,
  nodes: TopicNode[],
  sources: NormalizedSource[]
): string {
  const top = nodes.slice(0, 3).map((n) => n.label).join(", ");
  return [
    `Top query: ${query}.`,
    `Matched ${sources.length} sources across ${nodes.length} topic nodes.`,
    top ? `Main themes: ${top}.` : `No strong topic cluster yet.`,
  ].join(" ");
}

export function buildExtensiveSummary(
  query: string,
  nodes: TopicNode[],
  sources: NormalizedSource[]
): string {
  const counts = {
    paper: sources.filter((s) => s.type === "paper").length,
    article: sources.filter((s) => s.type === "article").length,
    news: sources.filter((s) => s.type === "news").length,
    repo: sources.filter((s) => s.type === "repo").length,
    model: sources.filter((s) => s.type === "model").length,
  };

  const topNodes = nodes.slice(0, 5).map((n) => `- ${n.label} (${n.sourceCount})`).join("\n");
  const topSources = sources.slice(0, 8).map((s) => `- [${s.type}] ${s.title}`).join("\n");

  return [
    `Query: ${query}`,
    ``,
    `Coverage`,
    `- Papers: ${counts.paper}`,
    `- Articles/News: ${counts.article + counts.news}`,
    `- GitHub repos: ${counts.repo}`,
    `- Hugging Face models: ${counts.model}`,
    ``,
    `Main topic nodes`,
    topNodes || `- None yet`,
    ``,
    `Representative sources`,
    topSources || `- None yet`,
    ``,
    `Interpretation`,
    `This result set is organized so the user can click a node, inspect the sources behind it, and then choose either a brief or extensive summary.`,
  ].join("\n");
}

export function buildSummaries(
  query: string,
  nodes: TopicNode[],
  sources: NormalizedSource[]
): SummaryResult {
  return {
    brief: buildBriefSummary(query, nodes, sources),
    extensive: buildExtensiveSummary(query, nodes, sources),
  };
}