// export interface EvidenceSource {
//   id: string;
//   title: string;
//   source_type: "paper" | "github" | "article" | "model" | "benchmark";
//   source_name: string;
//   url: string;
//   date: string;
//   summary: string;
//   topic_tags: string[];
//   relevance_score: number;
//   freshness_score: number;
//   confidence: number;
//   raw_text?: string;
//   metadata?: Record<string, any>;
// }

// export interface HypothesisDebate {
//   id: string;
//   claim: string;
//   pros: string;
//   cons: string;
//   confidence_score: number;
//   evidence_strength: number; // Scale of 1 to 10
//   novelty: number;            // Scale of 1 to 10
//   risk: number;               // Scale of 1 to 10
//   status: "supported" | "contested" | "refuted";
//   reasoning: string;
// }

// export interface SynthesisReport {
//   executiveSummary: string;
//   keyTakeaways: string[];
//   futureOutlook: string;
//   confidenceRating: {
//     score: number; // Out of 10
//     explanation: string;
//   };
//   domainDistribution: {
//     paper: number;
//     github: number;
//     article: number;
//     model: number;
//     benchmark: number;
//   };
// }

// export interface ResearchParameters {
//   topic: string;
//   intent: string;
//   outputStyle: string;
//   timeWindow: string;
//   subareas: string[];
//   searchTerms: string[];
// }

// export interface ResearchProject {
//   id: string;
//   topic: string;
//   timeWindow: "30d" | "90d" | "all";
//   mode: "summarize" | "compare" | "forecast" | "debate" | "explain_simply";
//   timestamp: string;
//   parameters: ResearchParameters;
//   sources: EvidenceSource[];
//   hypotheses: HypothesisDebate[];
//   report: SynthesisReport;
//   chatHistory: ChatMessage[];
// }

// export interface ChatMessage {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   timestamp: string;
//   citations?: string[]; // EvidenceSource IDs
// }




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
