// // import { Router } from "express";
// // import { createLLMClient } from "../llm/provider";
// // import { understandQuery } from "../agents/queryAgent";
// // import { searchOpenAlex } from "../services/openalex";
// // import { searchGitHub } from "../services/github";
// // import { searchHuggingFace } from "../services/huggingface";
// // import { rankSources } from "../utils/ranker";
// // import { readProjects, writeProjects } from "../storage/projects";
// // import type {
// //   ChatMessage,
// //   EvidenceSource,
// //   HypothesisDebate,
// //   ResearchParameters,
// //   ResearchProject,
// //   SynthesisReport,
// // } from "../../shared/research";

// // const router = Router();

// // function nowId(prefix: string) {
// //   return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
// // }

// // function safeString(value: unknown, fallback = "") {
// //   return typeof value === "string" && value.trim() ? value.trim() : fallback;
// // }

// // function clamp(n: number, min: number, max: number) {
// //   return Math.max(min, Math.min(max, n));
// // }

// // function countByType(sources: EvidenceSource[]) {
// //   return {
// //     paper: sources.filter((s) => s.source_type === "paper").length,
// //     github: sources.filter((s) => s.source_type === "github").length,
// //     article: sources.filter((s) => s.source_type === "article").length,
// //     model: sources.filter((s) => s.source_type === "model").length,
// //     benchmark: sources.filter((s) => s.source_type === "benchmark").length,
// //   };
// // }

// // function buildReport(
// //   topic: string,
// //   mode: string,
// //   timeWindow: string,
// //   sources: EvidenceSource[]
// // ): SynthesisReport {
// //   const distribution = countByType(sources);
// //   const total = sources.length;
// //   const topTitles = sources.slice(0, 3).map((s) => `${s.source_name}: ${s.title}`);

// //   return {
// //     executiveSummary:
// //       total > 0
// //         ? `Found ${total} live sources for "${topic}". The strongest signal currently comes from ${Object.entries(distribution).sort((a, b) => b[1] - a[1])[0][0]} evidence.`
// //         : `No live sources were returned for "${topic}", so this study used a fallback summary.`,
// //     keyTakeaways:
// //       total > 0
// //         ? [
// //             `Retrieved ${total} sources across papers, repositories, and model hubs.`,
// //             `Current mode: ${mode}.`,
// //             `Time window: ${timeWindow}.`,
// //             ...(topTitles.length ? [`Top sources: ${topTitles.join(" | ")}`] : []),
// //           ]
// //         : [
// //             `No live sources were returned.`,
// //             `Try a narrower query or a different subtopic.`,
// //             `Current mode: ${mode}.`,
// //           ],
// //     futureOutlook:
// //       total > 0
// //         ? `This topic appears active. The next step is to add stronger synthesis and debate across sources.`
// //         : `No strong trend signal yet. Try a narrower query or a different topic.`,
// //     confidenceRating: {
// //       score: total > 0 ? clamp(5 + Math.round(total / 4), 5, 9) : 2,
// //       explanation:
// //         total > 0
// //           ? "Moderate confidence because the system collected live evidence, but synthesis is still lightweight."
// //           : "Low confidence because no live evidence was returned.",
// //     },
// //     domainDistribution: distribution,
// //   };
// // }

// // function buildHypotheses(topic: string, sources: EvidenceSource[]): HypothesisDebate[] {
// //   const counts = countByType(sources);
// //   const total = sources.length;

