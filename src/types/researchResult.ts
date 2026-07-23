export type SourceType = "paper" | "article" | "news" | "repo" | "model";

export interface NormalizedSource {
  id: string;
  type: SourceType;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
  tags: string[];
  relevance: number;
  freshness: number;
  raw?: unknown;
}

export interface TopicNode {
  id: string;
  label: string;
  score: number;
  sourceCount: number;
  sourceIds: string[];
  summaryHint: string;
}

export interface SummaryResult {
  brief: string;
  extensive: string;
}

export interface ResearchInsight {
  title: string;
  explanation: string;
  sourceIds: string[];
}

export interface AgentRun {
  id: string;
  name: string;
  role: "retrieval" | "analysis" | "synthesis";
  status: "completed" | "partial" | "skipped";
  sourceCount?: number;
  message: string;
}

export interface ResearchIntelligence {
  insights: ResearchInsight[];
  consensus: string[];
  gaps: string[];
  agentRuns: AgentRun[];
  usedLLM: boolean;
}

export interface ResearchResult {
  query: string;
  generatedAt: string;
  nodes: TopicNode[];
  sources: NormalizedSource[];
  summary: SummaryResult;
  intelligence: ResearchIntelligence;
}