// //   return [
// //     {
// //       id: nowId("hyp"),
// //       claim: `${topic} is moving toward retrieval-first workflows.`,
// //       pros: `The scan found ${counts.paper} paper(s), ${counts.github} GitHub repo(s), and ${counts.model} model(s). That mix is consistent with applied systems work.`,
// //       cons: "This could be a query bias effect: the topic may naturally surface modern retrieval and agentic content more easily than older baseline methods.",
// //       confidence_score: clamp(6 + Math.round(total / 6), 1, 10),
// //       evidence_strength: clamp(6 + Math.round(total / 5), 1, 10),
// //       novelty: 7,
// //       risk: 4,
// //       status: total > 0 ? "supported" : "contested",
// //       reasoning:
// //         total > 0
// //           ? "The evidence mix looks active, but the confidence is still moderate until stronger synthesis is added."
// //           : "No live evidence was found, so this remains tentative.",
// //     },
// //     {
// //       id: nowId("hyp"),
// //       claim: `Smaller specialized models still matter in ${topic}.`,
// //       pros: `${
// //         counts.model > 0
// //           ? "Hugging Face returned current model activity."
// //           : "Model activity is low in this scan, which means specialized models may be underrepresented."
// //       } Applied NLP often benefits from task-specific tuning.`,
// //       cons: "Large general-purpose models still dominate broad-use cases, so smaller models may remain niche unless benchmark and cost advantages are clear.",
// //       confidence_score: clamp(5 + Math.round((counts.model + counts.paper) / 4), 1, 10),
// //       evidence_strength: clamp(5 + Math.round((counts.model + counts.paper) / 4), 1, 10),
// //       novelty: 6,
// //       risk: 5,
// //       status: total > 0 ? "supported" : "contested",
// //       reasoning:
// //         "This is plausible, but it needs more benchmark evidence before calling it a durable shift.",
// //     },
// //     {
// //       id: nowId("hyp"),
// //       claim: `Evaluation is becoming more important than raw model size for ${topic}.`,
// //       pros: "Applied NLP systems are increasingly judged by quality, retrieval accuracy, latency, and robustness rather than just parameter count.",
// //       cons: "If the search is too narrow, benchmark-related evidence may be missing even when the field is active.",
// //       confidence_score: clamp(6 + Math.round(total / 7), 1, 10),
// //       evidence_strength: clamp(6 + Math.round(total / 7), 1, 10),
// //       novelty: 7,
// //       risk: 4,
// //       status: total > 0 ? "supported" : "contested",
// //       reasoning:
// //         "This is a strong operational claim, but it still benefits from explicit benchmark ingestion later.",
// //     },
// //   ];
// // }

// // function mergeProjects(projects: ResearchProject[], updated: ResearchProject) {
// //   return [updated, ...projects.filter((p) => p.id !== updated.id)];
// // }

// // router.get("/research/list", (_req, res) => {
// //   try {
// //     const projects = readProjects();
// //     res.json(
// //       projects.map((p) => ({
// //         id: p.id,
// //         topic: p.topic,
// //         timestamp: p.timestamp,
// //         timeWindow: p.timeWindow,
// //         mode: p.mode,
// //         summaryText: p.report?.executiveSummary ?? "",
// //         sourceCount: p.sources?.length ?? 0,
// //         hypothesisCount: p.hypotheses?.length ?? 0,
// //       }))
// //     );
// //   } catch (err: any) {
// //     console.error("Failed to load saved studies:", err);
// //     res.status(500).json({ error: "Failed to load saved studies" });
// //   }
// // });

// // router.get("/research/get/:id", (req, res) => {
// //   try {
// //     const projects = readProjects();
// //     const project = projects.find((p) => p.id === req.params.id);

// //     if (!project) {
// //       res.status(404).json({ error: "Study not found" });
// //       return;
// //     }

// //     res.json(project);
// //   } catch (err: any) {
// //     console.error("Failed to load study:", err);
// //     res.status(500).json({ error: "Failed to load study" });
// //   }
// // });

// // router.delete("/research/:id", (req, res) => {
// //   try {
// //     const projects = readProjects();
// //     const filtered = projects.filter((p) => p.id !== req.params.id);

// //     if (filtered.length === projects.length) {
// //       res.status(404).json({ error: "Study not found" });
// //       return;
// //     }

// //     writeProjects(filtered);
// //     res.json({ ok: true });
// //   } catch (err: any) {
// //     console.error("Failed to delete study:", err);
// //     res.status(500).json({ error: "Failed to delete study" });
// //   }
// // });

// // router.post("/research", async (req, res) => {
// //   try {
// //     const { query, timeWindow = "30d", mode = "summarize" } = req.body ?? {};

// //     if (!safeString(query)) {
// //       res.status(400).json({ error: "Query parameter is required" });
// //       return;
// //     }

// //     const llm = createLLMClient();
// //     const parsed = await understandQuery(llm, query, timeWindow, mode);

// //     const topic = safeString(parsed.topic, safeString(query));
// //     const researchTimeWindow =
// //       timeWindow === "30d" || timeWindow === "90d" || timeWindow === "all"
// //         ? timeWindow
// //         : "all";

// //     const [papersResult, reposResult, modelsResult] = await Promise.allSettled([
// //       searchOpenAlex(topic, researchTimeWindow),
// //       searchGitHub(topic),
// //       searchHuggingFace(topic),
// //     ]);

// //     const papers = papersResult.status === "fulfilled" ? papersResult.value : [];
// //     const repos = reposResult.status === "fulfilled" ? reposResult.value : [];
// //     const models = modelsResult.status === "fulfilled" ? modelsResult.value : [];

// //     const sources = rankSources([...papers, ...repos, ...models]);
// //     const hypotheses = buildHypotheses(topic, sources);
// //     const report = buildReport(topic, mode, researchTimeWindow, sources);

// //     const newProject: ResearchProject = {
// //       id: `proj_${Date.now()}`,
// //       topic,
// //       timeWindow: researchTimeWindow,
// //       mode,
// //       timestamp: new Date().toISOString(),
// //       parameters: {
// //         topic,
// //         intent: parsed.intent,
// //         outputStyle: parsed.outputStyle,
// //         timeWindow: parsed.timeWindow,
// //         subareas: parsed.subareas,
// //         searchTerms: parsed.searchTerms,
// //       } satisfies ResearchParameters,
// //       sources,
// //       hypotheses,
// //       report,
// //       chatHistory: [],
// //     };

// //     const projects = readProjects();
// //     writeProjects(mergeProjects(projects, newProject));

// //     res.json(newProject);
// //   } catch (err: any) {
// //     console.error("POST /api/research failed:", err);
// //     res.status(500).json({
// //       error: err?.message || "Research workflow failed",
// //     });
// //   }
// // });

// // router.post("/research/:id/chat", async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { message } = req.body ?? {};

// //     if (!safeString(message)) {
// //       res.status(400).json({ error: "Message is required" });
// //       return;
// //     }

// //     const projects = readProjects();
// //     const projectIndex = projects.findIndex((p) => p.id === id);

// //     if (projectIndex === -1) {
// //       res.status(404).json({ error: "Study not found" });
// //       return;
// //     }

// //     const project = projects[projectIndex];

// //     const userMessage: ChatMessage = {
// //       id: nowId("usr"),
// //       role: "user",
// //       content: String(message),
// //       timestamp: new Date().toISOString(),
// //     };

// //     const matchedSources = [...project.sources].slice(0, 3).map((s) => s.id);

// //     const answer: ChatMessage = {
// //       id: nowId("asst"),
// //       role: "assistant",
// //       content:
// //         matchedSources.length > 0
// //           ? `Based on the saved evidence for "${project.topic}", the most relevant sources are being surfaced in the source explorer. Ask me to summarize, compare, or forecast the trend.`
// //           : `I could not find a strong direct match in the saved evidence for "${project.topic}". Try a narrower question.`,
// //       timestamp: new Date().toISOString(),
// //       citations: matchedSources,
// //     };

// //     const updatedProject: ResearchProject = {
// //       ...project,
// //       chatHistory: [...project.chatHistory, userMessage, answer],
// //     };

// //     projects[projectIndex] = updatedProject;
// //     writeProjects(projects);

// //     res.json({ userMessage, answer });
// //   } catch (err: any) {
// //     console.error("POST /api/research/:id/chat failed:", err);
// //     res.status(500).json({
// //       error: err?.message || "Chat workflow failed",
// //     });
// //   }
// // });

// // export default router;

// // 

// // import { fetchArxivPapers } from "../agents/arxivAgent";
// // import { fetchGithubRepos } from "../agents/githubAgent";
// // import { fetchHuggingFaceModels } from "../agents/huggingfaceAgent";
// // import { dedupeAndSortSources } from "../utils/normalize";
// // import type { NormalizedSource, ResearchResult, TopicNode } from "../../shared/research";

// // router.post("/research/query", async (req, res) => {
// //   try {
// //     const query = String(req.body?.query ?? "").trim();
// //     const maxResults = Number(req.body?.maxResults ?? 10);

// //     if (!query) {
// //       res.status(400).json({ error: "query is required" });
// //       return;
// //     }

// //     const [arxiv, github, hf] = await Promise.allSettled([
// //       fetchArxivPapers(query, maxResults),
// //       fetchGithubRepos(query, maxResults),
// //       fetchHuggingFaceModels(query, maxResults),
// //     ]);

// //     const sources: NormalizedSource[] = dedupeAndSortSources([
// //       ...(arxiv.status === "fulfilled" ? arxiv.value : []),
// //       ...(github.status === "fulfilled" ? github.value : []),
// //       ...(hf.status === "fulfilled" ? hf.value : []),
// //     ]);

// //     const nodes: TopicNode[] = buildTopicNodes(query, sources);

// //     const result: ResearchResult = {
// //       query,
// //       generatedAt: new Date().toISOString(),
// //       nodes,
// //       sources,
// //       summary: {
// //         brief: buildBriefSummary(query, nodes, sources),
// //         extensive: buildExtensiveSummary(query, nodes, sources),
// //       },
// //     };

// //     res.json(result);
// //   } catch (err: any) {
// //     console.error("POST /api/research/query failed:", err);
// //     res.status(500).json({
// //       error: err?.message || "Failed to build research result",
// //     });
// //   }
// // });

// import { Router } from "express";
// import { fetchArxivPapers } from "../agents/arxivAgent";
// import { fetchIeeePapers } from "../agents/ieeeAgent";
// import { fetchTechNews } from "../agents/newsAgent";
// import { fetchGithubRepos } from "../agents/githubAgent";
// import { fetchHuggingFaceModels } from "../agents/huggingfaceAgent";
// import type {
//   NormalizedSource,
//   ResearchResult,
//   TopicNode,
// } from "../../shared/research";
// import { dedupeAndSortSources } from "../utils/normalize";

// const router = Router();

// function keywordMatchScore(text: string, keywords: string[]) {
//   const hay = text.toLowerCase();
//   let score = 0;
//   for (const kw of keywords) {
//     if (hay.includes(kw)) score += 1;
//   }
//   return score;
// }

// function buildTopicNodes(query: string, sources: NormalizedSource[]): TopicNode[] {
//   const topics = [
//     {
//       label: "Retrieval / RAG",
//       keywords: ["rag", "retrieval", "search", "grounding"],
//       hint: "Retrieval pipelines, source selection, and grounding.",
//     },
//     {
//       label: "Agents / Tool Use",
//       keywords: ["agent", "agents", "tool", "orchestration"],
//       hint: "Multi-agent workflows, orchestration, and tool use.",
//     },
//     {
//       label: "Evaluation / Benchmarks",
//       keywords: ["eval", "evaluation", "benchmark", "leaderboard"],
//       hint: "Metrics, benchmarks, and comparative performance.",
//     },
//     {
//       label: "Fine-tuning / Small Models",
//       keywords: ["fine-tuning", "lora", "qlora", "adapter", "small model"],
//       hint: "Specialized models, adapters, and efficient tuning.",
//     },
//     {
//       label: "Production / Infra",
//       keywords: ["deployment", "inference", "latency", "production", "infra"],
//       hint: "Serving, reliability, and systems concerns.",
//     },
//   ];

//   return topics
//     .map((topic, idx) => {
//       const matched = sources.filter((s) => {
//         const text = `${s.title} ${s.snippet} ${(s.tags ?? []).join(" ")}`.toLowerCase();
//         return topic.keywords.some((kw) => text.includes(kw));
//       });

//       const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
//       const queryBoost = matched.reduce((acc, src) => {
//         const text = `${src.title} ${src.snippet} ${(src.tags ?? []).join(" ")}`;
//         return acc + keywordMatchScore(text, queryTerms);
//       }, 0);

//       return {
//         id: `topic_${idx + 1}`,
//         label: topic.label,
//         score: matched.length * 10 + queryBoost,
//         sourceCount: matched.length,
//         sourceIds: matched.map((m) => m.id),
//         summaryHint: topic.hint,
//       };
//     })
//     .filter((node) => node.sourceCount > 0)
//     .sort((a, b) => b.score - a.score);
// }

// function buildBriefSummary(query: string, nodes: TopicNode[], sources: NormalizedSource[]) {
//   const top = nodes.slice(0, 3).map((n) => n.label).join(", ");
//   return [
//     `Top query: ${query}.`,
//     `Matched ${sources.length} sources across ${nodes.length} topic nodes.`,
//     top ? `Main themes: ${top}.` : `No strong topic cluster yet.`,
//   ].join(" ");
// }

// function buildExtensiveSummary(query: string, nodes: TopicNode[], sources: NormalizedSource[]) {
//   const counts = {
//     paper: sources.filter((s) => s.type === "paper").length,
//     article: sources.filter((s) => s.type === "article").length,
//     news: sources.filter((s) => s.type === "news").length,
//     repo: sources.filter((s) => s.type === "repo").length,
//     model: sources.filter((s) => s.type === "model").length,
//   };

//   const topNodes = nodes.slice(0, 5).map((n) => `- ${n.label} (${n.sourceCount})`).join("\n");
//   const topSources = sources.slice(0, 8).map((s) => `- [${s.type}] ${s.title}`).join("\n");

//   return [
//     `Query: ${query}`,
//     ``,
//     `Coverage`,
//     `- Papers: ${counts.paper}`,
//     `- Articles/News: ${counts.article + counts.news}`,
//     `- GitHub repos: ${counts.repo}`,
//     `- Hugging Face models: ${counts.model}`,
//     ``,
//     `Main topic nodes`,
//     topNodes || `- None yet`,
//     ``,
//     `Representative sources`,
//     topSources || `- None yet`,
//     ``,
//     `Interpretation`,
//     `This result set is organized so the user can click a node, inspect the sources behind it, and then choose either a brief or extensive summary.`,
//   ].join("\n");
// }

// router.post("/research/query", async (req, res) => {
//   try {
//     const query = String(req.body?.query ?? "").trim();
//     const maxResults = Number(req.body?.maxResults ?? 10);

//     if (!query) {
//       res.status(400).json({ error: "query is required" });
//       return;
//     }

//     const [arxiv, ieee, news, github, hf] = await Promise.allSettled([
//       fetchArxivPapers(query, maxResults),
//       fetchIeeePapers(query, maxResults),
//       fetchTechNews(query, maxResults),
//       fetchGithubRepos(query, maxResults),
//       fetchHuggingFaceModels(query, maxResults),
//     ]);

//     const sources: NormalizedSource[] = dedupeAndSortSources([
//       ...(arxiv.status === "fulfilled" ? arxiv.value : []),
//       ...(ieee.status === "fulfilled" ? ieee.value : []),
//       ...(news.status === "fulfilled" ? news.value : []),
//       ...(github.status === "fulfilled" ? github.value : []),
//       ...(hf.status === "fulfilled" ? hf.value : []),
//     ]);

//     const nodes = buildTopicNodes(query, sources);

//     const result: ResearchResult = {
//       query,
//       generatedAt: new Date().toISOString(),
//       nodes,
//       sources,
//       summary: {
//         brief: buildBriefSummary(query, nodes, sources),
//         extensive: buildExtensiveSummary(query, nodes, sources),
//       },
//     };

//     res.json(result);
//   } catch (err: any) {
//     console.error("POST /api/research/query failed:", err);
//     res.status(500).json({
//       error: err?.message || "Failed to build research result",
//     });
//   }
// });

// export default router;

import { Router } from "express";
import { fetchArxivPapers } from "../agents/arxivAgent";
import { fetchIeeePapers } from "../agents/ieeeAgent";
import { fetchTechNews } from "../agents/newsAgent";
import { fetchGithubRepos } from "../agents/githubAgent";
import { fetchHuggingFaceModels } from "../agents/huggingfaceAgent";
import { buildTopicNodes } from "../agents/topicNodeAgent";
import { synthesizeResearch } from "../agents/intelligenceAgent";
import { answerFromRetrievedSources } from "../agents/groundedFollowUpAgent";
import { understandQuery } from "../agents/queryAgent";
import { createLLMClient } from "../llm/provider";
import { dedupeAndSortSources } from "../utils/normalize";
import type { AgentRun, NormalizedSource, ResearchResult } from "../../shared/research";

const router = Router();

router.post("/research/query", async (req, res) => {
  try {
    const query = String(req.body?.query ?? "").trim();
    const maxResultsRaw = Number(req.body?.maxResults ?? 10);
    const maxResults = Number.isFinite(maxResultsRaw)
      ? Math.max(1, Math.min(maxResultsRaw, 25))
      : 10;

    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    let researchQueries = [query];
    let queryPlanningUsedLLM = false;
    try {
      const plan = await understandQuery(createLLMClient(), query, "all", "research");
      const candidates = [
        plan.topic,
        ...plan.searchTerms.slice(0, 3).map((term) =>
          plan.topic.toLowerCase().includes(term.toLowerCase()) ? plan.topic : `${plan.topic} ${term}`
        ),
      ];
      researchQueries = [...new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))].slice(0, 3);
      queryPlanningUsedLLM = true;
    } catch (error) {
      console.error("Query planning unavailable, using the original query:", error);
    }

    const resultsPerQuery = Math.max(3, Math.ceil(maxResults / researchQueries.length));
    const collectAcrossQueries = async (
      search: (researchQuery: string, limit: number) => Promise<NormalizedSource[]>
    ) => {
      const settled = await Promise.allSettled(
        researchQueries.map((researchQuery) => search(researchQuery, resultsPerQuery))
      );
      return settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    };

    const [arxiv, ieee, news, github, hf] = await Promise.allSettled([
      collectAcrossQueries(fetchArxivPapers),
      collectAcrossQueries(fetchIeeePapers),
      collectAcrossQueries(fetchTechNews),
      collectAcrossQueries(fetchGithubRepos),
      collectAcrossQueries(fetchHuggingFaceModels),
    ]);

    const sources: NormalizedSource[] = dedupeAndSortSources([
      ...(arxiv.status === "fulfilled" ? arxiv.value : []),
      ...(ieee.status === "fulfilled" ? ieee.value : []),
      ...(news.status === "fulfilled" ? news.value : []),
      ...(github.status === "fulfilled" ? github.value : []),
      ...(hf.status === "fulfilled" ? hf.value : []),
    ]);

    const nodes = await buildTopicNodes(query, sources);
    const synthesis = await synthesizeResearch(query, nodes, sources);

    const retrievalRuns: AgentRun[] = [
      ["arxiv", "arXiv Agent", arxiv],
      ["ieee", "IEEE Agent", ieee],
      ["news", "News Agent", news],
      ["github", "GitHub Agent", github],
      ["huggingface", "Hugging Face Agent", hf],
    ].map(([id, name, settled]) => {
      const result = settled as PromiseSettledResult<NormalizedSource[]>;
      const sourceCount = result.status === "fulfilled" ? result.value.length : 0;
      return {
        id: String(id),
        name: String(name),
        role: "retrieval" as const,
        status: result.status === "fulfilled" ? "completed" as const : "partial" as const,
        sourceCount,
        message: result.status === "fulfilled"
          ? sourceCount
            ? `Retrieved and normalized ${sourceCount} relevant records.`
            : "No matching records returned."
          : result.reason?.message || "Source was unavailable.",
      };
    });

    const agentRuns: AgentRun[] = [
      {
        id: "query-planner",
        name: "Research Planning Agent",
        role: "analysis",
        status: queryPlanningUsedLLM ? "completed" : "partial",
        sourceCount: researchQueries.length,
        message: queryPlanningUsedLLM
          ? `Expanded the question into ${researchQueries.length} focused research searches.`
          : "Used the original question because AI query planning was unavailable.",
      },
      ...retrievalRuns,
      {
        id: "keyword-analyst",
        name: "Knowledge Graph Agent",
        role: "analysis",
        status: "completed",
        sourceCount: nodes.length,
        message: `Extracted ${nodes.length} evidence-backed concepts and their source relationships.`,
      },
      {
        id: "synthesis",
        name: "Synthesis & Critic Agent",
        role: "synthesis",
        status: "completed",
        message: synthesis.usedLLM
          ? "Synthesized findings, agreements, tensions, implications, and evidence gaps."
          : "Built an evidence-grounded fallback synthesis; configured LLM was unavailable.",
      },
    ];

    const result: ResearchResult = {
      query,
      generatedAt: new Date().toISOString(),
      nodes,
      sources,
      summary: synthesis.summary,
      intelligence: {
        insights: synthesis.insights,
        consensus: synthesis.consensus,
        gaps: synthesis.gaps,
        agentRuns,
        usedLLM: synthesis.usedLLM,
      },
    };

    res.json(result);
  } catch (err: any) {
    console.error("POST /api/research/query failed:", err);
    res.status(500).json({
      error: err?.message || "Failed to build research result",
    });
  }
});

router.post("/research/follow-up", async (req, res) => {
  try {
    const question = String(req.body?.question ?? "").trim();
    const originalQuery = String(req.body?.originalQuery ?? "").trim();
    const suppliedSources = Array.isArray(req.body?.sources) ? req.body.sources : [];
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const sources: NormalizedSource[] = suppliedSources
      .filter((source: any) => source && source.id && source.title)
      .map((source: any) => ({
        id: String(source.id),
        type: source.type,
        title: String(source.title),
        url: String(source.url ?? ""),
        source: String(source.source ?? ""),
        publishedAt: String(source.publishedAt ?? ""),
        snippet: String(source.snippet ?? ""),
        tags: Array.isArray(source.tags) ? source.tags.map(String) : [],
        relevance: Number(source.relevance ?? 0),
        freshness: Number(source.freshness ?? 0),
      }));

    const answer = await answerFromRetrievedSources(question, originalQuery, sources, history);
    res.json(answer);
  } catch (err: any) {
    console.error("POST /api/research/follow-up failed:", err);
    res.status(500).json({ error: err?.message || "Failed to answer from retrieved documents" });
  }
});

export default router;
